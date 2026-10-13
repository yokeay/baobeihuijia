/**
 * 我好想你 · 站点与同步任务巡检（REQ-202610-0437）
 *
 * 每次运行做三类检查，异常时通过 ClodHost 邮件 API 告警到维护者：
 *   1. 站点：首页 / 、/api/stats 、/api/cases?limit=1 三项本机回环探测（与 deploy.sh 健康检查同口径）
 *   2. 同步任务：sync_runs 心跳与结果（最近一次运行失败/卡死/超时未跑）
 *   3. 数据量：各案件表行数对比上次快照，突变（骤降/暴涨）告警
 * 告警带冷却（同一问题默认 12 小时内不重复发），问题恢复后发恢复通知；
 * --report 发送周报/月报摘要。
 *
 * 运行方式（tsx 随 drizzle-kit 依赖提供）：
 *   node_modules/.bin/tsx scripts/inspect.ts [选项]
 *
 * 依赖的凭证/配置（运行时从环境变量或下列文件读取，不回显、不入库）：
 *   - /etc/clodhost/api-keys.env → CLODHOST_API_KEY / CLODHOST_API_BASE（发邮件）
 *   - <仓库>/.env               → DATABASE_URL（读 sync_runs 与数据量）
 *
 * 退出码：0 正常（含已发送/已抑制的告警）；1 内部错误或邮件发送失败；2 参数错误。
 */

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import { config as loadEnv } from "dotenv";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");

loadEnv({ path: "/etc/clodhost/api-keys.env", quiet: true });
loadEnv({ path: path.join(repoRoot, ".env"), quiet: true });

// ── 配置 ────────────────────────────────────────────────────────────────

interface Config {
  baseUrl: string; // 站点探测地址（本机回环）
  stateDir: string; // 状态目录（快照/告警冷却/可用性计数）
  alertEmails: string[]; // 告警收件人
  alertFromName: string; // 发件显示名
  clodhostApiBase: string;
  clodhostApiKey: string;
  databaseUrl: string;
  syncStaleHours: number; // 定时来源（香港）超过该小时数未运行 → 告警
  runningMaxHours: number; // running 状态超过该小时数 → 疑似卡死
  dropPct: number; // 数据量骤降：降幅百分比阈值
  dropMin: number; // 数据量骤降：绝对条数阈值（两者同时满足才告警）
  surgePct: number; // 数据量暴涨：涨幅百分比阈值
  surgeMin: number; // 数据量暴涨：绝对条数阈值
  cooldownHours: number; // 同一告警重复发送的最小间隔
  siteTimeoutMs: number; // 站点探测超时
}

function envInt(name: string, fallback: number): number {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : fallback;
}

function buildConfig(): Config {
  return {
    baseUrl: process.env.INSPECT_BASE_URL ?? "http://127.0.0.1:3000",
    stateDir: process.env.INSPECT_STATE_DIR ?? "/var/lib/baobeihuijia-inspect",
    alertEmails: (process.env.INSPECT_ALERT_EMAILS ?? "scx@polofox.com")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    alertFromName: process.env.INSPECT_ALERT_FROM_NAME ?? "我好想你·巡检",
    clodhostApiBase: process.env.CLODHOST_API_BASE ?? "https://clodhost.com/api",
    clodhostApiKey: process.env.CLODHOST_API_KEY ?? "",
    databaseUrl: process.env.DATABASE_URL ?? "",
    syncStaleHours: envInt("INSPECT_SYNC_STALE_HOURS", 26),
    runningMaxHours: envInt("INSPECT_RUNNING_MAX_HOURS", 3),
    dropPct: envInt("INSPECT_DROP_PCT", 2),
    dropMin: envInt("INSPECT_DROP_MIN", 10),
    surgePct: envInt("INSPECT_SURGE_PCT", 20),
    surgeMin: envInt("INSPECT_SURGE_MIN", 100),
    cooldownHours: envInt("INSPECT_ALERT_COOLDOWN_HOURS", 12),
    siteTimeoutMs: envInt("INSPECT_SITE_TIMEOUT_MS", 15000),
  };
}

// 同步来源：hongkong 由 cron 每日触发（7 3 * * *）；其余为手动触发
// （mainland 的 cron 已于 2026-09 停用，若重新启用请把 scheduled 改为 true）。
const SYNC_SOURCES = [
  { key: "mainland", label: "大陆", scheduled: false },
  { key: "hongkong", label: "香港", scheduled: true },
  { key: "namus", label: "美国", scheduled: false },
  { key: "korea", label: "韩国", scheduled: false },
  { key: "cndes", label: "西班牙", scheduled: false },
] as const;

// 数据量检查：表与口径（大陆取已审核数，即对外可见量）
const DATA_TABLES = [
  { key: "cases", label: "大陆（已审核）", sql: "SELECT count(*)::int AS n FROM cases WHERE status = 'approved'" },
  { key: "cases_us", label: "美国", sql: "SELECT count(*)::int AS n FROM cases_us" },
  { key: "cases_hk", label: "香港", sql: "SELECT count(*)::int AS n FROM cases_hk" },
  { key: "cases_kr", label: "韩国", sql: "SELECT count(*)::int AS n FROM cases_kr" },
  { key: "cases_es", label: "西班牙", sql: "SELECT count(*)::int AS n FROM cases_es" },
] as const;

const SIMULATE_KINDS = ["site-down", "sync-error", "data-drop", "db-down"] as const;

// ── 类型 ────────────────────────────────────────────────────────────────

interface Issue {
  key: string; // 稳定标识（告警去重/冷却/恢复都按它）
  title: string;
  detail: string;
}

interface SiteProbe {
  name: string;
  ok: boolean;
  note: string;
}

interface SyncLatest {
  source: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  added: number | null;
  errors: number | null;
  lastError: string | null;
}

interface SyncAggRow {
  source: string;
  runs: number;
  ok_runs: number;
  bad_runs: number;
  added_total: number;
  last_started: string | Date | null;
}

interface Snapshot {
  takenAt: string;
  counts: Record<string, number>;
}

interface AlertRecord {
  open: boolean;
  firstSeenAt: string;
  lastSentAt: string | null;
}

interface State {
  version: 1;
  lastSnapshot: Snapshot | null;
  daily: Record<string, Record<string, number>>; // YYYY-MM-DD → counts（保留最近 40 天）
  syncBaselineAt: string | null; // 首次巡检时香港尚无运行记录 → 记起点，超时后告警
  alerts: Record<string, AlertRecord>;
  uptime: { since: string; checks: number; failures: number };
  lastRun: { at: string; issues: string[]; alertsSent: number; suppressed: number } | null;
  lastReportAt: string | null;
}

interface AlertDecision {
  toSend: Issue[];
  reminders: Issue[];
  recoveries: string[];
  updated: Record<string, AlertRecord>;
  base: Record<string, AlertRecord>;
}

interface CliOptions {
  mode: "check" | "report" | "self-test";
  dryRun: boolean;
  verbose: boolean;
  help: boolean;
  simulate: string | null;
  days: number;
}

// ── 纯函数：判断逻辑（自测覆盖） ────────────────────────────────────────

function hoursBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / 36e5;
}

function addHours(d: Date, h: number): Date {
  return new Date(d.getTime() + h * 36e5);
}

// 同步来源「心跳与结果」判断：卡死 > 失败 > 超时未运行
function evaluateSyncSource(
  source: { key: string; label: string; scheduled: boolean },
  latest: SyncLatest | null,
  now: Date,
  cfg: Pick<Config, "syncStaleHours" | "runningMaxHours">,
  syncBaselineAt: string | null
): { issue: Issue | null; newBaseline?: string } {
  const label = source.label;
  if (!latest) {
    if (!source.scheduled) return { issue: null }; // 手动来源：无记录是常态
    if (!syncBaselineAt) return { issue: null, newBaseline: now.toISOString() };
    const graceH = hoursBetween(new Date(syncBaselineAt), now);
    if (graceH > cfg.syncStaleHours) {
      return {
        issue: {
          key: `sync-stale:${source.key}`,
          title: `${label}同步任务没有运行记录`,
          detail: `自首次巡检（${fmtCst(syncBaselineAt)}）以来已超过 ${Math.round(graceH)} 小时，sync_runs 里没有任何「${source.key}」运行记录。\n  检查：crontab -l（应有 7 3 * * *）与 journalctl -u baobeihuijia -n 100`,
        },
      };
    }
    return { issue: null };
  }
  const ageH = hoursBetween(new Date(latest.startedAt), now);
  if (latest.status === "running") {
    if (ageH > cfg.runningMaxHours) {
      return {
        issue: {
          key: `sync-hung:${source.key}`,
          title: `${label}同步任务疑似卡死`,
          detail: `最近一次运行自 ${fmtCst(latest.startedAt)} 起处于 running 状态已 ${ageH.toFixed(1)} 小时（超过 ${cfg.runningMaxHours} 小时阈值）。`,
        },
      };
    }
    return { issue: null };
  }
  if (latest.status === "error" || latest.status === "failed") {
    return {
      issue: {
        key: `sync-error:${source.key}`,
        title: `${label}同步任务最近一次运行${latest.status === "failed" ? "失败" : "有错误"}`,
        detail: `最近一次运行：${fmtCst(latest.startedAt)}（${ageH.toFixed(1)} 小时前）\n  错误数：${latest.errors ?? "?"}；最后错误：${latest.lastError ?? "（未记录）"}`,
      },
    };
  }
  if (source.scheduled && ageH > cfg.syncStaleHours) {
    return {
      issue: {
        key: `sync-stale:${source.key}`,
        title: `${label}同步任务超过 ${cfg.syncStaleHours} 小时未运行`,
        detail: `最近一次运行：${fmtCst(latest.startedAt)}（${ageH.toFixed(1)} 小时前）。该来源由定时任务每日触发，超过阈值未运行可能意味着 cron 或服务异常。`,
      },
    };
  }
  return { issue: null };
}

// 数据量突变判断：骤降与暴涨都要求「绝对条数 + 百分比」双阈值同时满足
function evaluateDataChange(
  key: string,
  label: string,
  prev: number | null,
  cur: number,
  cfg: Pick<Config, "dropPct" | "dropMin" | "surgePct" | "surgeMin">
): Issue | null {
  if (prev == null || prev <= 0) return null; // 首次快照，只做基线
  const diff = cur - prev;
  const pct = (diff / prev) * 100;
  if (diff < 0 && -diff >= cfg.dropMin && -pct >= cfg.dropPct) {
    return {
      key: `data-drop:${key}`,
      title: `数据量异常下降：${label}`,
      detail: `${label} ${prev} → ${cur}（${diff}，${pct.toFixed(1)}%）\n  阈值：下降 ≥ ${cfg.dropMin} 条且 ≥ ${cfg.dropPct}%。请确认是否有误删或上游变化。`,
    };
  }
  if (diff > 0 && diff >= cfg.surgeMin && pct >= cfg.surgePct) {
    return {
      key: `data-surge:${key}`,
      title: `数据量异常增长：${label}`,
      detail: `${label} ${prev} → ${cur}（+${diff}，+${pct.toFixed(1)}%）\n  阈值：增长 ≥ ${cfg.surgeMin} 条且 ≥ ${cfg.surgePct}%。`,
    };
  }
  return null;
}

// 告警状态流转：新问题→发送；冷却内→抑制；冷却外仍未恢复→提醒；问题消失→恢复通知
function applyAlertPolicy(issues: Issue[], state: State, now: Date, cooldownHours: number): AlertDecision {
  const current = new Map(issues.map((i) => [i.key, i]));
  const toSend: Issue[] = [];
  const reminders: Issue[] = [];
  const recoveries: string[] = [];
  const updated: Record<string, AlertRecord> = { ...state.alerts };
  for (const issue of issues) {
    const rec = updated[issue.key];
    if (!rec || !rec.open) {
      updated[issue.key] = { open: true, firstSeenAt: now.toISOString(), lastSentAt: null };
      toSend.push(issue);
    } else {
      const last = rec.lastSentAt ? new Date(rec.lastSentAt) : null;
      if (!last || hoursBetween(last, now) >= cooldownHours) reminders.push(issue);
      // 冷却中：保持 open，不重复发送
    }
  }
  for (const [key, rec] of Object.entries(state.alerts)) {
    if (rec.open && !current.has(key)) {
      updated[key] = { ...rec, open: false };
      recoveries.push(key);
    }
  }
  return { toSend, reminders, recoveries, updated, base: state.alerts };
}

// 根据邮件发送结果落定状态：发送成功才记 lastSentAt；恢复邮件失败则保持 open 以便下次重试
function finalizeDecision(
  d: AlertDecision,
  alertsSentOk: boolean,
  recoverySentOk: boolean,
  now: Date
): Record<string, AlertRecord> {
  const out = { ...d.updated };
  if (alertsSentOk) {
    for (const it of [...d.toSend, ...d.reminders]) {
      const rec = out[it.key];
      if (rec) out[it.key] = { ...rec, lastSentAt: now.toISOString() };
    }
  }
  if (!recoverySentOk) {
    for (const k of d.recoveries) {
      if (d.base[k]) out[k] = d.base[k];
    }
  }
  return out;
}

function describeKey(key: string): string {
  const [kind, sub] = key.split(":");
  const srcLabel = SYNC_SOURCES.find((s) => s.key === sub)?.label;
  const tblLabel = DATA_TABLES.find((t) => t.key === sub)?.label;
  switch (kind) {
    case "site-down":
      return "站点检查未通过";
    case "db-down":
      return "数据库不可达";
    case "sync-runs-missing":
      return "sync_runs 表不存在（迁移未应用）";
    case "sync-error":
      return `${srcLabel ?? sub}同步任务运行失败`;
    case "sync-hung":
      return `${srcLabel ?? sub}同步任务疑似卡死`;
    case "sync-stale":
      return `${srcLabel ?? sub}同步任务超时未运行`;
    case "data-drop":
      return `数据量异常下降（${tblLabel ?? sub}）`;
    case "data-surge":
      return `数据量异常增长（${tblLabel ?? sub}）`;
    default:
      return key;
  }
}

function simulatedIssue(kind: string, cfg: Config): Issue {
  switch (kind) {
    case "site-down":
      return {
        key: "site-down",
        title: "站点检查未通过（3/3 项失败）",
        detail: `（模拟）首页 /、/api/stats、/api/cases?limit=1 三项探测均失败。\n  探测地址：${cfg.baseUrl}`,
      };
    case "sync-error":
      return {
        key: "sync-error:hongkong",
        title: "香港同步任务最近一次运行失败",
        detail: "（模拟）最近一次运行失败；错误数 1；最后错误：HTTP 500（上游接口不可用）",
      };
    case "data-drop":
      return {
        key: "data-drop:cases_hk",
        title: "数据量异常下降：香港",
        detail: "（模拟）香港 40 → 35（-5，-12.5%）",
      };
    case "db-down":
      return {
        key: "db-down",
        title: "数据库不可达",
        detail: "（模拟）数据库连接失败：connection refused",
      };
    default:
      throw new Error(`未知 simulate 类型：${kind}`);
  }
}

// ── 时间/文案工具 ───────────────────────────────────────────────────────

function fmtCst(input: string | Date | null | undefined): string {
  if (!input) return "—";
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return String(input);
  const parts: Record<string, string> = {};
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  for (const part of fmt.formatToParts(d)) {
    if (part.type !== "literal") parts[part.type] = part.value;
  }
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}

function fmtDay(d: Date): string {
  const parts: Record<string, string> = {};
  const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" });
  for (const part of fmt.formatToParts(d)) {
    if (part.type !== "literal") parts[part.type] = part.value;
  }
  return `${parts.month}-${parts.day}`;
}

function fmtDelta(diff: number): string {
  return diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : "±0";
}

function indent(text: string): string {
  return text
    .split("\n")
    .map((l) => `   ${l}`)
    .join("\n");
}

// ── 邮件 ────────────────────────────────────────────────────────────────

function buildAlertEmail(
  toSend: Issue[],
  reminders: Issue[],
  now: Date,
  cfg: Config,
  test: boolean
): { subject: string; text: string } {
  const subjectBase =
    toSend.length === 1 && reminders.length === 0
      ? `【我好想你·巡检】${toSend[0].title}`
      : reminders.length > 0 && toSend.length === 0
        ? `【我好想你·巡检】仍有 ${reminders.length} 个异常未恢复`
        : `【我好想你·巡检】发现 ${toSend.length} 个新异常`;
  const subject = ((test ? "[测试] " : "") + subjectBase).slice(0, 180);
  const lines: string[] = [];
  lines.push(`巡检时间：${fmtCst(now)}（北京时间）`);
  lines.push(`站点地址：${cfg.baseUrl}`);
  lines.push("");
  if (toSend.length > 0) {
    lines.push("【新发现】");
    toSend.forEach((it, i) => lines.push(`${i + 1}. ${it.title}`, indent(it.detail), ""));
  }
  if (reminders.length > 0) {
    lines.push("【仍未恢复】");
    reminders.forEach((it, i) => lines.push(`${i + 1}. ${it.title}`, indent(it.detail), ""));
  }
  lines.push("—— 本邮件由巡检脚本自动发出（scripts/inspect.ts）。问题恢复后会再发一封恢复通知。");
  return { subject, text: lines.join("\n") };
}

function buildRecoveryEmail(keys: string[], now: Date, cfg: Config): { subject: string; text: string } {
  const titles = keys.map(describeKey);
  const subject = `【我好想你·巡检】已恢复：${titles.join("、")}`.slice(0, 180);
  const lines = [
    `巡检时间：${fmtCst(now)}（北京时间）`,
    `站点地址：${cfg.baseUrl}`,
    "",
    "以下问题已恢复：",
    ...titles.map((t) => `  ✓ ${t}`),
    "",
    "—— 本邮件由巡检脚本自动发出（scripts/inspect.ts）。",
  ];
  return { subject, text: lines.join("\n") };
}

async function sendMail(cfg: Config, subject: string, text: string): Promise<boolean> {
  if (!cfg.clodhostApiKey) {
    console.error("[inspect] 缺少 CLODHOST_API_KEY（/etc/clodhost/api-keys.env），无法发邮件");
    return false;
  }
  let allOk = true;
  for (const to of cfg.alertEmails) {
    try {
      const res = await fetch(`${cfg.clodhostApiBase}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.clodhostApiKey}` },
        body: JSON.stringify({ to, subject, text, from_name: cfg.alertFromName }),
        signal: AbortSignal.timeout(20000),
      });
      const bodyText = (await res.text()).slice(0, 300);
      if (res.ok) {
        console.log(`[inspect] 邮件已发送至 ${to}（HTTP ${res.status}）`);
      } else {
        console.error(`[inspect] 邮件发送失败：${to} HTTP ${res.status} ${bodyText}`);
        allOk = false;
      }
    } catch (err) {
      console.error(`[inspect] 邮件发送异常：${to}`, err);
      allOk = false;
    }
  }
  return allOk;
}

// ── 状态读写 ────────────────────────────────────────────────────────────

function defaultState(now: Date): State {
  return {
    version: 1,
    lastSnapshot: null,
    daily: {},
    syncBaselineAt: null,
    alerts: {},
    uptime: { since: now.toISOString(), checks: 0, failures: 0 },
    lastRun: null,
    lastReportAt: null,
  };
}

function loadState(cfg: Config): State {
  const p = path.join(cfg.stateDir, "state.json");
  try {
    if (!existsSync(p)) return defaultState(new Date());
    const parsed = JSON.parse(readFileSync(p, "utf8")) as Partial<State>;
    if (parsed.version !== 1) throw new Error(`未知状态版本：${String(parsed.version)}`);
    return { ...defaultState(new Date()), ...parsed } as State;
  } catch (err) {
    console.error("[inspect] 读取状态失败，使用默认状态：", err);
    return defaultState(new Date());
  }
}

function saveState(cfg: Config, state: State): boolean {
  try {
    mkdirSync(cfg.stateDir, { recursive: true });
    const p = path.join(cfg.stateDir, "state.json");
    const tmp = `${p}.tmp`;
    writeFileSync(tmp, JSON.stringify(state, null, 2));
    renameSync(tmp, p);
    return true;
  } catch (err) {
    console.error("[inspect] 写入状态失败：", err);
    return false;
  }
}

function updateDaily(daily: Record<string, Record<string, number>>, now: Date, counts: Record<string, number>): Record<string, Record<string, number>> {
  const day = now.toISOString().slice(0, 10);
  const out = { ...daily, [day]: counts };
  const keys = Object.keys(out).sort();
  while (keys.length > 40) {
    const k = keys.shift();
    if (k) delete out[k];
  }
  return out;
}

function pickBaseline(daily: Record<string, Record<string, number>>, now: Date): { date: string; counts: Record<string, number> } | null {
  const keys = Object.keys(daily).sort();
  if (keys.length === 0) return null;
  const cutoff = new Date(now.getTime() - 8 * 864e5).toISOString().slice(0, 10);
  const inWindow = keys.filter((k) => k >= cutoff);
  const pick = (inWindow.length > 0 ? inWindow : keys)[0];
  return { date: pick, counts: daily[pick] };
}

// ── 检查项（网络/数据库） ────────────────────────────────────────────────

async function probeOne(
  name: string,
  url: string,
  validate: (res: Response) => Promise<string | null>,
  timeoutMs: number
): Promise<SiteProbe> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { "user-agent": "baobeihuijia-inspect/1.0" },
    });
    if (res.status !== 200) return { name, ok: false, note: `HTTP ${res.status}` };
    const err = await validate(res);
    return err ? { name, ok: false, note: err } : { name, ok: true, note: "OK" };
  } catch (err) {
    return { name, ok: false, note: err instanceof Error ? err.message : String(err) };
  }
}

async function probeSite(cfg: Config): Promise<SiteProbe[]> {
  const base = cfg.baseUrl.replace(/\/+$/, "");
  return [
    await probeOne("首页 /", `${base}/`, async () => null, cfg.siteTimeoutMs),
    await probeOne(
      "/api/stats",
      `${base}/api/stats`,
      async (res) => {
        const j = (await res.json().catch(() => null)) as { total?: unknown } | null;
        return j && typeof j.total === "number" ? null : "响应不是含数值 total 的 JSON";
      },
      cfg.siteTimeoutMs
    ),
    await probeOne(
      "/api/cases?limit=1",
      `${base}/api/cases?limit=1`,
      async (res) => {
        const j = (await res.json().catch(() => null)) as { items?: unknown } | null;
        return j && Array.isArray(j.items) ? null : "响应不是含 items 数组的 JSON";
      },
      cfg.siteTimeoutMs
    ),
  ];
}

function siteIssue(probes: SiteProbe[], cfg: Config): Issue | null {
  const bad = probes.filter((p) => !p.ok);
  if (bad.length === 0) return null;
  return {
    key: "site-down",
    title: `站点检查未通过（${bad.length}/${probes.length} 项失败）`,
    detail: `${bad.map((b) => `· ${b.name}：${b.note}`).join("\n")}\n  探测地址：${cfg.baseUrl}（本机回环）`,
  };
}

function isMissingTable(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "42P01";
}

async function fetchLatestRuns(client: Client): Promise<Map<string, SyncLatest>> {
  const res = await client.query(
    `SELECT DISTINCT ON (source) source, status, started_at, finished_at, added, errors, last_error
       FROM sync_runs ORDER BY source, started_at DESC`
  );
  const map = new Map<string, SyncLatest>();
  for (const row of res.rows) {
    map.set(row.source, {
      source: row.source,
      status: row.status,
      startedAt: new Date(row.started_at).toISOString(),
      finishedAt: row.finished_at ? new Date(row.finished_at).toISOString() : null,
      added: row.added,
      errors: row.errors,
      lastError: row.last_error,
    });
  }
  return map;
}

async function fetchCounts(client: Client): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const t of DATA_TABLES) {
    const res = await client.query(t.sql);
    counts[t.key] = res.rows[0].n;
  }
  return counts;
}

async function fetchSyncAggregate(client: Client, days: number): Promise<SyncAggRow[]> {
  const res = await client.query(
    `SELECT source,
        count(*)::int AS runs,
        count(*) FILTER (WHERE status = 'ok')::int AS ok_runs,
        count(*) FILTER (WHERE status IN ('error', 'failed'))::int AS bad_runs,
        COALESCE(sum(added), 0)::int AS added_total,
        max(started_at) AS last_started
       FROM sync_runs
      WHERE started_at >= NOW() - interval '${days} days'
      GROUP BY source ORDER BY source`
  );
  return res.rows as SyncAggRow[];
}

// ── 报告 ────────────────────────────────────────────────────────────────

function buildReportText(data: {
  now: Date;
  cfg: Config;
  state: State;
  counts: Record<string, number> | null;
  syncAgg: SyncAggRow[] | null;
  dbError: string | null;
  days: number;
}): { subject: string; text: string } {
  const { now, cfg, state, counts, syncAgg, dbError, days } = data;
  const periodLabel = days >= 28 ? "月报" : "周报";
  const start = new Date(now.getTime() - days * 864e5);
  const subject = `【我好想你·巡检${periodLabel}】${fmtDay(start)} ~ ${fmtDay(now)}`;
  const lines: string[] = [];
  lines.push(`我好想你 · 巡检${periodLabel}（近 ${days} 天）`);
  lines.push(`统计时间：${fmtCst(now)}（北京时间）｜站点：${cfg.baseUrl}`);
  lines.push("");
  lines.push("【站点】");
  lines.push(`探测 ${state.uptime.checks} 次，失败 ${state.uptime.failures} 次（自 ${fmtCst(state.uptime.since)} 起累计）`);
  lines.push("");
  lines.push("【数据量】");
  if (counts) {
    const baseline = pickBaseline(state.daily, now);
    if (baseline) {
      lines.push(`对比基线：${baseline.date}`);
      for (const t of DATA_TABLES) {
        const prev = baseline.counts[t.key];
        const cur = counts[t.key];
        if (prev == null || cur == null) continue;
        lines.push(`  ${t.label}：${prev.toLocaleString("zh-CN")} → ${cur.toLocaleString("zh-CN")}（${fmtDelta(cur - prev)}）`);
      }
    } else {
      lines.push("首次运行，暂无对比基线。当前值：");
      for (const t of DATA_TABLES) lines.push(`  ${t.label}：${(counts[t.key] ?? 0).toLocaleString("zh-CN")}`);
    }
  } else {
    lines.push(`数据库不可达：${dbError ?? "未知错误"}`);
  }
  lines.push("");
  lines.push(`【同步任务】（近 ${days} 天）`);
  if (syncAgg) {
    for (const src of SYNC_SOURCES) {
      const row = syncAgg.find((r) => r.source === src.key);
      if (!row) {
        lines.push(`  ${src.label}：无运行记录${src.scheduled ? "（定时来源，需关注）" : "（手动触发）"}`);
        continue;
      }
      const last = row.last_started ? fmtCst(row.last_started) : "—";
      lines.push(`  ${src.label}：${row.runs} 次运行，成功 ${row.ok_runs}，失败/错误 ${row.bad_runs}，新增 ${row.added_total} 条，最近 ${last}`);
    }
  } else {
    lines.push(`  数据库不可达，无法统计：${dbError ?? ""}`);
  }
  lines.push("");
  lines.push("【未解决告警】");
  const openAlerts = Object.entries(state.alerts).filter(([, r]) => r.open);
  if (openAlerts.length === 0) lines.push("  无");
  else for (const [key, rec] of openAlerts) lines.push(`  · ${describeKey(key)}（首次发现 ${fmtCst(rec.firstSeenAt)}）`);
  lines.push("");
  lines.push("—— 本邮件由巡检脚本自动发出（scripts/inspect.ts，REQ-202610-0437）。阈值与收件人可用 INSPECT_* 环境变量调整。");
  return { subject, text: lines.join("\n") };
}

// ── 运行流程 ────────────────────────────────────────────────────────────

async function runCheck(cfg: Config, now: Date, opts: CliOptions): Promise<number> {
  console.log(`[inspect] ${now.toISOString()} 开始检查（${opts.dryRun ? "dry-run" : "正式"}${opts.simulate ? `，simulate=${opts.simulate}` : ""}）`);
  if (opts.verbose) {
    console.log(`[inspect] 配置：baseUrl=${cfg.baseUrl} stateDir=${cfg.stateDir} 收件人=${cfg.alertEmails.join(",")} 心跳阈值=${cfg.syncStaleHours}h 冷却=${cfg.cooldownHours}h`);
  }
  const state = loadState(cfg);
  const issues: Issue[] = [];
  let siteProbes: SiteProbe[] | null = null;
  let counts: Record<string, number> | null = null;
  let newBaseline: string | undefined;
  let dbError: string | null = null;

  if (opts.simulate) {
    issues.push(simulatedIssue(opts.simulate, cfg));
  } else {
    // 1) 站点
    siteProbes = await probeSite(cfg);
    const si = siteIssue(siteProbes, cfg);
    if (si) issues.push(si);
    console.log(`[inspect] 站点检查：${siteProbes.every((p) => p.ok) ? "通过（3/3）" : "未通过"}`);

    // 2) 数据库：同步心跳与结果 + 数据量
    let client: Client | null = null;
    try {
      client = new Client({ connectionString: cfg.databaseUrl, connectionTimeoutMillis: 10000 });
      await client.connect();
      try {
        const latest = await fetchLatestRuns(client);
        for (const src of SYNC_SOURCES) {
          const r = evaluateSyncSource(src, latest.get(src.key) ?? null, now, cfg, state.syncBaselineAt);
          if (r.issue) issues.push(r.issue);
          if (r.newBaseline) newBaseline = r.newBaseline;
        }
        if (opts.verbose) {
          const lines = SYNC_SOURCES.map((s) => {
            const l = latest.get(s.key);
            return `${s.label}=${l ? `${l.status}@${fmtCst(l.startedAt)}` : "无记录"}`;
          });
          console.log(`[inspect] 同步任务：${lines.join(" ")}`);
        }
      } catch (err) {
        if (isMissingTable(err)) {
          issues.push({
            key: "sync-runs-missing",
            title: "sync_runs 表不存在",
            detail: "数据库中没有 sync_runs 表（迁移 drizzle/0005_sync_runs.sql 未应用？），同步任务将无法记录运行历史。",
          });
          console.error("[inspect] sync_runs 表不存在（迁移未应用？）");
        } else {
          throw err;
        }
      }
      counts = await fetchCounts(client);
      for (const t of DATA_TABLES) {
        const prev = state.lastSnapshot?.counts?.[t.key] ?? null;
        const ci = evaluateDataChange(t.key, t.label, prev, counts[t.key], cfg);
        if (ci) issues.push(ci);
      }
      console.log(`[inspect] 数据量：${DATA_TABLES.map((t) => `${t.key}=${counts?.[t.key]}`).join(" ")}`);
    } catch (err) {
      dbError = err instanceof Error ? err.message : String(err);
      issues.push({
        key: "db-down",
        title: "数据库不可达",
        detail: `连接或查询失败：${dbError}\n  检查：PostgreSQL 服务与 ${path.join(repoRoot, ".env")} 中的 DATABASE_URL。`,
      });
      console.error(`[inspect] 数据库检查失败：${dbError}`);
    } finally {
      if (client) await client.end().catch(() => {});
    }
  }

  // 3) 告警策略与发送
  const decision = applyAlertPolicy(issues, state, now, cfg.cooldownHours);
  const testMode = Boolean(opts.simulate);
  let emailOk = true;
  let alertsSentOk = true;
  let recoverySentOk = true;
  if (opts.dryRun) {
    console.log(
      `[inspect] dry-run：发现 ${issues.length} 个问题；将发送 ${decision.toSend.length} 条新告警、${decision.reminders.length} 条提醒、${decision.recoveries.length} 条恢复通知（未发邮件、未写状态）`
    );
    for (const it of issues) console.log(`  - [${it.key}] ${it.title}`);
  } else {
    if (decision.toSend.length > 0 || decision.reminders.length > 0) {
      const mail = buildAlertEmail(decision.toSend, decision.reminders, now, cfg, testMode);
      alertsSentOk = await sendMail(cfg, mail.subject, mail.text);
      emailOk = emailOk && alertsSentOk;
    }
    if (decision.recoveries.length > 0) {
      const mail = buildRecoveryEmail(decision.recoveries, now, cfg);
      recoverySentOk = await sendMail(cfg, mail.subject, mail.text);
      emailOk = emailOk && recoverySentOk;
    }
  }

  // 4) 落状态（dry-run / simulate 不落，避免测试污染）
  if (!opts.dryRun && !opts.simulate) {
    const alertsFinal = finalizeDecision(decision, alertsSentOk, recoverySentOk, now);
    const next: State = {
      ...state,
      lastSnapshot: counts ? { takenAt: now.toISOString(), counts } : state.lastSnapshot,
      daily: counts ? updateDaily(state.daily, now, counts) : state.daily,
      syncBaselineAt: newBaseline ?? state.syncBaselineAt,
      alerts: alertsFinal,
      uptime: {
        ...state.uptime,
        checks: state.uptime.checks + 1,
        failures: state.uptime.failures + (siteProbes && siteProbes.some((p) => !p.ok) ? 1 : 0),
      },
      lastRun: {
        at: now.toISOString(),
        issues: issues.map((i) => i.key),
        alertsSent: decision.toSend.length + decision.reminders.length,
        suppressed: issues.length - decision.toSend.length - decision.reminders.length,
      },
    };
    if (!saveState(cfg, next)) emailOk = false;
  }

  console.log(`[inspect] 完成：发现 ${issues.length} 个问题${emailOk ? "" : "；⚠️ 有邮件发送或状态写入失败"}`);
  return emailOk ? 0 : 1;
}

async function runReport(cfg: Config, now: Date, opts: CliOptions): Promise<number> {
  console.log(`[inspect] ${now.toISOString()} 生成报告（近 ${opts.days} 天${opts.dryRun ? "，dry-run" : ""}）`);
  const state = loadState(cfg);
  let counts: Record<string, number> | null = null;
  let syncAgg: SyncAggRow[] | null = null;
  let dbError: string | null = null;
  let client: Client | null = null;
  try {
    client = new Client({ connectionString: cfg.databaseUrl, connectionTimeoutMillis: 10000 });
    await client.connect();
    counts = await fetchCounts(client);
    syncAgg = await fetchSyncAggregate(client, opts.days);
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
    console.error(`[inspect] 报告数据读取失败：${dbError}`);
  } finally {
    if (client) await client.end().catch(() => {});
  }
  const mail = buildReportText({ now, cfg, state, counts, syncAgg, dbError, days: opts.days });
  if (opts.dryRun) {
    console.log(`[inspect] dry-run 报告主题：${mail.subject}`);
    console.log(mail.text);
    return 0;
  }
  const ok = await sendMail(cfg, mail.subject, mail.text);
  if (ok) {
    const next: State = {
      ...state,
      lastReportAt: now.toISOString(),
      uptime: { since: now.toISOString(), checks: 0, failures: 0 },
    };
    saveState(cfg, next);
  }
  console.log(`[inspect] 报告${ok ? "已发送" : "发送失败"}：${mail.subject}`);
  return ok ? 0 : 1;
}

// ── 自测（不访问网络/数据库） ────────────────────────────────────────────

function selfTest(): number {
  let passed = 0;
  let failed = 0;
  const check = (name: string, cond: boolean) => {
    if (cond) passed++;
    else {
      failed++;
      console.error(`  ✗ ${name}`);
    }
  };

  const cfg = {
    ...buildConfig(),
    syncStaleHours: 26,
    runningMaxHours: 3,
    dropPct: 2,
    dropMin: 10,
    surgePct: 20,
    surgeMin: 100,
    cooldownHours: 12,
  };
  const now = new Date("2026-10-13T04:00:00Z");
  const hk = { key: "hongkong", label: "香港", scheduled: true };
  const us = { key: "namus", label: "美国", scheduled: false };
  const mk = (over: Partial<SyncLatest>): SyncLatest => ({
    source: "hongkong",
    status: "ok",
    startedAt: "2026-10-13T03:07:00Z",
    finishedAt: "2026-10-13T03:10:00Z",
    added: 0,
    errors: 0,
    lastError: null,
    ...over,
  });

  // 同步判断
  check("ok 且新鲜 → 无告警", evaluateSyncSource(hk, mk({}), now, cfg, null).issue === null);
  check("ok 但超 26h → stale", evaluateSyncSource(hk, mk({ startedAt: "2026-10-11T21:00:00Z" }), now, cfg, null).issue?.key === "sync-stale:hongkong");
  check("手动来源不查超时", evaluateSyncSource(us, mk({ source: "namus", startedAt: "2026-09-01T00:00:00Z" }), now, cfg, null).issue === null);
  check("failed → 错误告警", evaluateSyncSource(hk, mk({ status: "failed", lastError: "boom" }), now, cfg, null).issue?.key === "sync-error:hongkong");
  check("error 状态 → 错误告警", evaluateSyncSource(hk, mk({ status: "error", errors: 2 }), now, cfg, null).issue?.key === "sync-error:hongkong");
  check("running 且年轻 → 无告警", evaluateSyncSource(hk, mk({ status: "running", startedAt: "2026-10-13T03:30:00Z" }), now, cfg, null).issue === null);
  check("running 超 3h → 卡死告警", evaluateSyncSource(hk, mk({ status: "running", startedAt: "2026-10-12T20:00:00Z" }), now, cfg, null).issue?.key === "sync-hung:hongkong");
  const r1 = evaluateSyncSource(hk, null, now, cfg, null);
  check("无记录首次 → 记基线不告警", r1.issue === null && r1.newBaseline === now.toISOString());
  check("无记录超宽限 → 告警", evaluateSyncSource(hk, null, now, cfg, "2026-10-10T00:00:00Z").issue?.key === "sync-stale:hongkong");
  check("无记录在宽限内 → 不告警", evaluateSyncSource(hk, null, now, cfg, "2026-10-12T20:00:00Z").issue === null);
  check("手动来源无记录 → 不告警", evaluateSyncSource(us, null, now, cfg, null).issue === null);

  // 数据量判断
  check("骤降超双阈值 → 告警", evaluateDataChange("cases_us", "美国", 26594, 26000, cfg)?.key === "data-drop:cases_us");
  check("小幅下降 → 不告警", evaluateDataChange("cases_us", "美国", 26594, 26590, cfg) === null);
  check("小表降 3 条（低于最小条数）→ 不告警", evaluateDataChange("cases_hk", "香港", 40, 37, cfg) === null);
  check("暴涨超双阈值 → 告警", evaluateDataChange("cases_kr", "韩国", 1000, 1400, cfg)?.key === "data-surge:cases_kr");
  check("小幅上涨 → 不告警", evaluateDataChange("cases_kr", "韩国", 1043, 1060, cfg) === null);
  check("无基线 → 不告警", evaluateDataChange("cases_hk", "香港", null, 40, cfg) === null);

  // 告警策略：新增 → 发送 → 冷却 → 提醒 → 恢复
  const stA: State = { ...defaultState(now), alerts: {} };
  const issue1: Issue = { key: "site-down", title: "站点检查未通过", detail: "x" };
  const d1 = applyAlertPolicy([issue1], stA, now, 12);
  check("新告警 → 发送且不预写 lastSentAt", d1.toSend.length === 1 && d1.updated["site-down"].open === true && d1.updated["site-down"].lastSentAt === null);
  const stB: State = { ...stA, alerts: finalizeDecision(d1, true, true, now) };
  check("发送成功后记 lastSentAt", stB.alerts["site-down"].lastSentAt === now.toISOString());
  const d2 = applyAlertPolicy([issue1], stB, addHours(now, 1), 12);
  check("冷却内 → 抑制", d2.toSend.length === 0 && d2.reminders.length === 0);
  const stC: State = { ...stB, alerts: finalizeDecision(d2, true, true, addHours(now, 1)) };
  const d3 = applyAlertPolicy([issue1], stC, addHours(now, 13), 12);
  check("超冷却 → 提醒", d3.reminders.length === 1);
  const d4 = applyAlertPolicy([], stC, addHours(now, 14), 12);
  check("问题消失 → 恢复", d4.recoveries.length === 1 && d4.updated["site-down"].open === false);
  const d5 = applyAlertPolicy([], stC, addHours(now, 14), 12);
  const reverted = finalizeDecision(d5, true, false, addHours(now, 14));
  check("恢复邮件失败 → 保持 open 待重试", reverted["site-down"].open === true);

  // 文案与格式
  check("describeKey 中文名", describeKey("sync-error:hongkong").includes("香港") && describeKey("data-drop:cases_hk").includes("香港"));
  const mail = buildAlertEmail([issue1], [], now, cfg, false);
  check("告警邮件含恢复说明", mail.subject.includes("站点检查未通过") && mail.text.includes("恢复后会再发一封"));
  const testMail = buildAlertEmail([issue1], [], now, cfg, true);
  check("测试邮件带 [测试] 前缀", testMail.subject.startsWith("[测试] "));
  const rmail = buildRecoveryEmail(["site-down"], now, cfg);
  check("恢复邮件主题", rmail.subject.includes("已恢复"));
  check("时间格式（北京时间）", fmtCst("2026-10-13T03:07:00Z") === "2026-10-13 11:07");
  check("fmtDelta", fmtDelta(5) === "+5" && fmtDelta(-3) === "-3" && fmtDelta(0) === "±0");
  const report = buildReportText({
    now,
    cfg,
    state: stB,
    counts: { cases: 46908, cases_us: 26594, cases_hk: 40, cases_kr: 1043, cases_es: 525 },
    syncAgg: [{ source: "hongkong", runs: 7, ok_runs: 7, bad_runs: 0, added_total: 0, last_started: "2026-10-13T03:07:00Z" }],
    dbError: null,
    days: 7,
  });
  check("周报含数据量与同步段", report.text.includes("46,908") && report.text.includes("香港：7 次运行") && report.subject.includes("周报"));

  // 参数解析
  const p1 = parseArgs([]);
  check("parseArgs 默认", !("error" in p1) && p1.mode === "check" && !p1.dryRun && p1.simulate === null);
  const p2 = parseArgs(["--report", "--days", "30"]);
  check("parseArgs --report --days 30", !("error" in p2) && p2.mode === "report" && p2.days === 30);
  const p3 = parseArgs(["--simulate=sync-error", "--dry-run"]);
  check("parseArgs --simulate", !("error" in p3) && p3.simulate === "sync-error" && p3.dryRun);
  const p4 = parseArgs(["--bogus"]);
  check("parseArgs 未知参数报错", "error" in p4);
  check("simulate sync-error → 键", simulatedIssue("sync-error", cfg).key === "sync-error:hongkong");

  console.log(`self-test: ${passed} passed, ${failed} failed`);
  return failed === 0 ? 0 : 1;
}

// ── CLI ─────────────────────────────────────────────────────────────────

const USAGE = `我好想你 · 站点与同步任务巡检（REQ-202610-0437）

用法：node_modules/.bin/tsx scripts/inspect.ts [选项]
  （无选项）        执行巡检：站点三项探测 + 同步任务心跳/结果 + 数据量突变；异常时邮件告警（带冷却与恢复通知）
  --report          发送巡检报告（默认近 7 天；配合 --days 30 可发月报）
  --days <1-90>     报告统计天数（默认 7）
  --dry-run         只检查并打印结果，不发邮件、不写状态
  --simulate <k>    模拟故障并发送测试告警（不写状态）：site-down | sync-error | data-drop | db-down
  --self-test       运行内置自测（不访问网络/数据库）
  --verbose         输出更多细节
  -h, --help        显示帮助

常用环境变量：
  INSPECT_BASE_URL          站点探测地址（默认 http://127.0.0.1:3000）
  INSPECT_ALERT_EMAILS      告警收件人（逗号分隔，默认 scx@polofox.com）
  INSPECT_STATE_DIR         状态目录（默认 /var/lib/baobeihuijia-inspect）
  INSPECT_SYNC_STALE_HOURS  同步心跳阈值小时（默认 26）
  INSPECT_ALERT_COOLDOWN_HOURS  同一告警重复发送间隔小时（默认 12）

退出码：0 正常（含已发/已抑制告警）；1 内部错误或邮件发送失败；2 参数错误。
状态文件：<INSPECT_STATE_DIR>/state.json（快照、每日计数、告警冷却、站点可用性计数）。`;

function parseArgs(argv: string[]): CliOptions | { error: string } {
  const opts: CliOptions = { mode: "check", dryRun: false, verbose: false, help: false, simulate: null, days: 7 };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--report") opts.mode = "report";
    else if (arg === "--self-test") opts.mode = "self-test";
    else if (arg === "--dry-run") opts.dryRun = true;
    else if (arg === "--verbose" || arg === "-v") opts.verbose = true;
    else if (arg === "--help" || arg === "-h") opts.help = true;
    else if (arg === "--days" || arg.startsWith("--days=")) {
      const raw = arg.startsWith("--days=") ? arg.slice("--days=".length) : argv[++i];
      const v = Number(raw);
      if (!Number.isInteger(v) || v < 1 || v > 90) return { error: `--days 需要 1-90 的整数，收到：${raw ?? "（缺失）"}` };
      opts.days = v;
    } else if (arg === "--simulate" || arg.startsWith("--simulate=")) {
      const raw = arg.startsWith("--simulate=") ? arg.slice("--simulate=".length) : argv[++i];
      if (!raw || !(SIMULATE_KINDS as readonly string[]).includes(raw)) {
        return { error: `--simulate 支持：${SIMULATE_KINDS.join(" | ")}` };
      }
      opts.simulate = raw;
    } else {
      return { error: `未知参数：${arg}` };
    }
  }
  return opts;
}

async function main(): Promise<number> {
  const parsed = parseArgs(process.argv.slice(2));
  if ("error" in parsed) {
    console.error(`[inspect] ${parsed.error}`);
    console.error(USAGE);
    return 2;
  }
  if (parsed.help) {
    console.log(USAGE);
    return 0;
  }
  if (parsed.mode === "self-test") return selfTest();
  const cfg = buildConfig();
  const now = new Date();
  if (parsed.mode === "report") return runReport(cfg, now, parsed);
  return runCheck(cfg, now, parsed);
}

main()
  .then((code) => process.exit(code))
  .catch(async (err) => {
    console.error("[inspect] 未捕获异常：", err);
    try {
      const cfg = buildConfig();
      await sendMail(
        cfg,
        "【我好想你·巡检】巡检脚本自身故障",
        `巡检脚本运行中发生未捕获异常：\n\n${err instanceof Error ? (err.stack ?? err.message) : String(err)}\n\n时间：${fmtCst(new Date())}（北京时间）`
      );
    } catch (e) {
      console.error("[inspect] 故障通知也发送失败：", e);
    }
    process.exit(1);
  });

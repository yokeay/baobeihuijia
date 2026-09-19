import { getPool } from "@/lib/db/adapter-local-pg";
import { ensureCountryTable, getCasesTableName } from "@/lib/db/country-helpers";
import { v4 as uuidv4 } from "uuid";

const ORIGIN = "https://www.safe182.go.kr";
const LIST_URL = `${ORIGIN}/home/lcm/lcmMssList.do`;
const DETAIL_URL = `${ORIGIN}/home/lcm/lcmMssGet.do`;
const USER_AGENT = "Baobeihuijia/1.0 (public-service; https://baobeihuijia.org)";
const COUNTRY_CODE = "KR";
const SOURCE = "safe182";
const UNKNOWN_NAME = "이름 미상";

// The upstream JSP fixes the page size at 10 and has no "last page" marker, so
// the only safe stop condition is an empty page (plus a hard page ceiling).
const MAX_PAGES = 120;
const DETAIL_CONCURRENCY = 4;
const REQUEST_DELAY_MS = 150;

// One skin, two registers: rptDscd=2 is the "가출/실종" board of people still
// being searched for, rptDscd=1 the "보호" board of people taken into police
// care whose families have not been found. Ids never collide between them.
const REGISTERS = [
  { dscd: "2", care: false },
  { dscd: "1", care: true },
] as const;

export interface KrSyncStats {
  startedAt: string;
  finishedAt: string;
  totalInApi: number;
  added: number;
  skipped: number;
  errors: number;
  durationMs: number;
  lastError: string | null;
}

interface KrListItem {
  sourceId: string;
  name: string;
  gender: string | null;
  hasPhoto: boolean;
}

// The register writes provinces with or without their suffix (경기 vs 경기도,
// 충북 vs 충청북도), so both spellings resolve to the canonical name. Longest
// alias wins, otherwise 서�� would swallow 서울특별시.
const PROVINCE_ALIASES: [string, string][] = [
  ["서울특별시", "서울특별시"], ["서울", "서울특별시"],
  ["부산광역시", "부산광역시"], ["부산", "부산광역시"],
  ["대구광역시", "대구광역시"], ["대구", "대구광역시"],
  ["인천광역시", "인천광역시"], ["인천", "인천광역시"],
  ["광주광역시", "광주광역시"], ["광주", "광주광역시"],
  ["대전광역시", "대전광역시"], ["대전", "대전광역시"],
  ["울산광역시", "울산광역시"], ["울산", "울산광역시"],
  ["세종특별자치시", "세종특별자치시"], ["세종", "세종특별자치시"],
  ["경기도", "경기도"], ["경기", "경기도"],
  ["강원특별자치도", "강원특별자치도"], ["강원도", "강원특별자치도"], ["강원", "강원특별자치도"],
  ["충청북도", "충청북도"], ["충북", "충청북도"],
  ["충청남도", "충청남도"], ["충남", "충청남도"],
  ["전북특별자치도", "전북특별자치도"], ["전라북도", "전북특별자치도"], ["전북", "전북특별자치도"],
  ["전라남도", "전라남도"], ["전남", "전라남도"],
  ["경상북도", "경상북도"], ["경북", "경상북도"],
  ["경상남도", "경상남도"], ["경남", "경상남도"],
  ["제주특별자치도", "제주특별자치도"], ["제주도", "제주특별자치도"], ["제주", "제주특별자치도"],
].sort((a, b) => b[0].length - a[0].length) as [string, string][];

const DETAIL_LABELS = {
  age: "당시나이",
  nationality: "국적",
  date: "발생일시",
  place: "발생장소",
  height: "키",
  weight: "몸무게",
  build: "체격",
  face: "얼굴형",
  hairColor: "두발색상",
  hairStyle: "두발형태",
  clothing: "착의의상",
} as const;

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'");
}

function text(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

function pad(n: string): string {
  return n.padStart(2, "0");
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

async function mapLimit<T>(items: T[], limit: number, fn: (item: T) => Promise<void>): Promise<void> {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const item = items[cursor++];
      await fn(item);
    }
  });
  await Promise.all(workers);
}

function parseListPage(html: string): KrListItem[] {
  const out: KrListItem[] = [];

  for (const block of html.split(/<li[\s>]/).slice(1)) {
    const idMatch = block.match(/fn_getLcmMssGet\('(\d+)'\)/);
    if (!idMatch) continue;

    const linkMatch = block.match(/class="linkStyle3[^"]*"[^>]*>([\s\S]*?)<\/a>/);
    const label = linkMatch ? text(linkMatch[1]) : "";
    const gender = label.includes("여자") ? "女" : label.includes("남자") ? "男" : null;
    // "류희송(23세)  여자" — the age is repeated on its own detail row, so only
    // the name is worth keeping here.
    const name = label
      .replace(/\(\s*\d+\s*세\s*\)/g, "")
      .replace(/여자|남자/g, "")
      .trim();

    out.push({
      sourceId: idMatch[1],
      name: name || UNKNOWN_NAME,
      gender,
      hasPhoto: /blobImgView\.do\?msspsnIdntfccd=/.test(block),
    });
  }

  return out;
}

function parseDetail(html: string): Record<string, string> {
  const row: Record<string, string> = {};
  const re = /<th[^>]*>([\s\S]*?)<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const label = text(m[1]);
    if (!label || label in row) continue;
    row[label] = text(m[2]);
  }

  // The free-text notes live in a JS variable rather than the table.
  const extra = html.match(/var\s+etcSpfeatr\s*=\s*'((?:[^'\\]|\\.)*)'/);
  if (extra) {
    const note = text(extra[1].replace(/\\'/g, "'").replace(/\\"/g, '"'));
    if (note) row["특이사항"] = note;
  }

  return row;
}

function pick(row: Record<string, string>, label: string): string | null {
  const target = label.replace(/\s/g, "");
  for (const [key, value] of Object.entries(row)) {
    if (key.replace(/\s/g, "") === target && value) return value;
  }
  return null;
}

// 발생일시 arrives as separate year/month/day cells (1984년 / 11월 / 27일) and
// is sometimes only partial; lost_date is NOT NULL and the card does
// new Date(lost_date), so anything unparsable has to be dropped rather than
// stored as free text.
function normalizeDate(raw: string | null): string | null {
  if (!raw) return null;
  const full = raw.match(/(\d{4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
  if (full) return `${full[1]}-${pad(full[2])}-${pad(full[3])}`;
  const month = raw.match(/(\d{4})\s*년\s*(\d{1,2})\s*월/);
  if (month) return `${month[1]}-${pad(month[2])}-01`;
  const year = raw.match(/(\d{4})\s*년/);
  if (year) return `${year[1]}-01-01`;
  const iso = raw.match(/(\d{4})[-./](\d{1,2})[-./](\d{1,2})/);
  if (iso) return `${iso[1]}-${pad(iso[2])}-${pad(iso[3])}`;
  return null;
}

interface KrRegion {
  province: string | null;
  city: string | null;
  district: string | null;
  address: string | null;
}

function parseRegion(raw: string | null): KrRegion {
  const address = raw ? raw.replace(/\s+/g, " ").trim() : "";
  if (!address || /^(불상|미상|모름|없음|미확인)$/.test(address.replace(/\s/g, ""))) {
    return { province: null, city: null, district: null, address: null };
  }

  const alias = PROVINCE_ALIASES.find(([a]) => address.startsWith(a));
  if (!alias) {
    // An institution name or a floor number — the raw text is still worth
    // keeping, it just cannot drive the region filter.
    return { province: null, city: null, district: null, address };
  }

  const rest = address.slice(alias[0].length).trim();
  const tokens = rest.split(" ").filter(Boolean);
  let city: string | null = null;
  let idx = 0;
  if (tokens.length > 0 && /(시|군|구)$/.test(tokens[0])) {
    city = tokens[0];
    idx = 1;
  }

  return {
    province: alias[1],
    city,
    district: tokens.slice(idx).join(" ") || null,
    address,
  };
}

function joinParts(parts: (string | null | undefined)[], sep: string): string | null {
  const kept = parts.filter((p): p is string => !!p);
  return kept.length > 0 ? kept.join(sep) : null;
}

function buildFeature(
  detail: Record<string, string>,
  care: boolean,
  region: KrRegion
): string | null {
  const lines: string[] = [];
  if (care) lines.push("【경찰 보호 중 · 警方保护中】");

  const age = pick(detail, DETAIL_LABELS.age);
  if (age) lines.push(`나이: ${age}`);
  const nationality = pick(detail, DETAIL_LABELS.nationality);
  if (nationality) lines.push(`국적: ${nationality}`);
  if (region.address) lines.push(`발생장소: ${region.address}`);

  const weight = pick(detail, DETAIL_LABELS.weight);
  if (weight) lines.push(`몸무게: ${weight}`);

  const build = pick(detail, DETAIL_LABELS.build);
  const face = pick(detail, DETAIL_LABELS.face);
  const bodyShape = joinParts(
    [build && `체격 ${build}`, face && `얼굴형 ${face}`],
    " · "
  );
  if (bodyShape) lines.push(bodyShape);

  const hair = joinParts(
    [pick(detail, DETAIL_LABELS.hairColor), pick(detail, DETAIL_LABELS.hairStyle)],
    " "
  );
  if (hair) lines.push(`두발: ${hair}`);

  const clothing = pick(detail, DETAIL_LABELS.clothing);
  if (clothing) lines.push(`착의: ${clothing}`);

  const note = pick(detail, "특이사항");
  if (note) lines.push(note);

  return lines.length > 0 ? lines.join("\n") : null;
}

async function fetchListPage(pageIndex: number, dscd: string): Promise<string> {
  const body = new URLSearchParams({
    pageIndex: String(pageIndex),
    msspsnIdntfccd: "0",
    rptDscd: dscd,
    amalGnfdyn: "N",
    kdnpGnfdyn: "N",
    gnbMenuCd: "",
    lnbMenuCd: "",
  });

  const res = await fetch(LIST_URL, {
    method: "POST",
    headers: {
      "User-Agent": USER_AGENT,
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Referer: `${LIST_URL}?rptDscd=${dscd}`,
    },
    body: body.toString(),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} on list page ${pageIndex}`);
  return res.text();
}

async function fetchDetail(id: string, dscd: string): Promise<Record<string, string>> {
  const url = `${DETAIL_URL}?msspsnIdntfccd=${id}&rptDscd=${dscd}`;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Referer: `${LIST_URL}?rptDscd=${dscd}` },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} on detail ${id}`);
  return parseDetail(await res.text());
}

async function enumerateAll(): Promise<{ item: KrListItem; care: boolean }[]> {
  const out: { item: KrListItem; care: boolean }[] = [];
  const seen = new Set<string>();

  for (const register of REGISTERS) {
    for (let page = 1; page <= MAX_PAGES; page++) {
      const items = parseListPage(await fetchListPage(page, register.dscd));
      if (items.length === 0) break;

      let fresh = 0;
      for (const item of items) {
        if (seen.has(item.sourceId)) continue;
        seen.add(item.sourceId);
        out.push({ item, care: register.care });
        fresh++;
      }
      // The two registers never share ids, so a page of nothing but repeats
      // means the upstream silently clamped the page index — stop there.
      if (fresh === 0) break;

      await delay(REQUEST_DELAY_MS);
    }
  }

  return out;
}

export async function syncKorea(options?: { dryRun?: boolean }): Promise<KrSyncStats> {
  const { dryRun = false } = options || {};
  const startedAt = new Date().toISOString();
  const startTime = Date.now();

  console.log("[korea] Enumerating safe182 list pages...");

  let listed: { item: KrListItem; care: boolean }[];
  try {
    listed = await enumerateAll();
  } catch (err) {
    return {
      startedAt,
      finishedAt: new Date().toISOString(),
      totalInApi: 0,
      added: 0,
      skipped: 0,
      errors: 1,
      durationMs: Date.now() - startTime,
      lastError: `Failed to enumerate safe182 list: ${errorMessage(err)}`,
    };
  }

  const totalInApi = listed.length;
  console.log(`[korea] Listed ${totalInApi} cases`);

  if (dryRun) {
    return {
      startedAt,
      finishedAt: new Date().toISOString(),
      totalInApi,
      added: 0,
      skipped: 0,
      errors: 0,
      durationMs: Date.now() - startTime,
      lastError: null,
    };
  }

  await ensureCountryTable(COUNTRY_CODE);
  const pool = getPool();
  const tableName = getCasesTableName(COUNTRY_CODE);

  const existingResult = await pool.query(
    `SELECT source_id FROM "${tableName}" WHERE source = $1`,
    [SOURCE]
  );
  const existingIds = new Set(
    (existingResult.rows as { source_id: string }[]).map((r) => r.source_id)
  );

  const pending = listed.filter(({ item }) => !existingIds.has(item.sourceId));
  let added = 0;
  let errors = 0;
  let lastError: string | null = null;

  await mapLimit(pending, DETAIL_CONCURRENCY, async ({ item, care }) => {
    try {
      const detail = await fetchDetail(item.sourceId, care ? "1" : "2");
      const lostDate = normalizeDate(pick(detail, DETAIL_LABELS.date));
      if (!lostDate) {
        errors++;
        lastError = `No parsable 발생일시 for ${item.sourceId}`;
        console.error(`[korea] ${lastError}`);
        return;
      }

      const region = parseRegion(pick(detail, DETAIL_LABELS.place));
      const heightRaw = pick(detail, DETAIL_LABELS.height);
      const heightDigits = heightRaw?.match(/(\d{2,3})/);
      const photos = item.hasPhoto ? [`/api/image/safe182/${item.sourceId}`] : [];

      await pool.query(
        `INSERT INTO "${tableName}" (id, name, gender, lost_date, lost_province, lost_city, lost_district, lost_address, height, feature, photo_urls, source, source_url, source_id, status, missing_country, created_at, updated_at, view_count, follow_count)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
        [
          uuidv4(),
          item.name,
          item.gender,
          lostDate,
          region.province,
          region.city,
          region.district,
          region.address,
          heightDigits ? parseInt(heightDigits[1], 10) : null,
          buildFeature(detail, care, region),
          JSON.stringify(photos),
          SOURCE,
          `${DETAIL_URL}?msspsnIdntfccd=${item.sourceId}&rptDscd=${care ? "1" : "2"}`,
          item.sourceId,
          "approved",
          COUNTRY_CODE,
          new Date().toISOString(),
          new Date().toISOString(),
          randomInt(30, 800),
          randomInt(0, 25),
        ]
      );
      added++;

      await delay(REQUEST_DELAY_MS);
    } catch (err) {
      errors++;
      lastError = `DB insert ${item.sourceId}: ${errorMessage(err)}`;
      console.error(`[korea] ${lastError}`);
    }
  });

  const stats: KrSyncStats = {
    startedAt,
    finishedAt: new Date().toISOString(),
    totalInApi,
    added,
    skipped: totalInApi - pending.length,
    errors,
    durationMs: Date.now() - startTime,
    lastError,
  };

  console.log(
    `[korea] Sync done: ${stats.added} added, ${stats.skipped} skipped, ${stats.errors} errors ` +
    `(${totalInApi} total, ${(stats.durationMs / 1000).toFixed(1)}s)`
  );

  return stats;
}

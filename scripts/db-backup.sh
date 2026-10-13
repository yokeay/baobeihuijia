#!/usr/bin/env bash
# =============================================================================
# db-backup.sh — 我好想你（baobeihuijia）数据库每日备份与异地副本（REQ-202610-0436）
#
# 与需求五点规格的对应：
#   1) 基础备份（一次性）：pg_dump 导出 plain SQL（CREATE TABLE + INSERT 语句），
#      存入 base/base-YYYYMMDD/ 文件夹，文件夹名记录在 MANIFEST.json 与 STATUS.json；
#      单文件超过 GitHub 限制（95 MiB）自动分片（part-01/02/…，带重组校验）。
#   2) 每日增量：只导出「已更改」的数据（按时间戳过滤），生成幂等 upsert 语句
#      （INSERT … ON CONFLICT DO UPDATE），提交并推送到私有异地仓库。
#   3) 失败处理：日志保留 + 失败标记 + 系统库 system_logs 表写错误记录（表由本脚本维护）。
#   4) 保留策略：默认保留全部（RETENTION_DAYS=0）；可设天数启用滑动窗口——
#      注意增量是链式 delta，删除旧增量会破坏「基础备份+增量」恢复链，
#      启用时须配套定期 --rebuild-base（详见 docs/REQ-202610-0436-plan.md）。
#
# 用法：
#   ./scripts/db-backup.sh                  每日增量（缺基础备份时自动先做基础备份）
#   ./scripts/db-backup.sh --rebuild-base   强制重做基础备份（新开 base- 文件夹）
#   ./scripts/db-backup.sh --no-push        只本地生成、不推送、不推进状态（测试用）
#   ./scripts/db-backup.sh -h | --help      帮助
#
# 环境变量（可覆盖）：
#   CONTAINER / DB_NAME / DB_USER / BACKUP_DIR / WORK_DIR / LOG_FILE / LOCK_FILE
#   OFFSITE_REPO / OVERLAP_MINUTES / CHUNK_BYTES / RETENTION_DAYS / BACKUP_TOKEN
#
# 依赖：docker、git、curl、jq、split、sha256sum（推送凭据从主仓库 remote URL 提取）
# =============================================================================
set -euo pipefail

export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:${PATH:-}"
export HOME="${HOME:-/root}"
export GIT_TERMINAL_PROMPT=0

CONTAINER="${CONTAINER:-infra-postgres}"
DB_NAME="${DB_NAME:-baobeihuijia}"
DB_USER="${DB_USER:-baobei}"
BACKUP_DIR="${BACKUP_DIR:-/root/baobeihuijia-backups}"
WORK_DIR="${WORK_DIR:-/var/lib/baobeihuijia-db-offsite}"
LOG_FILE="${LOG_FILE:-/var/log/baobeihuijia-db-backup.log}"
LOCK_FILE="${LOCK_FILE:-/var/lock/baobeihuijia-db-backup.lock}"
OFFSITE_REPO="${OFFSITE_REPO:-yokeay/baobeihuijia-db-backup}"
OVERLAP_MINUTES="${OVERLAP_MINUTES:-10}"
CHUNK_BYTES="${CHUNK_BYTES:-99614720}"   # 95 MiB（GitHub 单文件硬限 100 MiB，留余量）
RETENTION_DAYS="${RETENTION_DAYS:-0}"    # 0 = 保留全部；>0 = 删除 N 天前的增量文件
PGOPT="-c TimeZone=Asia/Shanghai"        # 会话时区钉死：timestamp 列的时区语义必须确定

REBUILD_BASE=0
NO_PUSH=0

usage() {
  cat <<'EOF'
db-backup.sh — 我好想你（baobeihuijia）数据库每日备份与异地副本（REQ-202610-0436）

用法：./scripts/db-backup.sh [选项]

选项：
  --rebuild-base   强制重做基础备份（新开一个 base- 文件夹；增量链从本次起点继续）
  --no-push        只本地生成（不推送、不推进状态；测试用）
  -h, --help       显示本帮助

流程：基础备份（首次 / --rebuild-base）或每日增量（默认）→ 自检 →
      提交并推送到私有仓库 yokeay/baobeihuijia-db-backup → 更新状态

环境变量：CONTAINER / DB_NAME / DB_USER / BACKUP_DIR / WORK_DIR / LOG_FILE /
          LOCK_FILE / OFFSITE_REPO / OVERLAP_MINUTES / CHUNK_BYTES / RETENTION_DAYS
详见 README「数据库备份」一节与 docs/REQ-202610-0436-plan.md。
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --rebuild-base) REBUILD_BASE=1 ;;
    --no-push)      NO_PUSH=1 ;;
    -h|--help)      usage; exit 0 ;;
    *) printf '未知参数：%s\n' "$1" >&2; usage >&2; exit 2 ;;
  esac
  shift
done

log() { printf '%s %s\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$*"; }

# 日志自截断：cron 把 stdout 追加到 LOG_FILE，超过 1MB 时保留最后 2000 行
if [ -f "$LOG_FILE" ] && [ "$(stat -c%s "$LOG_FILE" 2>/dev/null || echo 0)" -gt 1048576 ]; then
  tail -n 2000 "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"
fi

# 单实例锁（flock 随 fd 9 关闭释放；/var/lock 不可写时退回 /tmp）
if ! touch "$LOCK_FILE" 2>/dev/null; then
  LOCK_FILE="/tmp/$(basename "$LOCK_FILE")"
  touch "$LOCK_FILE"
fi
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  log "已有备份实例在运行，本次退出"
  exit 0
fi

mkdir -p "$BACKUP_DIR" "$WORK_DIR"
chmod 700 "$WORK_DIR" 2>/dev/null || true
FAIL_FLAG="$BACKUP_DIR/.last-backup-failed"
rm -f "$FAIL_FLAG"
RUN_START_UTC="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
TS="$(printf '%s' "$RUN_START_UTC" | tr -d ':-')"   # 例：20261013T041000Z
WORK_REPO="$WORK_DIR/repo"
EXPORT_DIR=""
LAST_DETAIL=""

case "$OVERLAP_MINUTES" in ''|*[!0-9]*) log "ERROR: OVERLAP_MINUTES 必须是非负整数（当前：$OVERLAP_MINUTES）"; exit 1 ;; esac
case "$RETENTION_DAYS"  in ''|*[!0-9]*) log "ERROR: RETENTION_DAYS 必须是非负整数（当前：$RETENTION_DAYS）";  exit 1 ;; esac
case "$CHUNK_BYTES"     in ''|*[!0-9]*) log "ERROR: CHUNK_BYTES 必须是非负整数（当前：$CHUNK_BYTES）";       exit 1 ;; esac

# 失败记录写进系统库 system_logs（表由本脚本维护；此处失败也不阻断主流程）
syslog_row() {
  local level="$1" msg="$2" detail="${3:-}" uid
  uid="$(cat /proc/sys/kernel/random/uuid 2>/dev/null || echo "$TS-$$")"
  # 注意：psql 的 -c 不做变量插值，必须走 stdin（-f -）才能安全使用 :'var'（自带转义）
  docker exec -i -e PGOPTIONS="$PGOPT" "$CONTAINER" psql -X -U "$DB_USER" -d "$DB_NAME" \
    -v ON_ERROR_STOP=1 -v id="$uid" -v lvl="$level" -v m="${msg:0:500}" -v d="${detail:0:2000}" \
    -f - >/dev/null 2>&1 <<'SQL' || true
INSERT INTO system_logs (id, level, source, message, detail)
VALUES (:'id', :'lvl', 'db-backup', :'m', nullif(:'d',''));
SQL
}

fail() {
  log "ERROR: $*"
  printf '%s at %s\n' "$*" "$RUN_START_UTC" > "$FAIL_FLAG" 2>/dev/null || true
  syslog_row error "$*" "$LAST_DETAIL"
  exit 1
}

# 容器可用性预检
if [ "$(docker inspect -f '{{.State.Running}}' "$CONTAINER" 2>/dev/null)" != "true" ]; then
  fail "容器 $CONTAINER 不存在或未在运行"
fi

# 主仓库根目录（用于取推送凭据）与推送凭据提取
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null || true)"
[ -n "$REPO_ROOT" ] || fail "无法定位主仓库根目录（脚本应位于仓库内）"

if [ "$NO_PUSH" = 0 ]; then
  BACKUP_TOKEN="${BACKUP_TOKEN:-}"
  if [ -z "$BACKUP_TOKEN" ]; then
    REMOTE_URL="$(git -C "$REPO_ROOT" config --get remote.origin.url 2>/dev/null || true)"
    case "$REMOTE_URL" in
      https://*@*)
        cred="${REMOTE_URL#https://}"; cred="${cred%%@*}"
        case "$cred" in
          *:*) BACKUP_TOKEN="${cred#*:}" ;;   # user:token@ 形式
          *)   BACKUP_TOKEN="$cred" ;;        # token@ 形式
        esac ;;
    esac
  fi
  [ -n "$BACKUP_TOKEN" ] || fail "未找到推送凭据：主仓库 remote.origin.url 未内嵌 https://<token>@… 凭据，也未设置 BACKUP_TOKEN"
  export BACKUP_TOKEN
fi

# 统一掩码：URL 内嵌凭据与裸 token 绝不回显
mask_out() { sed -E "s#(https?://)[^@/[:space:]]+@#\1***@#g; s#${BACKUP_TOKEN:-__NO_TOKEN__}#***#g"; }

# 数据库查询帮助函数（会话时区钉死，时间戳语义与线上一致）
pq() { docker exec -e PGOPTIONS="$PGOPT" "$CONTAINER" psql -X -U "$DB_USER" -d "$DB_NAME" -tA -c "$1"; }

# ---------------------------------------------------------------------------
# 备份仓库操作
# ---------------------------------------------------------------------------
assert_repo_private() {
  local code priv
  code="$(curl -sS -o "$WORK_DIR/gh.json" -w '%{http_code}' \
    -H "Authorization: Bearer $BACKUP_TOKEN" -H 'Accept: application/vnd.github+json' \
    "https://api.github.com/repos/$OFFSITE_REPO" 2>/dev/null || true)"
  code="$(printf '%s' "$code" | tail -n1)"
  if [ "$code" != "200" ]; then
    rm -f "$WORK_DIR/gh.json"; LAST_DETAIL="HTTP $code"
    fail "异地仓库 $OFFSITE_REPO 访问失败（HTTP $code）：不存在或无权限"
  fi
  priv="$(jq -r '.private // false' "$WORK_DIR/gh.json" 2>/dev/null || echo false)"
  rm -f "$WORK_DIR/gh.json"
  if [ "$priv" != "true" ]; then
    LAST_DETAIL="private=$priv"
    fail "异地仓库 $OFFSITE_REPO 不是 private（private=$priv），拒绝推送"
  fi
}

prepare_repo() {
  if [ ! -d "$WORK_REPO/.git" ]; then
    rm -rf "$WORK_REPO"; mkdir -p "$WORK_REPO"
    git -C "$WORK_REPO" init -q -b main
    git -C "$WORK_REPO" remote add origin "https://github.com/${OFFSITE_REPO}.git"
  fi
  # 清掉可能继承的全局 helper，再显式加一个只读环境变量的 helper（token 不落盘）
  git -C "$WORK_REPO" config --unset-all credential.helper 2>/dev/null || true
  git -C "$WORK_REPO" config --add credential.helper ''
  git -C "$WORK_REPO" config --add credential.helper '!f() { echo username=x-access-token; echo password="$BACKUP_TOKEN"; }; f'
  git -C "$WORK_REPO" config user.name "baobeihuijia-backup"
  git -C "$WORK_REPO" config user.email "backup@baobeihuijia.invalid"

  if git -C "$WORK_REPO" fetch -q origin main 2>"$WORK_DIR/git.err"; then
    git -C "$WORK_REPO" checkout -q -B main origin/main
  elif grep -qi "couldn't find remote ref" "$WORK_DIR/git.err" 2>/dev/null; then
    # 远端还是空仓库（首次推送前）
    git -C "$WORK_REPO" checkout -q -B main 2>/dev/null || git -C "$WORK_REPO" symbolic-ref HEAD refs/heads/main
  else
    LAST_DETAIL="$(mask_out < "$WORK_DIR/git.err" | head -c 300 | tr '\n' ' ')"
    rm -f "$WORK_DIR/git.err"
    fail "拉取备份仓库失败：$LAST_DETAIL"
  fi
  rm -f "$WORK_DIR/git.err"
}

push_repo() {
  local msg="$1"
  git -C "$WORK_REPO" add -A
  if git -C "$WORK_REPO" diff --cached --quiet; then
    log "备份仓库无新变更，跳过提交"
    return 0
  fi
  git -C "$WORK_REPO" commit -q -m "$msg" || fail "备份仓库提交失败"
  if ! git -C "$WORK_REPO" push -q origin main 2>"$WORK_DIR/git.err"; then
    LAST_DETAIL="$(mask_out < "$WORK_DIR/git.err" | head -c 300 | tr '\n' ' ')"
    rm -f "$WORK_DIR/git.err"
    fail "推送备份仓库失败：$LAST_DETAIL"
  fi
  rm -f "$WORK_DIR/git.err"
  log "已推送 $OFFSITE_REPO main（$(git -C "$WORK_REPO" rev-parse --short HEAD)）"
}

# ---------------------------------------------------------------------------
# 表分组策略（增量模式）
#   G1 案件系列：GREATEST(updated_at, reviewed_at) —— 审核路由只写 reviewed_at 不写 updated_at
#   G2 流水表：created_at 过滤（只增不改）
#   G3 小表：每次全量（含静默更新列的小表，全量换一致性）
#   sync_runs 单列：started_at / finished_at 过滤
#   system_logs 不进增量（运维日志，仅进基础备份）
# ---------------------------------------------------------------------------
G1_TABLES=(cases cases_at cases_ca cases_de cases_es cases_gb cases_hk cases_in cases_jp cases_kr cases_mo cases_sg cases_tw cases_us)
G2_TABLES=(case_views site_visits audit_logs user_activities)
G3_TABLES=(users admins settings follows comments questions feedback clues)
# 生成顺序（外键安全）：案件 → 用户/管理 → 评论/线索/疑问 → 关注/浏览 → 反馈/日志
TABLES_ORDER=(cases cases_at cases_ca cases_de cases_es cases_gb cases_hk cases_in cases_jp cases_kr cases_mo cases_sg cases_tw cases_us users admins settings comments clues questions follows case_views feedback audit_logs site_visits user_activities sync_runs)

filter_for() {
  local t="$1"
  case " ${G1_TABLES[*]} " in *" $t "*) echo "GREATEST(updated_at::timestamptz, nullif(reviewed_at,'')::timestamptz) > TIMESTAMPTZ '$CUTOFF'"; return ;; esac
  case " ${G2_TABLES[*]} " in *" $t "*) echo "created_at::timestamptz > TIMESTAMPTZ '$CUTOFF'"; return ;; esac
  case " ${G3_TABLES[*]} " in *" $t "*) echo "TRUE"; return ;; esac
  case "$t" in sync_runs) echo "GREATEST(started_at, coalesce(finished_at, started_at)) > TIMESTAMPTZ '$CUTOFF'"; return ;; esac
  echo ""
}

# 服务端生成幂等 upsert 语句（quote_nullable 负责一切转义：引号/反斜杠/换行/NULL）
gen_table() {
  local t="$1" filter="$2" out="$3"
  local cols collist_q pk pk_q orderby nonpk c valexpr setlist action sql
  cols="$(pq "SELECT string_agg(column_name, ',' ORDER BY ordinal_position) FROM information_schema.columns WHERE table_schema='public' AND table_name='$t'")"
  [ -n "$cols" ] || fail "读取表 $t 的列清单失败"
  pk="$(pq "SELECT string_agg(a.attname, ',' ORDER BY array_position(i.indkey, a.attnum)) FROM pg_index i JOIN pg_attribute a ON a.attrelid=i.indrelid AND a.attnum=ANY(i.indkey) WHERE i.indrelid='public.$t'::regclass AND i.indisprimary")"
  [ -n "$pk" ] || fail "表 $t 没有主键，无法生成幂等 upsert"

  collist_q="$(printf '%s' "$cols" | sed 's/[^,]*/"&"/g')"
  pk_q="$(printf '%s' "$pk" | sed 's/[^,]*/"&"/g')"
  orderby="$pk_q"

  nonpk=""
  while IFS= read -r c; do
    case ",$pk," in *",$c,"*) ;; *) nonpk="${nonpk:+$nonpk,}$c" ;; esac
  done < <(printf '%s\n' "${cols//,/$'\n'}")

  valexpr="$(printf '%s\n' "${cols//,/$'\n'}" | sed 's/^/quote_nullable("/; s/$/")/' | paste -sd, -)"

  if [ -n "$nonpk" ]; then
    setlist="$(printf '%s\n' "${nonpk//,/$'\n'}" | sed 's/.*/"&"=EXCLUDED."&"/' | paste -sd, -)"
    action="DO UPDATE SET $setlist"
  else
    action="DO NOTHING"
  fi

  sql="SELECT 'INSERT INTO public.$t ($collist_q) VALUES (' || concat_ws(',', $valexpr) || ') ON CONFLICT ($pk_q) $action;' FROM public.$t WHERE $filter ORDER BY $orderby"
  pq "$sql" > "$out"
}

# 分片（超过 CHUNK_BYTES 时）：split -C 按行边界切、重组 sha256 必须一致；
# 输出全局 SIZE / SHA / CHUNKED / PARTS_N / PARTS_TXT
chunk_file() {
  local f="$1" joined p psz
  SIZE="$(stat -c%s "$f")"
  SHA="$(sha256sum "$f" | awk '{print $1}')"
  CHUNKED=0; PARTS_N=0; PARTS_TXT=""
  if [ "$SIZE" -gt "$CHUNK_BYTES" ]; then
    split -C "$CHUNK_BYTES" -d --numeric-suffixes=1 --suffix-length=2 "$f" "$f.part-"
    joined="$(cat "$f".part-* | sha256sum | awk '{print $1}')"
    if [ "$joined" != "$SHA" ]; then
      rm -f "$f".part-*
      fail "分片重组校验失败（sha256 不一致），已清理分片"
    fi
    for p in "$f".part-*; do
      psz="$(stat -c%s "$p")"
      if [ "$psz" -gt 104857600 ]; then
        rm -f "$f".part-*
        fail "分片 $(basename "$p") 超过 GitHub 100 MiB 硬限"
      fi
    done
    PARTS_N="$(ls -1 "$f".part-* | wc -l | tr -d ' ')"
    PARTS_TXT="$(basename "$f").part-*"
    rm -f "$f"
    CHUNKED=1
  fi
}

# ---------------------------------------------------------------------------
# 基础备份
# ---------------------------------------------------------------------------
gen_base() {
  local day folder rc=0 live dump total_rows chunk_note=""
  day="$(date -u +%Y%m%d)"
  folder="base-$day"
  if [ -e "$WORK_REPO/base/$folder" ]; then
    folder="base-$day-$(date -u +%H%M%S)"   # 同日重做防撞
  fi
  EXPORT_DIR="$WORK_DIR/export-$TS"
  rm -rf "$EXPORT_DIR"; mkdir -p "$EXPORT_DIR"
  local sql="$EXPORT_DIR/${DB_NAME}_base_$TS.sql"

  log "开始基础备份（pg_dump --column-inserts）…"
  set +e
  docker exec "$CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" --no-owner --no-privileges --column-inserts > "$sql.partial" 2>"$EXPORT_DIR/dump.err"
  rc=$?
  set -e
  if [ "$rc" -ne 0 ]; then
    LAST_DETAIL="$(head -c 300 "$EXPORT_DIR/dump.err" | tr '\n' ' ')"
    fail "pg_dump 退出码 $rc：$LAST_DETAIL"
  fi
  # 剥掉 psql 元命令 \restrict / \unrestrict（非 SQL，旧版 psql 不认）
  sed -i '/^\\restrict /d; /^\\unrestrict /d' "$sql.partial"

  # 自检：非空 / 头标记 / 尾标记（末 10 行内）/ 表数与线上一致
  [ -s "$sql.partial" ] || fail "pg_dump 产物为 0 字节"
  head -n 5 "$sql.partial" | grep -q '^-- PostgreSQL database dump' || fail "基础备份缺少头标记，疑似损坏"
  tail -n 10 "$sql.partial" | grep -q '^-- PostgreSQL database dump complete$' || fail "基础备份缺少结尾标记，疑似被截断"
  live="$(pq "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind='r' AND n.nspname='public'")"
  dump="$(grep -c '^CREATE TABLE ' "$sql.partial" || true)"
  [ "$dump" = "$live" ] || fail "表数不一致：生产 $live 张，导出 $dump 张"

  total_rows="$(pq "SELECT coalesce(sum((xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I.%I', n.nspname, c.relname), false, true, '')))[1]::text::bigint), 0) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind='r' AND n.nspname='public'")"

  mv "$sql.partial" "$sql"
  chmod 600 "$sql"
  chunk_file "$sql"

  mkdir -p "$WORK_REPO/base/$folder"
  if [ "$CHUNKED" = 1 ]; then
    mv "$sql".part-* "$WORK_REPO/base/$folder/"
    chunk_note="，分片 $PARTS_N 片"
  else
    mv "$sql" "$WORK_REPO/base/$folder/"
  fi

  jq -n \
    --arg folder "$folder" \
    --arg db "$DB_NAME" \
    --arg created "$RUN_START_UTC" \
    --arg file "$(basename "$sql")" \
    --argjson bytes "$SIZE" \
    --arg sha "$SHA" \
    --argjson chunked "$CHUNKED" \
    --argjson parts "$PARTS_N" \
    --arg parts_glob "$PARTS_TXT" \
    --argjson tables "$live" \
    --argjson rows "$total_rows" \
    '{folder:$folder, database:$db, created_utc:$created, file:$file, bytes:$bytes, sha256:$sha,
      chunked:($chunked==1), parts:$parts, parts_glob:(if $chunked==1 then $parts_glob else null end),
      reassemble_cmd:(if $chunked==1 then ("cat " + $parts_glob + " > " + $file) else null end),
      tables:$tables, total_rows:$rows}' \
    > "$WORK_REPO/base/$folder/MANIFEST.json"

  BASE_FOLDER="$folder"; BASE_FILE="$(basename "$sql")"; BASE_CREATED="$RUN_START_UTC"
  RESULT_MODE="base"; RESULT_BYTES="$SIZE"; RESULT_SHA="$SHA"
  log "基础备份完成：base/$folder/（$SIZE 字节，$live 张表 / $total_rows 行，sha256 ${SHA:0:12}…$chunk_note）"
}

# ---------------------------------------------------------------------------
# 每日增量
# ---------------------------------------------------------------------------
gen_increment() {
  local t f cnt total=0 summary=""
  declare -A COUNTS=()
  EXPORT_DIR="$WORK_DIR/export-$TS"
  rm -rf "$EXPORT_DIR"; mkdir -p "$EXPORT_DIR"
  log "增量窗口：($CUTOFF, $RUN_START_UTC]（回退 ${OVERLAP_MINUTES} 分钟重叠）"
  for t in "${TABLES_ORDER[@]}"; do
    f="$(filter_for "$t")"
    [ -n "$f" ] || fail "表 $t 未登记进备份策略"
    gen_table "$t" "$f" "$EXPORT_DIR/$t.sql"
    cnt="$(grep -cF "INSERT INTO public.$t (" "$EXPORT_DIR/$t.sql" || true)"
    COUNTS[$t]="$cnt"
    total=$((total + cnt))
    if [ "$cnt" != "0" ]; then summary="$summary$t:$cnt "; fi
  done
  log "增量语句统计：合计 $total 条（$summary）"

  if [ "$total" = 0 ]; then
    log "本次窗口内无数据变更，未生成增量文件（状态照常推进）"
    RESULT_MODE="increment"; RESULT_FILE=""; RESULT_BYTES=0; RESULT_SHA=""; RESULT_STMTS=0
    return 0
  fi

  local inc="$EXPORT_DIR/baobeihuijia_inc_$TS.sql"
  {
    echo "-- 我好想你（baobeihuijia）数据库增量备份"
    echo "-- 数据库：$DB_NAME（PostgreSQL 16）"
    echo "-- 生成时间（UTC）：$RUN_START_UTC"
    echo "-- 增量窗口：($CUTOFF, $RUN_START_UTC]（起点回退 ${OVERLAP_MINUTES} 分钟重叠，边界重复无害）"
    echo "-- 语句幂等（INSERT ... ON CONFLICT DO UPDATE），与 base/ 基础备份配合、按文件名顺序应用"
    echo "-- 表顺序：案件表 → 用户/管理 → 评论/线索/疑问 → 关注/浏览 → 反馈/日志（满足外键依赖）"
    echo "SET standard_conforming_strings = on;"
    echo "BEGIN;"
    for t in "${TABLES_ORDER[@]}"; do
      if [ -s "$EXPORT_DIR/$t.sql" ]; then
        echo ""
        echo "-- ===== $t（${COUNTS[$t]} 条）====="
        cat "$EXPORT_DIR/$t.sql"
      fi
    done
    echo ""
    echo "COMMIT;"
  } > "$inc.partial"

  [ -s "$inc.partial" ] || fail "增量文件为空"
  [ "$(tail -n1 "$inc.partial")" = "COMMIT;" ] || fail "增量文件结尾异常（缺少 COMMIT;）"
  local file_cnt
  file_cnt="$(grep -cF 'INSERT INTO public.' "$inc.partial" || true)"
  [ "$file_cnt" = "$total" ] || fail "增量语句数不一致（文件 $file_cnt vs 统计 $total）"
  mv "$inc.partial" "$inc"

  chunk_file "$inc"
  mkdir -p "$WORK_REPO/increments"
  if [ "$CHUNKED" = 1 ]; then
    mv "$inc".part-* "$WORK_REPO/increments/"
    RESULT_FILE="increments/$(basename "$inc")"   # 实际落盘为 *.part-NN 分片（见上一行日志）
    log "增量文件超过分片阈值，已拆为 $PARTS_N 片（$SIZE 字节，sha256 ${SHA:0:12}…）"
  else
    mv "$inc" "$WORK_REPO/increments/"
    RESULT_FILE="increments/$(basename "$inc")"
    log "增量文件已生成：$RESULT_FILE（$SIZE 字节，$total 条语句，sha256 ${SHA:0:12}…）"
  fi
  RESULT_MODE="increment"; RESULT_BYTES="$SIZE"; RESULT_SHA="$SHA"; RESULT_STMTS="$total"
}

# ---------------------------------------------------------------------------
# 元数据 / 状态 / 保留策略
# ---------------------------------------------------------------------------
write_repo_meta() {
  cat > "$WORK_REPO/README.md" <<'MD'
# 我好想你（baobeihuijia）数据库异地备份

本仓库由服务器上的 `scripts/db-backup.sh`（主仓库 yokeay/baobeihuijia）**每日自动推送**，
请勿手工改动文件。

## 目录结构

- `base/base-YYYYMMDD/` — 一次性**基础备份**（plain SQL：CREATE TABLE + INSERT 语句）。
  文件夹内 `MANIFEST.json` 记录文件夹名、文件、sha256、表数/行数；单文件超过 GitHub
  限制（95 MiB）时自动分片为 `*.part-01`、`*.part-02`…，`MANIFEST.json` 含重组命令。
- `increments/baobeihuijia_inc_YYYYMMDDTHHMMSSZ.sql` — **每日增量**（仅变更数据，
  幂等 upsert 语句），按文件名顺序应用。
- `STATUS.json` — 最近一次成功备份的状态（含基础备份文件夹名）。

## 恢复方法

```bash
git clone https://github.com/yokeay/baobeihuijia-db-backup.git
# 1) 建一个空的 PostgreSQL 16 库（导出用了 --no-owner --no-privileges，不要求同名角色）
# 2) 恢复基础备份（选最新 base- 文件夹；若为分片，先按 MANIFEST.json 的 reassemble_cmd 合并）
psql -v ON_ERROR_STOP=1 -d <目标库> -f base/base-XXXXXXXX/baobeihuijia_base_XXXXXXXXTXXXXXXZ.sql
# 3) 按文件名顺序依次应用增量
psql -v ON_ERROR_STOP=1 -d <目标库> -f increments/baobeihuijia_inc_XXXXXXXXTXXXXXXZ.sql
```

## 安全

**本仓库必须保持 private。** SQL 里含全量业务数据（用户手机号、提交者联系方式等）。
推送脚本每次运行前会断言仓库仍是 private，不是就拒绝推送。
MD

  jq -n \
    --arg run "$RUN_START_UTC" \
    --arg mode "$RESULT_MODE" \
    --arg base_folder "$BASE_FOLDER" \
    --arg base_file "$BASE_FILE" \
    --arg base_created "$BASE_CREATED" \
    --arg inc_file "${LAST_FILE:-}" \
    --argjson inc_bytes "${LAST_BYTES:-0}" \
    --arg inc_sha "${LAST_SHA:-}" \
    --argjson inc_stmts "${LAST_STMTS:-0}" \
    --argjson retention "$RETENTION_DAYS" \
    '{last_run_utc:$run, mode:$mode, database:"baobeihuijia",
      base:{folder:$base_folder, file:$base_file, created_utc:$base_created},
      last_increment:{file:$inc_file, bytes:$inc_bytes, sha256:$inc_sha, statements:$inc_stmts},
      retention_days:$retention, generated_by:"scripts/db-backup.sh (REQ-202610-0436)"}' \
    > "$WORK_REPO/STATUS.json"
}

write_state() {
  local end_utc
  end_utc="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  jq -n \
    --arg start "$RUN_START_UTC" \
    --arg end "$end_utc" \
    --arg file "${LAST_FILE:-}" \
    --argjson bytes "${LAST_BYTES:-0}" \
    --arg sha "${LAST_SHA:-}" \
    --argjson stmts "${LAST_STMTS:-0}" \
    --arg bf "$BASE_FOLDER" \
    --arg bfile "$BASE_FILE" \
    --arg bc "$BASE_CREATED" \
    '{last_success_start_utc:$start, last_success_end_utc:$end, last_file:$file, last_bytes:$bytes,
      last_sha256:$sha, last_statements:$stmts, base_folder:$bf, base_file:$bfile, base_created_utc:$bc}' \
    > "$STATE_FILE.tmp" && mv "$STATE_FILE.tmp" "$STATE_FILE"
}

prune_increments() {
  [ "$RETENTION_DAYS" -gt 0 ] || return 0
  log "保留策略：删除 ${RETENTION_DAYS} 天前的增量（注意：链式增量需配合定期 --rebuild-base 才不破坏恢复链）"
  local now_epoch f base stamp epoch age_days
  now_epoch="$(date -u +%s)"
  for f in "$WORK_REPO/increments/"*; do
    [ -e "$f" ] || continue
    base="$(basename "$f")"
    stamp="$(printf '%s' "$base" | sed -n 's/^baobeihuijia_inc_\([0-9]\{8\}T[0-9]\{6\}Z\).*/\1/p')"
    [ -n "$stamp" ] || continue
    epoch="$(date -u -d "$(printf '%s' "$stamp" | sed 's/^\(....\)\(..\)\(..\)T\(..\)\(..\)\(..\)Z$/\1-\2-\3T\4:\5:\6Z/')" +%s 2>/dev/null || echo 0)"
    [ "$epoch" -gt 0 ] || continue
    age_days=$(( (now_epoch - epoch) / 86400 ))
    if [ "$age_days" -ge "$RETENTION_DAYS" ]; then
      git -C "$WORK_REPO" rm -q -f "increments/$base" 2>/dev/null || rm -f "$f"
      log "保留策略：删除过期增量 $base（${age_days} 天前）"
    fi
  done
}

# ---------------------------------------------------------------------------
# 运行状态读取与模式判定
# ---------------------------------------------------------------------------
STATE_FILE="$WORK_DIR/state.json"
LAST_SUCCESS_START=""; BASE_FOLDER=""; BASE_FILE=""; BASE_CREATED=""
LAST_FILE=""; LAST_BYTES=0; LAST_SHA=""; LAST_STMTS=0
# 结果变量预初始化（set -u 下任何分支引用都安全；由 gen_base / gen_increment 填充）
RESULT_MODE=""; RESULT_FILE=""; RESULT_BYTES=0; RESULT_SHA=""; RESULT_STMTS=0
if [ -f "$STATE_FILE" ]; then
  LAST_SUCCESS_START="$(jq -r '.last_success_start_utc // empty' "$STATE_FILE" 2>/dev/null || true)"
  BASE_FOLDER="$(jq -r '.base_folder // empty' "$STATE_FILE" 2>/dev/null || true)"
  BASE_FILE="$(jq -r '.base_file // empty' "$STATE_FILE" 2>/dev/null || true)"
  BASE_CREATED="$(jq -r '.base_created_utc // empty' "$STATE_FILE" 2>/dev/null || true)"
  LAST_FILE="$(jq -r '.last_file // empty' "$STATE_FILE" 2>/dev/null || true)"
  LAST_BYTES="$(jq -r '.last_bytes // 0' "$STATE_FILE" 2>/dev/null || echo 0)"
  LAST_SHA="$(jq -r '.last_sha256 // empty' "$STATE_FILE" 2>/dev/null || true)"
  LAST_STMTS="$(jq -r '.last_statements // 0' "$STATE_FILE" 2>/dev/null || echo 0)"
fi

MODE="increment"
if [ "$REBUILD_BASE" = 1 ] || [ -z "$LAST_SUCCESS_START" ] || [ -z "$BASE_FOLDER" ]; then
  MODE="base"
fi

# ---------------------------------------------------------------------------
# 主流程
# ---------------------------------------------------------------------------
if [ "$NO_PUSH" = 0 ]; then
  assert_repo_private
  prepare_repo
else
  mkdir -p "$WORK_REPO"
fi

# 清理 7 天前的导出临时目录（失败残留）
find "$WORK_DIR" -maxdepth 1 -name 'export-*' -type d -mtime +7 -exec rm -rf {} + 2>/dev/null || true

if [ "$MODE" = "base" ]; then
  if [ "$REBUILD_BASE" = 1 ]; then
    log "模式：基础备份（--rebuild-base 强制重做）"
  else
    log "模式：基础备份（缺少上次成功记录或基础备份，先做一次性基础备份）"
  fi
  gen_base
  COMMIT_MSG="backup: 基础备份 ${BASE_FOLDER}（$(basename "$BASE_FILE")，sha256 ${RESULT_SHA:0:12}…）"
else
  CUTOFF="$(date -u -d "$LAST_SUCCESS_START - $OVERLAP_MINUTES minutes" +%Y-%m-%dT%H:%M:%SZ)"
  log "模式：增量（上次成功起点 ${LAST_SUCCESS_START}，回退 ${OVERLAP_MINUTES} 分钟 → 窗口起点 ${CUTOFF}）"
  # 覆盖检查：线上所有表都必须登记进策略（防止未来加表后静默漏备）
  mapfile -t LIVE_TABLES < <(pq "SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' ORDER BY c.relname")
  [ "${#LIVE_TABLES[@]}" -gt 0 ] || fail "读取线上表清单失败"
  for t in "${LIVE_TABLES[@]}"; do
    if [ -z "$(filter_for "$t")" ] && [ "$t" != "system_logs" ]; then
      fail "发现未登记进备份策略的表：$t（请登记后重跑）"
    fi
  done
  gen_increment
  if [ -n "$RESULT_FILE" ]; then
    COMMIT_MSG="backup: 增量 $TS（$RESULT_STMTS 条语句，sha256 ${RESULT_SHA:0:12}…）"
    LAST_FILE="$RESULT_FILE"; LAST_BYTES="$RESULT_BYTES"; LAST_SHA="$RESULT_SHA"; LAST_STMTS="$RESULT_STMTS"
  else
    COMMIT_MSG="backup: 增量 $TS（窗口内无变更，仅更新状态）"
  fi
fi

if [ "$NO_PUSH" = 1 ]; then
  log "（--no-push）本地生成完成，未推送、状态未推进"
  exit 0
fi

prune_increments
write_repo_meta
push_repo "$COMMIT_MSG

Co-Authored-By: Claude Code <noreply@anthropic.com>"
write_state
rm -rf "$EXPORT_DIR"
log "备份完成（$RESULT_MODE）"
exit 0

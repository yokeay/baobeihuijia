#!/usr/bin/env bash
# =============================================================================
# deploy.sh — 一键部署与部署后健康检查（REQ-202610-0450）
#
# 流程：同步代码 → npm ci（按需）→ npm run build → systemctl restart
#       → 健康检查（首页 200 + /api/stats + /api/cases 抽查）
#       → 任一步失败即中止并输出回滚提示（非 0 退出）
#
# 用法：
#   ./scripts/deploy.sh                  完整部署（默认拉取 local-server）
#   ./scripts/deploy.sh --no-pull        不拉代码，用当前工作区构建部署（回滚后重发）
#   ./scripts/deploy.sh --force-npm-ci   强制重装依赖（默认仅在依赖清单变化时执行）
#   ./scripts/deploy.sh --health-only    只做健康检查，不部署（可在任意目录运行）
#   ./scripts/deploy.sh -h | --help      显示帮助
#
# 环境变量（可选）：
#   DEPLOY_BRANCH=local-server               部署分支
#   SERVICE_NAME=baobeihuijia.service        systemd 服务名
#   HEALTH_BASE_URL=http://127.0.0.1:3000    健康检查地址（走本机回环；
#                                            公网域名有 Cloudflare 拦截，勿用）
#   HEALTH_TIMEOUT_SECONDS=60                健康检查总超时（秒）
#
# 退出码：0 = 部署成功且健康检查全部通过；非 0 = 失败（输出含回滚提示）
# =============================================================================
set -euo pipefail

DEPLOY_BRANCH="${DEPLOY_BRANCH:-local-server}"
SERVICE_NAME="${SERVICE_NAME:-baobeihuijia.service}"
HEALTH_BASE_URL="${HEALTH_BASE_URL:-http://127.0.0.1:3000}"
HEALTH_TIMEOUT_SECONDS="${HEALTH_TIMEOUT_SECONDS:-60}"
HEALTH_INTERVAL_SECONDS=2
HEALTH_CURL_TIMEOUT=10
LOCK_FILE="/var/lock/baobeihuijia-deploy.lock"

PULL=1
HEALTH_ONLY=0
FORCE_NPM_CI=0

REPO_DIR=""
PREV_SHA=""
NEW_SHA=""
START_SECONDS=$SECONDS
HEALTH_DEADLINE=0

# 颜色（非交互输出时自动关闭）
if [[ -t 1 ]]; then
  C_RED=$'\033[31m'; C_GRN=$'\033[32m'; C_YEL=$'\033[33m'; C_BLD=$'\033[1m'; C_RST=$'\033[0m'
else
  C_RED=""; C_GRN=""; C_YEL=""; C_BLD=""; C_RST=""
fi

info() { printf '%s[deploy]%s %s\n' "$C_BLD" "$C_RST" "$1"; }
ok()   { printf '%s[ ok ]%s %s\n' "$C_GRN" "$C_RST" "$1"; }
warn() { printf '%s[warn]%s %s\n' "$C_YEL" "$C_RST" "$1"; }

log_sys() { logger -t baobeihuijia-deploy -- "$1" 2>/dev/null || true; }

fail() {
  printf '\n%s[FAIL]%s %s\n' "$C_RED" "$C_RST" "$1" >&2
  log_sys "$1"
  if [[ -n "$PREV_SHA" ]]; then
    cat >&2 <<EOF

回滚 / 排查提示
  · 本次部署前的版本：$PREV_SHA
  · 查看服务日志：journalctl -u $SERVICE_NAME -n 100 --no-pager
  · 回滚到部署前版本并重新构建部署：
      git -C $REPO_DIR reset --hard $PREV_SHA
      cd $REPO_DIR && ./scripts/deploy.sh --no-pull --force-npm-ci
    （若回滚后该脚本不存在，说明回滚点早于脚本引入，请按 README「部署」手工执行）
EOF
  fi
  exit 1
}

trap 'code=$?; fail "脚本在未预期位置出错（退出码 $code）"' ERR

usage() {
  cat <<'EOF'
deploy.sh — 一键部署与部署后健康检查（REQ-202610-0450）

用法：./scripts/deploy.sh [选项]

选项：
  --no-pull        不拉取远程代码，直接用当前工作区构建部署（回滚后重发时用）
  --force-npm-ci   强制重新安装依赖（默认仅在依赖清单变化时执行 npm ci）
  --health-only    只做健康检查，不做任何部署动作（可在任意目录运行）
  -h, --help       显示本帮助

流程：同步代码 → npm ci（按需）→ npm run build → systemctl restart
      → 健康检查（首页 200 + /api/stats + /api/cases 抽查）→ 失败给出回滚提示

环境变量：DEPLOY_BRANCH / SERVICE_NAME / HEALTH_BASE_URL / HEALTH_TIMEOUT_SECONDS
详见 README「部署」一节与 docs/REQ-202610-0450-plan.md。
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-pull) PULL=0 ;;
    --force-npm-ci) FORCE_NPM_CI=1 ;;
    --health-only) HEALTH_ONLY=1 ;;
    -h|--help) usage; exit 0 ;;
    *) printf '未知参数：%s\n' "$1" >&2; usage >&2; exit 2 ;;
  esac
  shift
done

if ! [[ "$HEALTH_TIMEOUT_SECONDS" =~ ^[0-9]+$ ]] || (( HEALTH_TIMEOUT_SECONDS < 1 )); then
  fail "HEALTH_TIMEOUT_SECONDS 必须是不小于 1 的整数（当前：$HEALTH_TIMEOUT_SECONDS）"
fi

# ---------------------------------------------------------------------------
# 健康检查
# ---------------------------------------------------------------------------

# 校验响应内容：home=HTTP 200 即可；stats=数值型 total；cases=items 数组
validate_response() {
  local mode="$1" body="$2"
  case "$mode" in
    home)
      return 0 ;;
    stats)
      printf '%s' "$body" | node -e 'let d="";process.stdin.on("data",c=>d+=c);process.stdin.on("end",()=>{const j=JSON.parse(d);if(typeof j.total!=="number")process.exit(1);})' 2>/dev/null ;;
    cases)
      printf '%s' "$body" | node -e 'let d="";process.stdin.on("data",c=>d+=c);process.stdin.on("end",()=>{const j=JSON.parse(d);if(!Array.isArray(j.items))process.exit(1);})' 2>/dev/null ;;
    *)
      return 1 ;;
  esac
}

# 轮询健康检查：成功返回 0；到 HEALTH_DEADLINE 仍失败则明确报错并退出
health_check() {
  local name="$1" path="$2" mode="$3"
  local url="$HEALTH_BASE_URL$path"
  local last_err="HTTP 请求失败" body
  while :; do
    body=""
    if body="$(curl -fsS --max-time "$HEALTH_CURL_TIMEOUT" "$url" 2>/dev/null)"; then
      if validate_response "$mode" "$body"; then
        ok "健康检查通过：$name"
        return 0
      fi
      last_err="响应内容不符合预期"
    else
      last_err="HTTP 请求失败（服务可能尚未就绪）"
    fi
    if (( SECONDS >= HEALTH_DEADLINE )); then
      fail "健康检查失败：$name（$url）——$last_err，已等待 ${HEALTH_TIMEOUT_SECONDS} 秒。"
    fi
    sleep "$HEALTH_INTERVAL_SECONDS"
  done
}

# ---------------------------------------------------------------------------
# --health-only：只检查，不部署
# ---------------------------------------------------------------------------
if (( HEALTH_ONLY )); then
  command -v curl >/dev/null 2>&1 || fail "缺少 curl，无法进行健康检查。"
  command -v node >/dev/null 2>&1 || fail "缺少 node，无法进行健康检查。"
  info "健康检查（仅检查，不部署）：$HEALTH_BASE_URL（总超时 ${HEALTH_TIMEOUT_SECONDS}s）"
  HEALTH_DEADLINE=$((SECONDS + HEALTH_TIMEOUT_SECONDS))
  health_check "首页 /" "/" home
  health_check "统计接口 /api/stats" "/api/stats" stats
  health_check "案件列表 /api/cases?limit=1" "/api/cases?limit=1" cases
  ok "健康检查全部通过"
  exit 0
fi

# ---------------------------------------------------------------------------
# 主流程：完整部署
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if ! REPO_DIR="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null)"; then
  fail "无法定位 git 仓库根目录：脚本应位于仓库内（如 <仓库>/scripts/deploy.sh）。"
fi
cd "$REPO_DIR"

if (( EUID != 0 )); then
  fail "需要 root 权限执行部署（systemctl restart 需要），请用 root 或 sudo 运行。"
fi

exec 9>"$LOCK_FILE" || fail "无法创建部署锁文件 $LOCK_FILE。"
if ! flock -n 9; then
  fail "另一个部署正在进行中（锁：$LOCK_FILE），请等待其结束后重试。"
fi

# git 输出统一过滤，避免把带凭据的远程 URL 回显到日志
git_masked() {
  local status
  git -C "$REPO_DIR" "$@" 2>&1 | sed -E 's#(https?://)[^@/[:space:]]+@#\1***@#g'
  status=${PIPESTATUS[0]}
  return "$status"
}

# ---- 部署前守卫 ----
CURRENT_BRANCH="$(git branch --show-current)"
if [[ -z "$CURRENT_BRANCH" ]]; then
  fail "当前处于 detached HEAD 状态，拒绝部署。请先 git switch $DEPLOY_BRANCH。"
fi
if [[ "$CURRENT_BRANCH" != "$DEPLOY_BRANCH" ]]; then
  fail "当前分支为 '$CURRENT_BRANCH'，部署必须在 '$DEPLOY_BRANCH' 分支上进行。请先合并代码到 $DEPLOY_BRANCH。"
fi

DIRTY="$(git status --porcelain --untracked-files=no)"
if [[ -n "$DIRTY" ]]; then
  printf '%s\n' "$DIRTY" >&2
  fail "工作区存在未提交的已跟踪文件改动，已中止部署（防止覆盖现场改动）。请先提交/暂存/还原后重试；未跟踪文件不影响部署。"
fi

if ! systemctl cat "$SERVICE_NAME" >/dev/null 2>&1; then
  fail "未找到 systemd 服务 $SERVICE_NAME，无法部署。"
fi
SVC_WORKDIR="$(systemctl show "$SERVICE_NAME" -p WorkingDirectory --value)"
if [[ "$SVC_WORKDIR" != "$REPO_DIR" ]]; then
  fail "脚本所在仓库（$REPO_DIR）与服务运行目录（${SVC_WORKDIR:-未设置}）不一致，已中止部署。"
fi

PREV_SHA="$(git rev-parse HEAD)"
info "部署开始：分支 $DEPLOY_BRANCH · 服务 $SERVICE_NAME · 当前版本 ${PREV_SHA:0:10}"

# ---- 1/5 同步代码 ----
if (( PULL )); then
  info "同步代码：git fetch + git pull --ff-only origin $DEPLOY_BRANCH"
  git_masked fetch origin "$DEPLOY_BRANCH" || fail "git fetch 失败（网络或远程凭据问题），线上未改动。"
  git_masked pull --ff-only origin "$DEPLOY_BRANCH" || fail "git pull --ff-only 失败（本地可能有分叉或未推送提交），线上未改动。"
else
  warn "已跳过代码同步（--no-pull）：直接使用当前工作区内容"
fi
NEW_SHA="$(git rev-parse HEAD)"
if [[ "$NEW_SHA" == "$PREV_SHA" ]]; then
  info "代码无变化（${NEW_SHA:0:10}），继续构建部署"
else
  info "代码已更新：${PREV_SHA:0:10} → ${NEW_SHA:0:10}"
fi

# ---- 2/5 依赖（按需 npm ci）----
need_npm_ci=0
if (( FORCE_NPM_CI )); then
  need_npm_ci=1
elif [[ ! -f node_modules/.package-lock.json ]]; then
  need_npm_ci=1
elif [[ ! package.json -ot node_modules/.package-lock.json || ! package-lock.json -ot node_modules/.package-lock.json ]]; then
  need_npm_ci=1
fi
if (( need_npm_ci )); then
  info "安装依赖：npm ci"
  npm ci || fail "npm ci 失败：node_modules 可能处于不完整状态，线上服务未重启。请排查后重跑（或加 --force-npm-ci 强制重装）。"
  ok "依赖安装完成"
else
  info "依赖无变化，跳过 npm ci（需要强制重装时用 --force-npm-ci）"
fi

# ---- 3/5 构建 ----
info "构建：npm run build"
npm run build || fail "构建失败：服务未重启，线上仍是部署前版本（${PREV_SHA:0:10}）。修复后重跑本脚本即可。"
ok "构建完成"

# ---- 4/5 重启服务 ----
info "重启服务：systemctl restart $SERVICE_NAME"
systemctl restart "$SERVICE_NAME" || fail "systemctl restart $SERVICE_NAME 失败。"
for _ in {1..15}; do
  if systemctl is-active --quiet "$SERVICE_NAME"; then break; fi
  sleep 1
done
if ! systemctl is-active --quiet "$SERVICE_NAME"; then
  fail "服务重启后 15 秒内未进入 active 状态。"
fi
ok "服务已重启并处于 active"

# ---- 5/5 健康检查 ----
info "健康检查：$HEALTH_BASE_URL（总超时 ${HEALTH_TIMEOUT_SECONDS}s）"
HEALTH_DEADLINE=$((SECONDS + HEALTH_TIMEOUT_SECONDS))
health_check "首页 /" "/" home
health_check "统计接口 /api/stats" "/api/stats" stats
health_check "案件列表 /api/cases?limit=1" "/api/cases?limit=1" cases

# ---- 完成 ----
ELAPSED=$((SECONDS - START_SECONDS))
printf '\n%s[ ok ] 部署成功%s\n' "$C_GRN" "$C_RST"
if [[ "$NEW_SHA" == "$PREV_SHA" ]]; then
  printf '  版本：%s（代码无变化，重新构建部署）\n' "${NEW_SHA:0:10}"
else
  printf '  版本：%s → %s\n' "${PREV_SHA:0:10}" "${NEW_SHA:0:10}"
fi
printf '  服务：%s（active）\n' "$SERVICE_NAME"
printf '  健康检查：首页 200 / 统计接口 / 案件列表接口 全部通过\n'
printf '  耗时：%ss\n' "$ELAPSED"
log_sys "部署成功 ${PREV_SHA:0:10} -> ${NEW_SHA:0:10}（${ELAPSED}s）"

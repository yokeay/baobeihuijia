# INTERPOL 黄色通报（Yellow Notices）可行性验证

> 需求编号：`REQ-202610-0447`「INTERPOL Yellow Notices 可行性验证」（对应《后续发展规划与需求拆解》第 19 项）
> 文档性质：**可行性验证报告（docs-only）**。不含代码改动、不涉及版本号变更、不触发生产部署。
> 依据：[《全球失踪人口数据源扩展调研》（REQ-202609-0095）§4.1 / §7.2](./REQ-202609-0095-global-data-source-research.md)；[《后续发展规划与需求拆解》（REQ-202610-0267）第 19 项](./REQ-202610-0267-development-roadmap.md)
> 验证日期：2026-10-13（UTC）；分支：`req-202610-0447-interpol-feasibility`；部署分支：`local-server`。
> 原始留档：日志 / 截图 / 条款原文存于服务器验证工作目录 `/root/.bhj-0447/evidence/`（`qps2.jsonl`、`qps2.csv`、`list_page.html`、`list_page.png`、`terms-of-use.txt` 等）。

## 一、结论摘要

**结论：条件 —— 技术上可行（全链路已实测打通）；合规上必须先取得 INTERPOL 书面许可，未获许可前不建议立项开发。**

| 维度 | 结果 |
| --- | --- |
| 浏览器渲染稳定性 | ✅ 列表页累计加载 11 次全部成功（含冷启动、QPS 后复载），0 次挑战页/验证码；完整渲染 ≈0.36s |
| 传输通道 | ⚠️ 仅「页面上下文 fetch」可用；curl / Playwright APIRequestContext / 第三方抓取一律 403（Akamai） |
| QPS | ✅ 0.5 / 1 / 2 QPS 三档短测零失败（p50 80–89ms）；未继续上探；生产建议 ≤0.5–1 QPS |
| 数据量 | 11,721 条在流通（实时变动）；字段齐、含照片；平台相关切片 CN 26 / KR 29 |
| 全量枚举 | ⚠️ 单次查询窗口上限 160 条（`_links.last` 自证）；全量须按过滤器递归切片 |
| 失效风险 | 🔴 高：依赖浏览器指纹对抗，WAF 加固 / 改版随时可能失效 |
| 合规 | 🔴 决定性阻塞：ToS 明文禁止未经书面许可的转载与数据挖掘；非商业豁免不含失踪人员数据与照片 |

**建议**：先向 INTERPOL 发函申请书面许可（说明公益用途、展示方式、来源标注与撤回机制）；获批后按第六节接入（预计 3–5 人日）；未获批则维持 P2 暂缓，不实现抓取。

## 二、验证方法与边界

- **环境**：本平台生产服务器（数据中心 IP，即 0095 中被 Akamai 拦截的同一出口）；无头 Chromium 1243（Playwright，真实 Chrome UA）。
- **边界**：一次性小规模验证；页面加载 11 次、API 请求约 90 次；未做批量抓取、未落库、未改任何代码。
- **回答 0095 §4.1 遗留三问**：① 无头浏览器能否稳定取到列表 + 详情；② QPS 上限多少；③ 失效风险。
- **补充实测**：传输通道矩阵、过滤参数、分页窗口、图片可用性、robots.txt 与 ToS 原文。

## 三、技术验证结果

### 3.1 浏览器渲染稳定性 ✅

- 列表页（View-Yellow-Notices）累计加载 **11 次全部 HTTP 200**，含冷启动、连续加载、QPS 压测后复载；**0 次** Akamai 挑战页 / 验证码 / 拦截（逐次检查 challenge 标记）。
- 完整渲染（"Search results: 11721" + 20 张卡片出现）实测 **≈0.36s**（另一轮在 200ms 时仍是服务端占位值，说明结果数由前端 JS 填充）。
- 卡片结构：每页 20 张（`a.redNoticeItem__labelLink`，带 `data-singleurl` 指向详情接口），缩略图 184×238 由页面子资源正常加载。

### 3.2 传输通道（关键工程结论）⚠️

| 方式 | 结果 |
| --- | --- |
| curl / 第三方抓取直连 API（含完整 sec-ch-ua、Referer、HTTP/2） | **403**（408B 拦截页） |
| Playwright `APIRequestContext`（ctx.request） | **403** |
| **页面上下文 fetch（在已加载的页面内发起）** | **200** ✅ |
| 图片：`<img>` 子资源 / 页面内 fetch | **200** ✅ |

结论：Akamai 按客户端指纹（TLS / HTTP2 / JS 环境）拦截非浏览器请求；**实现必须经由真实浏览器引擎，且所有 API 调用必须在页面上下文内发起**（页面内 fetch 是唯一实测可用通道）。这是本方案的核心技术约束，也是其脆弱性来源。

### 3.3 QPS 阶梯 ✅

`resultPerPage=160`，页面上下文 fetch：

| 阶段 | 请求数 | 间隔 | 非 200 | 延迟 p50 / p90 |
| --- | --- | --- | --- | --- |
| 0.5 QPS | 12 | 2.0s | 0 | 80 / 96 ms |
| 1 QPS | 8 | 1.0s | 0 | 84 / 97 ms |
| 2 QPS | 4 | 0.5s | 0 | 89 / 136 ms |

2 QPS 短时零失败；为避免触发封禁未继续上探，**生产建议 ≤0.5–1 QPS**（配合退避重试）。延迟稳定在 ~100ms 级。

### 3.4 数据量与字段

- 在流通总量：**11,721**（2026-10-13 UTC；验证期间观测到 11721 ↔ 11722 的实时变动）。
- 详情接口：`/notices/v2/yellow/{id}`（id 形如 `2026/71729`，URL 中用 `2026-71729`）；字段：`entity_id`、`name`、`forename`、`birth_name`、父母姓名、`date_of_birth`、`place_of_birth`、`nationalities`、`issuing_country`、`date_of_event`、`place`、`sex_id`、`height`、`weight`、`eyes_colors_id`、`hairs_id`、`distinguishing_marks`、`languages_spoken_ids`、`countries_likely_to_be_visited` + 照片链接。**与 `cases_xx` 表基本可一一映射，无需改表结构**。
- 照片：列表卡片与详情均带照片 URL，实测页面内可取（image/JPG）。

### 3.5 过滤与切片（全量枚举的前提）

- `nationalities=CN` → **26**；`nationalities=CN,KR` → **55**（逗号分隔与重复参数两种写法均有效）；`issuingCountries=CN` → **1**。
- `sexId=F` 有效：US 220 → US×F **92**；`dateOfDisapearanceFrom/To`（`YYYY/MM/DD` 格式）有效：2025 年 **767**、2026 年 **521**；宽范围 1990–2026 → **11,533**（≈总量，说明该字段覆盖大部分记录）。
- 大国切片示例：MX **2,694**（单查询窗口装不下，需性别 / 年龄段 / 日期多层拆分）。

### 3.6 分页窗口（重要限制）⚠️

- 站点原文："This site displays up to **160 notices per search result**" —— 单次查询可访问上限 **160 条**，与页大小无关（API 自身 `_links.last` 自证：rpp=1 → page=160；rpp=20 → page=8；rpp=160 → page=1）。
- **超出窗口的翻页会被钳制到窗口末页**：rpp=160 时第 2 页起返回第 1 页内容；rpp=20 时第 9 页起返回第 8 页（响应 `self` 链接显示被钳制的页码）。
- 含义：① 全量 11,721 条**不能顺序翻页取完**，必须按过滤器递归切片（每片 ≤160）；② 实现须按 `_links.last` 翻页并以 `entity_id` 去重，避免回绕重复。

### 3.7 会话与反爬观察

- 冷启动无需 cookie 即可在页面内 fetch API（200）；全程无验证码、无二次验证。
- QPS 压测后列表页仍正常复载（会话未受影响）。

## 四、合规审查（决定性）

### 4.1 robots.txt

仅禁检索页系列（`Disallow: /ar|en|es|fr/Search-Page`、`/Search-Page`），**未禁**通报页；但 robots 不构成授权。

### 4.2 使用条款（ToS，2026-10-13 抓取原文）

> "Without prior written permission of INTERPOL it is forbidden: to make any other use than those specified above, including commercial use, of information posted on the Site, to reproduce the information of the Site on wanted and missing persons on any other website or in any other form, to copy, store in a retrieval system, or transmit in any form or by any means the information of the Site to any third party, to use any of data mining, robots, or similar data-gathering and extraction tools."

> 非商业豁免条款明确排除："…**except for the personal data and pictures of the wanted and missing persons**, is authorized for personal non-commercial … purposes…"

即：**「非商业」不豁免失踪人员个人数据与照片**；把通报转载到本站（含照片）与机器人抓取都落在明文禁止清单里，**唯一可行路径是取得 INTERPOL 事先书面许可**。

### 4.3 判定

- 本平台会把失踪人员信息（含照片）展示在自有站点 → 正是 ToS 禁止的「reproduce … on any other website」。
- 0095 §6.5 的合规基线（每源须有许可依据）——本源**当前无许可依据**，属决定性阻塞。
- **立项前置条件：INTERPOL 书面许可**（申请入口：<https://www.interpol.int/en/Contacts/Contact-INTERPOL>）。

## 五、失效风险清单

| 风险 | 说明 | 缓解 |
| --- | --- | --- |
| WAF 加固 | 依赖浏览器指纹不被识别；Akamai 规则随时可能升级 | 定期健康检查；失败即停不硬闯 |
| 站点 / 接口改版 | v2 接口为未公开契约，路径与参数随时可变（v1 已废） | 解析层隔离、失败告警 |
| 频率封禁 | 真实阈值未知（≥2 QPS 短测未触发） | 生产 ≤0.5–1 QPS + 退避 |
| 合规（最高） | 无授权状态下随时可被要求停止 | 先取书面许可；来源标注、撤回机制（0095 §6.2 / §6.3） |
| 数据敏感性 | 含大量未成年人 | 沿用平台审核与撤回机制 |

## 六、实现建议（若获批立项）

1. **sync 模块**：`src/lib/sync/interpol.ts` + 常驻小进程（无头 Chromium，页面上下文 fetch）；≤1 QPS；按 `nationalities` / 日期递归切片（每片 ≤160），按 `_links.last` 翻页，`entity_id` 去重。
2. **增量**：按 `dateOfDisapearance` 年度切片做差量（格式 `YYYY/MM/DD`，实测有效）；全量兜底周期性跑。
3. **图片**：页面子资源 / 页面内 fetch 热链（沿用现有热链策略；纳入 0095 §6.4 照片巡检）。
4. **合规落地**：许可凭证（函件 / 邮件编号）存档并写入模块头注释（0095 §6.5）。
5. **工作量预估**：获批后 3–5 人日（含健康检查与告警）。
6. **优先级建议**：维持 P2 —— 对平台的即时价值集中在长尾国家（CN 仅 26 条），而维护成本与失效风险显著高于现有 HTML / JSON 源。

## 七、原始证据

- 探测脚本：`interpol_explore.py`、`interpol_stability_qps.py`、`interpol_qps2.py`、`interpol_micro.py`、`interpol_micro2.py`、`interpol_micro3.py`、`interpol_micro4.py`
- 日志：`evidence/qps2.jsonl`、`qps2.csv`、`explore.jsonl`、`stability_qps.jsonl`
- 页面留档：`list_page.html`、`list_page.png`、`robots.txt`、`terms-of-use.txt`
- 全部为 2026-10-13 UTC 实测；留档于 `/root/.bhj-0447/evidence/`。

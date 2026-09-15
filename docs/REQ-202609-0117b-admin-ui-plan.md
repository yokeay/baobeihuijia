# 后台管理 UI 企业级重做 — 技术方案

需求编号：REQ-202609-0117b
分支：`req-202609-0117b`
关联需求：REQ-202609-0117（后台管理页面优化，已完成第一轮）

## 一、需求复述

> 页面再美化一下，现在这个页面样式还是不太行，不够细腻，要用企业级开发的 UI 设计去美化每一个菜单页面，重新去做。

即：**不是打补丁，而是为整个后台建立一套统一的设计系统，并把全部菜单页面按这套系统重写。**

## 二、现状问题

1. **没有设计系统**。`src/components/ui/` 下已有 Button / Drawer / Input / Icon / LineChart / Modal / Odometer / RefreshButton / Skeleton / Toast，但后台页面**一个都没用**，全是各写各的内联 Tailwind。
2. **同类元素样式不一致**：状态徽章在 cases 用 `rounded-md + 边框`，在 clues/comments/questions 用 `rounded-full + 实底`；分页在 cases 是「← 1/3 →」，在 users 是方形页码，在 clues 是整排数字按钮 —— 三套。
3. **每个页面重复定义** `th`/`td`/`tdMuted`/`trClass` 四个常量（clues/comments/questions/user-logs 各一份，内容完全相同）。
4. **四个页面里有一份完全相同的 `CaseDetail` 组件**（clues / comments / questions / user-logs），复制粘贴了 4 遍。
5. **页面标题层级混乱**：`text-[15px] font-semibold` + `mb-4`/`mb-6` 混用；有的页面标题旁就是刷新按钮，有的隔了一行。
6. **筛选器形态混乱**：cases 用分段控件，clues/comments/questions/user-logs 用原生 `<select>` 且没有箭头样式，视觉重量和表格对不上。
7. **加载态是纯文字**「加载中...」，空态是纯文字「暂无数据」，没有骨架屏、没有留白节奏。
8. **无品牌色**。全站主色 `#e60012`，后台却整体是灰阶，跟 C 端割裂。
9. **表格**无表头底色、无行悬浮反馈层次、数字未用 `tabular-nums`、时间列未做窄体处理。

## 三、设计方向

企业级后台的观感来自**克制的一致性**，而不是花哨：统一的栅格节奏、统一的圆角/阴影层级、统一的语义色、统一的交互反馈。

- **色彩**：中性底 `#f6f7f9`，卡片纯白；主色 `#e60012` 只用于「当前选中 / 主操作 / 品牌标识」，语义色只用低饱和度的 tint 底 + ring 描边，不做大面积实色填充。
- **层次**：阴影只保留两级 —— 卡片 `0 1px 2px + 0 8px 24px -12px`，浮层 `0 20px 60px`。圆角统一 `16px`（卡片）/ `12px`（控件）/ `999px`（徽章）。
- **排版**：页标题 19px/600 带 -0.01em 字距 + 12.5px 灰色副标题；表格表头 11px 大写字距 +6%；数字一律 `tabular-nums`。
- **密度**：控件高度统一 36px；表格单元格 `px-4 py-3`；页面左右留白 `28px`。
- **反馈**：行悬浮 `#fafbfc`；输入聚焦 `ring-[#e60012]/8` + 边框转品牌色；骨架屏代替「加载中...」。

## 四、实施方案

### 4.1 新增文件

| 文件 | 作用 |
| --- | --- |
| `src/components/ui/admin/kit.tsx` | 后台设计系统组件库（唯一真源） |
| `src/components/ui/admin/CaseDetailPanel.tsx` | 抽出的公共案例详情（替换 4 处复制粘贴） |
| `docs/REQ-202609-0117b-admin-ui-plan.md` | 本文档 |

### 4.2 `kit.tsx` 导出清单

- 容器：`Panel`（卡片）、`PanelHeader`
- 页头：`PageHeader`（标题 / 副标题 / 右侧操作区）
- 工具条：`Toolbar`、`SearchField`（含搜索按钮、清空按钮、回车提交）、`Segmented`（macOS 式分段控件）、`SelectField`（带自绘箭头的原生 select）、`IconButton`
- 表格：`Table`、`Th`、`Tr`、`Td`、`TdMuted`、`TableSkeleton`
- 状态：`Badge` + `statusTone()`、`EmptyState`
- 分页：`Pagination`（页码窗口 + 省略号 + 上/下页）
- 指标：`StatCard`
- 详情：`DetailField`、`DrawerSection`

### 4.3 图标补充

向 `src/components/ui/Icon.tsx` 追加：`SearchIcon`、`ChevronLeftIcon`、`ChevronRightIcon`、`ChevronDownIcon`、`InboxIcon`、`CheckIcon`、`CloseIcon`、`PencilIcon`、`RefreshIcon`、`LogoutIcon`、`GlobeIcon`、`TrendUpIcon`。（只增不改，公共站点不受影响。）

### 4.4 逐页改造

| 页面 | 改造点 |
| --- | --- |
| `admin/layout.tsx` | 侧栏加宽至 240px、品牌标识块、分组标题、选中态品牌色药丸 + 左侧强调条；底部控制区改为图标按钮组 + 用户卡片；主区换中性底色与 28px 留白；加载态换 spinner 卡片 |
| `admin/dashboard` | 4 张 `StatCard`（图标 + 语义色调 + 副标题）；图表统一 `Panel` + `Segmented` 区间切换；底部补「待办概览」面板（复用现有 sidebar i18n key，无新增文案） |
| `admin/review` | `PageHeader` + `Segmented` 切换帖子/线索 + `SearchField`；两套表格换 `Table` 原语；`Pagination` 换新版；抽屉详情换 `DetailField` |
| `admin/cases` | `PageHeader` + 两个 `Segmented` + `SearchField`；表格、分页、抽屉全部换新原语；可编辑字段保留原逻辑，仅换样式 |
| `admin/clues` | 同上（状态筛选改 `Segmented`），`CaseDetail` 换公共组件 |
| `admin/comments` | 同上 |
| `admin/questions` | 同上 |
| `admin/user-logs` | `PageHeader` + `Toolbar`（操作类型 `SelectField` 9 项 + `SearchField`）+ 新表格分页；`CaseDetail` 换公共组件 |
| `admin/users` | `PageHeader` + `SearchField`；表格换原语；分页换 `Pagination` |
| `admin/audit-log` | `PageHeader` + `Badge` 语义色 + 新表格；时间列 `tabular-nums` 右对齐 |
| `admin/login` | 居中品牌卡片 + 渐变底 + 主色按钮（含 GitHub 图标） |

### 4.5 不做的事

- **不动任何数据逻辑**：所有 `fetch` / `useState` / `useCallback` / 分页参数 / 接口路径 / 字段名保持逐字节不变。
- **不动 i18n**：不新增翻译 key，全部复用现有 `t.*`。
- **不动公共站点**：所有改动限定在 `src/app/admin/**`、`src/components/ui/admin/**`，以及 `Icon.tsx` 的追加导出。

## 五、验证

1. `tsc --noEmit` 语法检查（worktree 内）
2. 主仓库 `npm run build` 通过
3. `systemctl restart baobeihuijia.service`
4. 线上取 `.next/static/chunks` 校验新样式类（如 `admin-shell`、`StatCard` 特征类）存在
5. `/admin/login`、`/` 返回 200

## 六、风险

- 后台需登录，**无法做像素级视觉验收**，只能通过构建产物 + 类名哈希证明已上线；视觉效果需人工登录确认。
- 页面数量多，改动面大，靠「数据逻辑零改动」控制风险 —— 每页只替换 JSX 外壳。

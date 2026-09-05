# 我好想你 · IMU

> 让失散的家人，被世界发现 — 用每一次传播，缩短回家的距离

**IMU**（I Miss You）是一个纯公益、非营利的全球失踪人口信息聚合平台，线上地址 **[wohaoxiangni.com](https://wohaoxiangni.com)**。平台聚合各国公开的官方寻人数据与用户提交信息，永久免费，不收取任何费用，也不提供有偿寻人服务。

平台不是执法机构，也不替代报警。掌握线索请直接联系当地公安机关。

![首页](docs/screenshots/hero-desktop.png)

---

## 界面

<table>
<tr>
<td width="62%"><img src="docs/screenshots/feed-desktop.png" alt="桌面端瀑布流"></td>
<td width="38%"><img src="docs/screenshots/feed-mobile.png" alt="移动端瀑布流"></td>
</tr>
<tr>
<td align="center"><sub>桌面端 · 参差瀑布流</sub></td>
<td align="center"><sub>移动端 · 两列图文流</sub></td>
</tr>
</table>

卡片高度取自照片真实宽高比，未加载时按案件 id 哈希出种子比例，因此列与列天然错落，不会出现固定循环造成的整齐感。

## 功能

**寻人信息**
- 聚合中国大陆、香港、美国等地区的公开失踪人口数据，累计收录 7 万余条
- 按地区、性别、姓名多维筛选；地区选项由该国实际数据聚合而来，每个选项都筛得出结果
- 案件详情页含体貌特征、走失时间地点、原始来源链接、线索时间线、评论与疑问

**多语言 / 多地区**
- 10 种界面语言：简体中文、繁体中文、English、日本語、한국어、Français、Deutsch，以及维吾尔文、蒙古文、藏文
- 语言随所选国家/地区自动切换：中国大陆简体，香港/澳门/台湾繁体，日本日文，韩国韩文，法国法文，德国德文，其余英文兜底
- 新疆、内蒙古、西藏三个自治区可在民族文字与中文之间自主选择
- 海外 IP 访问时右上角提示是否切换到当地数据，**不自动切换**

**用户参与**
- 手机号登录，随机生成用户名与头像，不索取真实姓名
- 提交失踪信息或线索，全部经人工审核后发布
- 关注案件、浏览量统计、评论与提问

**审核后台**
- 案件/线索/评论/疑问四类审核队列，操作留审计日志
- 数据源同步、平台统计图表、用户管理与行为日志

## 技术栈

| | |
|---|---|
| 框架 | Next.js 16（App Router）+ React 19 + TypeScript |
| 样式 | Tailwind CSS 4 |
| 数据库 | PostgreSQL + Drizzle ORM |
| 鉴权 | JWT（jose / jsonwebtoken）+ bcrypt |
| 图片 | 热链上游来源，无本地转存 |
| 部署 | 自有服务器 + systemd，Cloudflare 前置 |

## 数据来源

| 地区 | 来源 | 说明 |
|---|---|---|
| 中国大陆 | 公开寻人数据聚合 | 主表 `cases` |
| 香港 | [香港警务处失踪人士公告](https://www.police.gov.hk/info/appeals_public/missing_persons/) | `src/lib/sync/hongkong.ts` |
| 美国 | [NamUs](https://www.namus.gov/) | `src/lib/sync/namus.ts` |

每个国家/地区一张独立表（`cases_us`、`cases_hk` …）。**香港、澳门、台湾不并入中国大陆数据**，各自独立；暂无数据源的地区返回空，界面上不显示地区筛选。

## 本地开发

```bash
npm install
cp .env.example .env      # 填入 DATABASE_URL 等
npm run dev               # http://localhost:3000
```

常用命令：

```bash
npm run build             # 生产构建
npm run lint              # ESLint
npx tsc --noEmit          # 类型检查
npx drizzle-kit push      # 同步 schema
python3 scripts/screenshot.py   # 无头浏览器截图（写入 docs/screenshots/）
```

> 截图脚本注意两点：Playwright 期望的浏览器目录号可能与本机已装的不一致，脚本会自行解析真实二进制路径，不需要跑 `playwright install`；上游图床对 HeadlessChrome 的 UA 返回 429，脚本已设置常规 Chrome UA（真实访客不受影响）。

## 部署

生产部署分支是 **`local-server`**，不是 `main`。仓库没有 CI，部署由服务器本地完成：

```bash
git pull origin local-server
npm ci                    # 依赖缺失时 systemd 启动会失败
npm run build
systemctl restart baobeihuijia
```

systemd 单元 `baobeihuijia.service` 直接执行 `node node_modules/next/dist/bin/next start -p 3000`，并设有内存上限与崩溃自愈。线上验证走 `http://localhost:3000`——公网域名经 Cloudflare，命令行访问会被 bot 挑战拦成 403。

## 目录结构

```
src/
├── app/
│   ├── page.tsx              首页（Hero + 侧栏筛选 + 瀑布流）
│   ├── case/[id]/            案件详情：server 层出元数据，client 层管交互
│   ├── submit/               信息与线索提交
│   ├── profile/              个人资料
│   ├── terms/  privacy/      用户协议 / 隐私政策
│   ├── admin/                审核后台
│   ├── api/                  cases / regions / stats / geo / auth / upload …
│   ├── opengraph-image.tsx   运行时生成分享卡片
│   ├── sitemap.ts  robots.ts
│   └── globals.css           设计 token、心跳与卡片动效
├── components/
│   ├── case/                 CaseCard / CaseGrid / CaseSidebar
│   ├── layout/               Header / Footer / LegalPage / 地区与语言提示
│   └── shared/               地区选择器（大陆级联 / 香港总区 / 数据驱动）
└── lib/
    ├── i18n/public/          10 个语言包，类型由 zh.ts 推导
    ├── db/                   schema、多国表工具、案件查询
    ├── sync/                 香港、NamUs 数据同步
    └── countries.ts          国家 → 语言 + 地区筛选类型映射
```

## 法律

- [用户协议](https://wohaoxiangni.com/terms)
- [隐私政策](https://wohaoxiangni.com/privacy)

平台不公开任何提交者的联系方式，也不提供用户间私信，以降低诈骗与二次伤害风险。

## 致谢

服务器由 ClodHost.com 捐助，域名由安徽安庆太湖王震捐助，技术支持 SunChengxin。

## 待办

- `ug` / `mn` / `bo` 三个民族语言包目前是机器翻译占位，**上线给真实用户前需母语译者校对**
- 澳门、台湾及日韩法德等地区尚无数据源接入
- 照片全部热链上游，未做本地缓存与失效检测

---

<sub>本平台为纯公益性质。如有线索请联系当地公安机关。</sub>

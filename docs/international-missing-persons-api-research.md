# 国际失踪人口公益 API 调研报告

> 调研日期：2026-06-27
> 目标：评估各国失踪人口数据库 API 可用性，优先接入德国和美国

---

## 一、总览

| 国家/组织 | 数据库名称 | 公开 API | 数据格式 | 接入难度 | 建议优先级 |
|-----------|-----------|----------|----------|----------|------------|
| 美国 | NamUs (DOJ) | 有（REST） | JSON | ⭐⭐ 中 | P0 |
| 美国 | NCMEC | 有（受限） | JSON | ⭐⭐⭐ 高 | P0 |
| 德国 | BKA Vermisstendatei | ❌ 无 | — | ⭐⭐⭐⭐⭐ 极高 | P1 |
| 国际 | Interpol Yellow Notices | ❌ 无公开 API | HTML/XML | ⭐⭐⭐⭐ 高 | P1 |
| 欧洲 | Missing Children Europe | 有（合作方） | JSON | ⭐⭐⭐⭐ 高 | P2 |
| 国际 | ICMEC GMCN | ❌ 无公开 API | — | ⭐⭐⭐⭐ 高 | P2 |

---

## 二、美国 — NamUs（推荐）

### 2.1 基本信息

- **全称**：National Missing and Unidentified Persons System
- **主管机构**：美国司法部（DOJ）/ 国家司法研究所（NIJ）
- **官网**：<https://namus.nij.ojp.gov>
- **覆盖范围**：失踪人员 + 身份不明遗体 + 无人认领人员
- **数据量**：约 20,000+ 失踪案例、15,000+ 身份不明案例

### 2.2 API 现状

NamUs 提供 RESTful API，支持以下端点：

```
GET  /api/Cases/MissingPersons     — 失踪人员列表
GET  /api/Cases/UnidentifiedPersons — 身份不明遗体
GET  /api/Cases/UnclaimedPersons   — 无人认领人员
GET  /api/Cases/{id}               — 案例详情
```

- **认证方式**：API Key（需注册申请）
- **响应格式**：JSON
- **查询参数**：姓名、年龄范围、性别、种族、州/城市、失踪日期区间等
- **返回字段**：姓名、照片 URL、体貌特征、失踪时间、最后出现地点、案件编号

### 2.3 优势

- 数据标准化程度高，字段结构化
- 官方维护，数据权威
- 照片资源可获取
- 与 NCIC（FBI 国家犯罪信息中心）互通

### 2.4 劣势

- API 文档不够完善，需联系官方获取完整文档
- 可能存在调用频率限制
- 需要英文界面适配

### 2.5 接入评估

- **可行性**：✅ 可行
- **开发工作量**：约 2-3 个工作日（API 对接 + 数据模型映射 + 定时同步）
- **建议方案**：
  1. 申请 NamUs API Key
  2. 定时任务（如每 6 小时）拉取增量数据
  3. 存储到本地 `cases` 表，设置 `country_code = "US"`
  4. 英文版前端直接展示

---

## 三、美国 — NCMEC（辅助）

### 3.1 基本信息

- **全称**：National Center for Missing & Exploited Children
- **官网**：<https://www.missingkids.org>
- **覆盖范围**：失踪儿童专项

### 3.2 API 现状

NCMEC 的公开程度不如 NamUs：

- **Public Poster API**：用于分发失踪儿童海报数据（需合作方协议）
- **CyberTipline API**：仅限于电子服务提供商（ESP）强制报告使用（18 U.S.C. § 2258A），不对公益用途开放
- **AMBER Alert Feed**：地理定位的 AMBER 警报数据流

### 3.3 接入评估

- **可行性**：⚠️ 受限
- **建议**：优先使用 NamUs（已包含 NCMEC 的儿童失踪数据），NCMEC 作为补充来源需签署合作协议
- **开发工作量**：合作协议审批流程可能较长（估计 1-2 月）

---

## 四、德国 — BKA / 其他来源

### 4.1 BKA 失踪人员数据库

- **全称**：Bundeskriminalamt Vermisstendatei
- **官网**：<https://www.bka.de/DE/IhreSicherheit/Fahndungen/Personen/VermisstePersonen/vermisstepersonen_node.html>
- **核心问题**：**没有公开 API**
- 数据仅对警察和检察机构开放（INPOL 系统）
- 公开的 Fahndungsseite 仅为 HTML 网页搜索，无机器可读接口
- 德国严格的个人数据保护法（BDSG/DSGVO）使得公开失踪人员数据的 API 化极为困难

### 4.2 替代方案

#### 方案 A：Interpol Yellow Notices

Interpol 发布了德国的部分失踪人员信息，可通过公开页面获取：
- 官网：<https://www.interpol.int/en/How-we-work/Notices/Yellow-Notices>
- 数据量：少量（全球范围内精选案例）
- 限制：无 API，仅 HTML 页面

#### 方案 B：Missing Children Europe

- 官网：<https://missingchildreneurope.eu>
- 覆盖 31 个欧洲国家（含德国）
- 提供合作方 API（116000 热线网络），但需签署合作协议
- 仅限儿童失踪，不包括成人

#### 方案 C：116000 热线网络（德国）

- 德国全国统一失踪儿童热线 116000
- 由私人组织 `Initiative Vermisste Kinder` 运营
- 网站：<https://www.vermisste-kinder.de/>
- 无公开 API，但可作为数据源进行合作对接

#### 方案 D：自建录入 + 协会合作

鉴于德国几乎没有公开 API 可用，最可行的方案是：
1. 与德国失踪人员公益组织建立合作（如 `Initiative Vermisste Kinder`、`Weisser Ring`）
2. 获得授权后定期获取/同步案例数据
3. 开放德国用户自主提交失踪信息（User Generated Content）
4. 配合人工审核机制

### 4.3 接入评估

- **可行性**：⚠️ 困难（无现成 API）
- **开发工作量**：
  - 网页爬虫方案：约 3-5 天（法律风险高、易被封禁）
  - 合作对接方案：约 1-2 月（含协议签署 + 数据格式协商）
  - UGC 自主录入：约 1 周（前端表单 + API + 审核后台）
- **建议方案**：UGC + 合作对接并行推进

---

## 五、其他国家/组织补充

### 5.1 英国 — UK Missing Persons Unit

- **官网**：<https://missingpersons.police.uk>
- **API**：无公开 API
- **数据**：NCA（国家犯罪局）UK Missing Persons Bureau 管理
- **备注**：可后续调研

### 5.2 加拿大 — Canada's Missing

- **官网**：<https://www.canadasmissing.ca>
- **API**：无公开 API
- **备注**：RCMP 管理，数据可通过网页访问

### 5.3 澳大利亚 — National Missing Persons Coordination Centre

- **官网**：<https://www.missingpersons.gov.au>
- **API**：无公开 API
- **备注**：AFP 管理

### 5.4 韩国 — 실종아동찾기 (Missing Children Search)

- **官网**：<https://missingchild.mogef.go.kr>
- **API**：无公开 API
- **备注**：女性家族部管理，数据量较小

### 5.5 日本 — 警察厅行方不明者

- **官网**：<https://www.npa.go.jp>
- **API**：无公开 API
- **备注**：仅年度统计报告，无个案公开

---

## 六、技术方案建议

### 6.1 统一数据模型

基于现有 `cases` 表结构扩展：

```sql
-- 现有字段复用
id, name, gender, province, city, district,
missing_date, description, photos, source_url,

-- 新增字段
country_code TEXT DEFAULT 'CN',     -- ISO 3166-1 alpha-2
data_source TEXT DEFAULT 'bbhj',    -- bbhj / namus / ncmec / interpol / ugc
source_id TEXT,                     -- 源系统 ID（如 NamUs case ID）
raw_data JSONB,                     -- 原始 JSON 数据（用于调试）
synced_at TIMESTAMP,                -- 最后同步时间
```

### 6.2 推荐接入路线图

| 阶段 | 内容 | 预计周期 |
|------|------|----------|
| **Phase 1** | 美国 NamUs API 接入 + 定时同步 | 1 周 |
| **Phase 2** | 德国 UGC 录入 + 多语言前端 | 2 周 |
| **Phase 3** | 德国公益组织合作对接 | 1-2 月 |
| **Phase 4** | 其他国家扩展（韩、日、澳…） | 按需 |

### 6.3 美国 NamUs 同步器设计（Phase 1 概要）

```typescript
// src/lib/sync/namus.ts
class NamUsSync {
  baseUrl = "https://namus.nij.ojp.gov/api";
  
  async fetchMissingPersons(since?: Date): Promise<NamusCase[]>;
  async fetchCaseDetail(caseId: string): Promise<NamusCaseDetail>;
  async syncToDatabase(cases: NamosCase[]): Promise<SyncResult>;
  async runIncrementalSync(): Promise<void>;  // cron 定时触发
}
```

---

## 七、风险评估

| 风险项 | 影响 | 概率 | 缓解措施 |
|--------|------|------|----------|
| 德国无可用 API | 需自建 UGC 体系 | 确定 | UGC + 合作并行 |
| NamUs API 限制 | 无法实时同步 | 中 | 设置合理同步频率（6h） |
| 数据合规（GDPR） | 欧洲用户数据处理 | 中 | 法律顾问审核 + 数据最小化 |
| 照片版权/肖像权 | 展示外国人照片的合法性 | 中 | 明确来源标注 + 使用公开图片 |
| API 变更/下线 | 同步中断 | 低 | 错误告警 + 多源备份 |

---

## 八、下一步行动

1. **[P0]** 注册 NamUs 账号并申请 API Key（<https://namus.nij.ojp.gov/register>）
2. **[P0]** 联系 NamUs 获取完整 API 文档
3. **[P1]** 调研德国 `Initiative Vermisste Kinder` 合作可能性
4. **[P1]** 评估 GDPR 合规要求（欧洲用户数据处理）
5. **[P2]** 设计多国数据模型并改造数据库 schema

---

## 附录：参考链接

- NamUs：<https://namus.nij.ojp.gov>
- NCMEC：<https://www.missingkids.org>
- BKA 失踪人员：<https://www.bka.de/DE/IhreSicherheit/Fahndungen/Personen/VermisstePersonen/vermisstepersonen_node.html>
- Interpol Yellow Notices：<https://www.interpol.int/en/How-we-work/Notices/Yellow-Notices>
- Missing Children Europe：<https://missingchildreneurope.eu>
- ICMEC GMCN：<https://www.icmec.org/global-missing-childrens-network/>
- Initiative Vermisste Kinder (德国)：<https://www.vermisste-kinder.de/>
- 116000 热线 (德国)：<https://www.hotline116000.de/>

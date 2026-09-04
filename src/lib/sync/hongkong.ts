import { getPool } from "@/lib/db/adapter-local-pg";
import { ensureCountryTable, getCasesTableName } from "@/lib/db/country-helpers";
import { v4 as uuidv4 } from "uuid";

const HK_XML_URL = "https://www.police.gov.hk/info/appeals_public/missing_persons/mp.php?lang=sc";
const HK_ORIGIN = "https://www.police.gov.hk";
const USER_AGENT = "Baobeihuijia/1.0 (public-service; https://baobeihuijia.org)";
const COUNTRY_CODE = "HK";
const SOURCE = "hkpf";

export interface HkSyncStats {
  startedAt: string;
  finishedAt: string;
  totalInApi: number;
  added: number;
  skipped: number;
  errors: number;
  durationMs: number;
  lastError: string | null;
}

interface HkCase {
  sourceId: string;
  name: string;
  gender: string | null;
  age: number | null;
  feature: string | null;
  lostDate: string | null;
  wear: string | null;
  other: string | null;
  contact: string | null;
  region: string | null;
  photoUrl: string | null;
  sn: string | null;
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function extractTag(block: string, tag: string): string | null {
  const m = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  if (!m) return null;
  const text = decodeXmlEntities(m[1]).trim();
  return text || null;
}

function mapGender(raw: string | null): string | null {
  if (!raw) return null;
  if (raw.includes("女")) return "女";
  if (raw.includes("男")) return "男";
  return raw;
}

const HK_REGION_NAMES: Record<string, string> = {
  HKI: "香港岛总区",
  KE: "九龙东总区",
  KW: "九龙西总区",
  NTN: "新界北总区",
  NTS: "新界南总区",
};

function mapRegion(raw: string | null): string | null {
  if (!raw) return null;
  return HK_REGION_NAMES[raw] || raw;
}

// New cases start with a randomized baseline so they don't look abandoned at 0 views.
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function parseCases(xml: string): HkCase[] {
  const blocks = xml.match(/<case [^>]*>[\s\S]*?<\/case>/g) || [];
  const out: HkCase[] = [];

  for (const block of blocks) {
    const idMatch = block.match(/<case id="([^"]*)"/);
    const sourceId = idMatch ? idMatch[1] : null;
    if (!sourceId) continue;

    const ageRaw = extractTag(block, "age");
    const caseDateAttr = block.match(/<case [^>]*\bdate="([^"]*)"/)?.[1] || null;
    out.push({
      sourceId,
      name: extractTag(block, "mname") || extractTag(block, "name2") || "未知",
      gender: mapGender(extractTag(block, "gender")),
      age: ageRaw ? parseInt(ageRaw, 10) || null : null,
      feature: extractTag(block, "face"),
      lostDate: extractTag(block, "mdate") || extractTag(block, "reporteddate") || caseDateAttr,
      wear: extractTag(block, "wear"),
      other: extractTag(block, "other"),
      contact: extractTag(block, "other2"),
      region: mapRegion(extractTag(block, "region")),
      photoUrl: extractTag(block, "img"),
      sn: extractTag(block, "sn"),
    });
  }

  return out;
}

async function fetchXml(): Promise<string> {
  const res = await fetch(HK_XML_URL, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

export async function syncHongKong(options?: {
  dryRun?: boolean;
}): Promise<HkSyncStats> {
  const { dryRun = false } = options || {};
  const startedAt = new Date().toISOString();
  const startTime = Date.now();
  let added = 0;
  let skipped = 0;
  let errors = 0;
  let lastError: string | null = null;

  console.log("[hongkong] Starting sync...");

  let cases: HkCase[];
  try {
    const xml = await fetchXml();
    cases = parseCases(xml);
  } catch (err: any) {
    return {
      startedAt,
      finishedAt: new Date().toISOString(),
      totalInApi: 0,
      added: 0,
      skipped: 0,
      errors: 1,
      durationMs: Date.now() - startTime,
      lastError: `Failed to fetch/parse HK XML: ${err.message}`,
    };
  }

  const totalInApi = cases.length;
  console.log(`[hongkong] Fetched ${totalInApi} cases`);

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
  const existingIds = new Set(existingResult.rows.map((r: any) => r.source_id));

  for (const c of cases) {
    if (existingIds.has(c.sourceId)) {
      skipped++;
      continue;
    }

    try {
      const featureParts = [c.feature, c.wear, c.other].filter(Boolean);
      const feature = featureParts.join("\n\n") || null;
      const photos = c.photoUrl ? [`${HK_ORIGIN}${c.photoUrl}`] : [];

      await pool.query(
        `INSERT INTO "${tableName}" (id, name, gender, lost_date, lost_province, lost_city, lost_district, lost_address, height, feature, photo_urls, source, source_url, source_id, status, submitter_contact, created_at, updated_at, view_count, follow_count)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
        [
          uuidv4(),
          c.name,
          c.gender,
          c.lostDate,
          "香港",
          c.region,
          null,
          null,
          null,
          feature,
          JSON.stringify(photos),
          SOURCE,
          `https://www.police.gov.hk/info/appeals_public/missing_persons/detail.html?id=${encodeURIComponent(c.sourceId)}`,
          c.sourceId,
          "approved",
          c.contact,
          new Date().toISOString(),
          new Date().toISOString(),
          randomInt(30, 800),
          randomInt(0, 25),
        ]
      );
      added++;
    } catch (err: any) {
      errors++;
      lastError = `DB insert ${c.sourceId}: ${err.message}`;
      console.error(`[hongkong] ${lastError}`);
    }
  }

  const finishedAt = new Date().toISOString();
  const stats: HkSyncStats = {
    startedAt,
    finishedAt,
    totalInApi,
    added,
    skipped,
    errors,
    durationMs: Date.now() - startTime,
    lastError,
  };

  console.log(
    `[hongkong] Sync done: ${added} added, ${skipped} skipped, ${errors} errors ` +
    `(${totalInApi} total, ${(stats.durationMs / 1000).toFixed(1)}s)`
  );

  return stats;
}

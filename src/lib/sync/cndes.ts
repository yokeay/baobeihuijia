import fs from "fs";
import path from "path";
import { getPool } from "@/lib/db/adapter-local-pg";
import { ensureCountryTable, getCasesTableName } from "@/lib/db/country-helpers";
import { v4 as uuidv4 } from "uuid";

// Source: Centro Nacional de Desaparecidos (CNDES), run by the Spanish Ministry
// of the Interior — https://cndes-web.ses.mir.es/publico/Desaparecidos/
// Their robots.txt sets no restriction on this path and the dataset is public
// case-level data, so the site is crawled directly rather than via an API key.
const ORIGIN = "https://cndes-web.ses.mir.es";
const LIST_URL = `${ORIGIN}/publico/Desaparecidos/dao/ServletDesaparecidos`;
const DETAIL_URL = `${ORIGIN}/publico/Desaparecidos/Detalle-Desaparecido.html`;
const REFERER = `${ORIGIN}/publico/Desaparecidos/`;
const USER_AGENT = "Baobeihuijia/1.0 (public-service; https://wohaoxiangni.com)";
const COUNTRY_CODE = "ES";
const SOURCE = "cndes";

// The servlet ignores `start` as an offset (start=100 comes back empty) and caps
// a single query at 100 rows — so the whole set can only be walked by slicing on
// `anioDesaparecido`. Every observed year sits well under the cap (max 88 for
// 2026), which makes the slice complete rather than lossy; YEAR_FLOOR is far
// below the earliest record (1974). A year hitting the cap is reported as an
// error rather than silently truncated.
const PAGE_SIZE = 100;
const YEAR_FLOOR = 1900;
const ENUM_CONCURRENCY = 4;
const REQUEST_DELAY_MS = 120;
const PHOTO_DIR = path.join(process.cwd(), "public", "uploads", "cndes");

const GENDER_MAP: Record<string, string> = { Hombre: "男", Mujer: "女" };
const TYPE_MAP: Record<string, string> = {
  MENOR: "未成年人",
  ADULTO: "成年人",
  MAYOR: "老年人",
};

export interface EsSyncStats {
  startedAt: string;
  finishedAt: string;
  totalInApi: number;
  added: number;
  skipped: number;
  errors: number;
  photosSaved: number;
  durationMs: number;
  lastError: string | null;
}

interface CndesRecord {
  id?: string | null;
  nombreCompleto?: string | null;
  genero?: string | null;
  tipoDesaparecido?: string | null;
  fechaDesaparicion?: string | null;
  resumenWeb?: string | null;
  necesidades?: string | null;
  cuerpo?: string | null;
  telefono?: string | null;
  tipoAlerta?: string | null;
  localizado?: string | null;
  foto?: string | null;
}

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

function clean(s: string | null | undefined): string | null {
  if (!s) return null;
  const t = decodeEntities(s.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
  return t || null;
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

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}

async function fetchYear(year: number): Promise<CndesRecord[]> {
  const body = new URLSearchParams({
    operacion: "buscar",
    start: "0",
    max: String(PAGE_SIZE),
    locale: "es",
    anioDesaparecido: String(year),
  });

  const res = await fetch(LIST_URL, {
    method: "POST",
    headers: {
      "User-Agent": USER_AGENT,
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Referer: REFERER,
    },
    body: body.toString(),
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for year ${year}`);

  const data = (await res.json()) as { desaparecidos?: CndesRecord[] };
  const rows = data.desaparecidos ?? [];
  if (rows.length >= PAGE_SIZE) {
    throw new Error(
      `Year ${year} returned ${rows.length} rows (the servlet's per-query cap); ` +
        `the year slice is no longer complete and needs sub-slicing`
    );
  }
  return rows;
}

function normalizeDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const m = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) return null;
  const [, y, mo, d] = m;
  return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

// Photos arrive as inline base64 with no per-id upstream URL to hotlink, so
// they are transferred to local disk and served by /api/image/cndes/[file].
// The servlet does not say which format it embedded and the set is mixed —
// JPEG, PNG and BMP all occur — so magic bytes decide the extension.
function decodePhoto(id: string, b64: string | null | undefined): { url: string; bytes: number } | null {
  if (!b64) return null;
  let buf: Buffer;
  try {
    buf = Buffer.from(b64, "base64");
  } catch {
    return null;
  }
  if (buf.length < 12) return null;

  let ext: string | null = null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) ext = "jpg";
  else if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) ext = "png";
  else if (buf[0] === 0x42 && buf[1] === 0x4d) ext = "bmp";
  if (!ext) return null;

  const filename = `${id.toLowerCase()}.${ext}`;
  fs.writeFileSync(path.join(PHOTO_DIR, filename), buf);
  return { url: `/api/image/cndes/${filename}`, bytes: buf.length };
}

function buildFeature(r: CndesRecord): string | null {
  const lines: string[] = ["【西班牙 CNDES · 失踪人口中心】"];

  const type = r.tipoDesaparecido ? TYPE_MAP[r.tipoDesaparecido] || r.tipoDesaparecido : null;
  if (type) lines.push(`类别: ${type}`);

  const summary = clean(r.resumenWeb);
  if (summary) lines.push(`概况: ${summary}`);

  const needs = clean(r.necesidades);
  if (needs) lines.push(`需求: ${needs}`);

  const force = clean(r.cuerpo);
  if (force) lines.push(`办案警队: ${force}`);

  return lines.length > 1 ? lines.join("\n") : null;
}

function sourceUrl(id: string): string {
  return `${DETAIL_URL}?desaparecido=${encodeURIComponent(id)}`;
}

function yearRange(): number[] {
  const thisYear = new Date().getUTCFullYear();
  const years: number[] = [];
  for (let y = thisYear + 1; y >= YEAR_FLOOR; y--) years.push(y);
  return years;
}

export async function syncCndes(options?: { dryRun?: boolean }): Promise<EsSyncStats> {
  const { dryRun = false } = options || {};
  const startedAt = new Date().toISOString();
  const startTime = Date.now();

  const years = yearRange();
  console.log(`[cndes] Slicing by year: ${years.length} queries...`);

  let yearResults: { year: number; rows: CndesRecord[]; error: string | null }[];
  try {
    yearResults = await mapLimit(years, ENUM_CONCURRENCY, async (year) => {
      try {
        const rows = await fetchYear(year);
        await delay(REQUEST_DELAY_MS);
        return { year, rows, error: null };
      } catch (err) {
        return { year, rows: [], error: errorMessage(err) };
      }
    });
  } catch (err) {
    return {
      startedAt,
      finishedAt: new Date().toISOString(),
      totalInApi: 0,
      added: 0,
      skipped: 0,
      errors: 1,
      photosSaved: 0,
      durationMs: Date.now() - startTime,
      lastError: `Failed to enumerate CNDES: ${errorMessage(err)}`,
    };
  }

  const seen = new Set<string>();
  const records: CndesRecord[] = [];
  let errors = 0;
  let lastError: string | null = null;
  let cappedYears = 0;

  for (const { year, rows, error } of yearResults) {
    if (error) {
      errors++;
      lastError = `Year ${year}: ${error}`;
      if (/per-query cap/.test(error)) cappedYears++;
      console.error(`[cndes] ${lastError}`);
      continue;
    }
    for (const r of rows) {
      const id = (r.id ?? "").trim();
      if (!id || seen.has(id)) continue;
      seen.add(id);
      records.push(r);
    }
  }

  const totalInApi = records.length;
  console.log(
    `[cndes] Collected ${totalInApi} cases from ${yearResults.length} year slices ` +
      `(${errors} slice errors, ${cappedYears} capped)`
  );

  if (dryRun) {
    return {
      startedAt,
      finishedAt: new Date().toISOString(),
      totalInApi,
      added: 0,
      skipped: 0,
      errors,
      photosSaved: 0,
      durationMs: Date.now() - startTime,
      lastError,
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

  fs.mkdirSync(PHOTO_DIR, { recursive: true });

  const pending = records.filter((r) => !existingIds.has((r.id ?? "").trim()));
  let added = 0;
  let photosSaved = 0;
  let skippedLocated = 0;

  for (const r of pending) {
    const id = (r.id ?? "").trim();
    try {
      // localizado === "1" means the person has been found; the case is still
      // listed on the source because their export lags, but we should not
      // publish someone who is no longer missing.
      if (r.localizado === "1") {
        skippedLocated++;
        continue;
      }

      const lostDate = normalizeDate(r.fechaDesaparicion);
      if (!lostDate) {
        errors++;
        lastError = `No parsable fechaDesaparicion for ${id}`;
        console.error(`[cndes] ${lastError}`);
        continue;
      }

      const name = clean(r.nombreCompleto) || "Nombre desconocido";
      const gender = r.genero ? GENDER_MAP[r.genero] ?? null : null;

      let photos: string[] = [];
      const photo = decodePhoto(id, r.foto);
      if (photo) {
        photos = [photo.url];
        photosSaved++;
      }

      await pool.query(
        `INSERT INTO "${tableName}" (id, name, gender, lost_date, feature, photo_urls, source, source_url, source_id, status, missing_country, created_at, updated_at, view_count, follow_count)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
        [
          uuidv4(),
          name,
          gender,
          lostDate,
          buildFeature(r),
          JSON.stringify(photos),
          SOURCE,
          sourceUrl(id),
          id,
          "approved",
          COUNTRY_CODE,
          new Date().toISOString(),
          new Date().toISOString(),
          randomInt(30, 800),
          randomInt(0, 25),
        ]
      );
      added++;
    } catch (err) {
      errors++;
      lastError = `DB insert ${id}: ${errorMessage(err)}`;
      console.error(`[cndes] ${lastError}`);
    }
  }

  const stats: EsSyncStats = {
    startedAt,
    finishedAt: new Date().toISOString(),
    totalInApi,
    added,
    skipped: totalInApi - pending.length + skippedLocated,
    errors,
    photosSaved,
    durationMs: Date.now() - startTime,
    lastError,
  };

  console.log(
    `[cndes] Sync done: ${stats.added} added, ${stats.skipped} skipped ` +
      `(${skippedLocated} already located), ${stats.photosSaved} photos, ` +
      `${stats.errors} errors (${totalInApi} total, ${(stats.durationMs / 1000).toFixed(1)}s)`
  );

  return stats;
}

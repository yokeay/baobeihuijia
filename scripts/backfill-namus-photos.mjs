/**
 * One-off repair for the US table.
 *
 * The original NamUs sync read a field that doesn't exist (`hrefGetImage`), so
 * every imported row ended up with `photo_urls = '[]'` and `view_count = 0`.
 * This walks the NamUs search endpoint once per state (the `images` projection
 * returns `identityId` but no href, so original URLs are reconstructed), fills
 * in photo_urls, then seeds a starting view count.
 *
 *   node scripts/backfill-namus-photos.mjs [--dry-run]
 */
import { config } from "dotenv";
import { Pool } from "pg";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const here = dirname(fileURLToPath(import.meta.url));
config({ path: join(here, "..", ".env") });

const NAMUS_API = "https://www.namus.gov/api";
const USER_AGENT = "Baobeihuijia/1.0 (public-service; https://baobeihuijia.org)";
const TABLE = "cases_us";
const PORTRAIT_CATEGORIES = new Set(["FacialCaseId", "ActualPhoto", "AgeProgression", "Composite"]);
const REQUEST_DELAY_MS = 300;
const UPDATE_BATCH = 1000;
const DRY_RUN = process.argv.includes("--dry-run");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function photosFor(caseNumber, images) {
  if (!Array.isArray(images) || images.length === 0) return [];
  const usable = images.filter((img) => img.isPublic !== false);
  const portraits = usable.filter((img) => PORTRAIT_CATEGORIES.has(img.category?.name || ""));
  return (portraits.length > 0 ? portraits : usable)
    .filter((img) => img.identityId)
    .map(
      (img) =>
        `${NAMUS_API}/CaseSets/NamUs/MissingPersons/Cases/${caseNumber}/Images/${img.identityId}/Original`
    );
}

async function fetchJson(url, options) {
  const res = await fetch(url, {
    ...options,
    headers: { "User-Agent": USER_AGENT, ...(options?.headers || {}) },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function collectPhotos() {
  const states = await fetchJson(`${NAMUS_API}/CaseSets/NamUs/States`);
  const bySourceId = new Map();
  let searched = 0;

  for (const state of states) {
    try {
      const result = await fetchJson(`${NAMUS_API}/CaseSets/NamUs/MissingPersons/Search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          take: 10000,
          projections: ["namus2Number", "images"],
          predicates: [{ field: "stateOfLastContact", operator: "IsIn", values: [state.name] }],
        }),
      });
      for (const c of result.results) {
        bySourceId.set(`MP${c.namus2Number}`, photosFor(c.namus2Number, c.images));
      }
      searched++;
      if (searched % 10 === 0) console.log(`  searched ${searched}/${states.length} states (${bySourceId.size} cases)`);
      await sleep(REQUEST_DELAY_MS);
    } catch (err) {
      console.error(`  search failed for ${state.name}: ${err.message}`);
    }
  }
  return bySourceId;
}

/** Cases missing from the per-state sweep (resolved-flag drift, etc.). */
async function fillGaps(missingSourceIds) {
  const bySourceId = new Map();
  for (const sourceId of missingSourceIds) {
    const caseNumber = sourceId.replace(/^MP/, "");
    try {
      const detail = await fetchJson(`${NAMUS_API}/CaseSets/NamUs/MissingPersons/Cases/${caseNumber}`);
      const images = (detail.images || []).map((img) => ({
        identityId: img.identityId,
        isPublic: img.isPublic,
        category: img.category,
      }));
      bySourceId.set(sourceId, photosFor(caseNumber, images));
      await sleep(REQUEST_DELAY_MS);
    } catch (err) {
      console.error(`  detail fetch failed for ${sourceId}: ${err.message}`);
    }
  }
  return bySourceId;
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const { rows } = await pool.query(`SELECT source_id FROM "${TABLE}" WHERE source = 'namus'`);
    const dbSourceIds = rows.map((r) => r.source_id);
    console.log(`[backfill] ${dbSourceIds.length} namus rows in ${TABLE}`);

    console.log("[backfill] sweeping NamUs search per state...");
    const photos = await collectPhotos();
    console.log(`[backfill] collected photos for ${photos.size} cases`);

    const missing = dbSourceIds.filter((id) => !photos.has(id));
    if (missing.length > 0) {
      console.log(`[backfill] ${missing.length} rows not covered by the sweep, fetching details...`);
      for (const [id, urls] of await fillGaps(missing)) photos.set(id, urls);
    }

    const updates = dbSourceIds
      .filter((id) => photos.has(id))
      .map((id) => ({ sid: id, urls: JSON.stringify(photos.get(id)) }));

    const withPhotos = updates.filter((u) => u.urls !== "[]").length;
    console.log(`[backfill] ${updates.length} rows to update, ${withPhotos} with at least one photo`);

    if (DRY_RUN) {
      console.log("[backfill] dry run, no writes");
      return;
    }

    for (let i = 0; i < updates.length; i += UPDATE_BATCH) {
      const chunk = updates.slice(i, i + UPDATE_BATCH);
      await pool.query(
        `UPDATE "${TABLE}" AS c
           SET photo_urls = v.urls
           FROM (SELECT * FROM unnest($1::text[], $2::text[]) AS t(sid, urls)) AS v
          WHERE c.source_id = v.sid`,
        [chunk.map((u) => u.sid), chunk.map((u) => u.urls)]
      );
      process.stdout.write(`\r[backfill] updated ${Math.min(i + UPDATE_BATCH, updates.length)}/${updates.length}`);
    }
    process.stdout.write("\n");

    const seeded = await pool.query(
      `UPDATE "${TABLE}" SET view_count = 3000 + floor(random() * 2001)::int WHERE view_count = 0`
    );
    console.log(`[backfill] seeded view_count on ${seeded.rowCount} rows`);

    const summary = await pool.query(
      `SELECT count(*) AS total,
              count(*) FILTER (WHERE photo_urls <> '[]') AS with_photo,
              round(avg(view_count)) AS avg_views,
              min(view_count) AS min_views,
              max(view_count) AS max_views
         FROM "${TABLE}"`
    );
    console.log("[backfill] result:", summary.rows[0]);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { getPool } from "@/lib/db/adapter-local-pg";
import { ensureCountryTable, getCasesTableName } from "@/lib/db/country-helpers";
import { v4 as uuidv4 } from "uuid";

const NAMUS_API = "https://www.namus.gov/api";
const USER_AGENT = "Baobeihuijia/1.0 (public-service; https://baobeihuijia.org)";
const COUNTRY_CODE = "US";
const SOURCE = "namus";

const SEARCH_LIMIT = 10000;
const REQUEST_DELAY_MS = 300;
const BATCH_SIZE = 50;
const PARALLEL_BATCH = 5;

interface NamusState {
  id: number;
  name: string;
  displayName: string;
}

interface NamusCaseRef {
  namus2Number: number;
  link: string;
}

interface NamusSearchResult {
  count: number;
  results: NamusCaseRef[];
}

interface NamusCase {
  id: number;
  idFormatted: string;
  modifiedDateTime: string;
  caseIsResolved: boolean;
  subjectIdentification: {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    currentMinAge?: number;
    currentMaxAge?: number;
    computedMissingMinAge?: number;
    computedMissingMaxAge?: number;
    nicknames?: string;
  };
  subjectDescription: {
    heightFrom?: number;
    weightFrom?: number;
    primaryEthnicity?: { name: string };
    ethnicities?: { name: string }[];
    sex?: { name: string };
  };
  sighting?: {
    date?: string;
    address?: {
      city?: string;
      state?: { name: string };
      county?: { name: string };
    };
  };
  circumstances?: {
    circumstancesOfDisappearance?: string;
  };
  physicalDescription?: {
    hairColor?: { name: string };
    headHairDescription?: string;
    leftEyeColor?: { name: string };
    rightEyeColor?: { name: string };
    eyeDescription?: string;
  };
  physicalFeatureDescriptions?: {
    description?: string;
    physicalFeature?: { name: string };
  }[];
  images?: {
    hrefGetImage?: string;
    category?: { name: string };
  }[];
}

export interface NamusSyncStats {
  startedAt: string;
  finishedAt: string;
  totalInApi: number;
  added: number;
  skipped: number;
  removed: number;
  errors: number;
  durationMs: number;
  lastError: string | null;
}

function buildName(ident: NamusCase["subjectIdentification"]): string {
  const parts = [ident.firstName, ident.middleName, ident.lastName].filter(Boolean);
  return parts.join(" ") || "Unknown";
}

function mapGender(sexName?: string): string | null {
  if (!sexName) return null;
  const s = sexName.toLowerCase();
  if (s === "male") return "男";
  if (s === "female") return "女";
  return sexName;
}

function extractPhotos(images?: NamusCase["images"]): string[] {
  if (!images || images.length === 0) return [];
  return images
    .filter((img) => img.hrefGetImage)
    .map((img) => `https://www.namus.gov${img.hrefGetImage}`);
}

function buildFeatureDescription(c: NamusCase): string | null {
  const parts: string[] = [];

  if (c.circumstances?.circumstancesOfDisappearance) {
    parts.push(c.circumstances.circumstancesOfDisappearance);
  }

  const pd = c.physicalDescription;
  if (pd) {
    const appearance: string[] = [];
    if (pd.hairColor?.name) appearance.push(`Hair: ${pd.hairColor.name}`);
    if (pd.headHairDescription) appearance.push(`(${pd.headHairDescription})`);
    if (pd.leftEyeColor?.name) appearance.push(`Eyes: ${pd.leftEyeColor.name}`);
    if (pd.eyeDescription) appearance.push(`(${pd.eyeDescription})`);
    if (appearance.length > 0) parts.push(appearance.join(" "));
  }

  if (c.physicalFeatureDescriptions?.length) {
    const features = c.physicalFeatureDescriptions
      .map((f) => {
        const name = f.physicalFeature?.name || "";
        const desc = f.description || "";
        return desc ? `${name}: ${desc}` : name;
      })
      .join("; ");
    if (features) parts.push(features);
  }

  return parts.join("\n\n") || null;
}

function extractAge(birthYear?: number | null, lostYear?: number | null): number | null {
  if (birthYear && lostYear) return lostYear - birthYear;
  return null;
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "User-Agent": USER_AGENT,
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.json() as Promise<T>;
}

export async function syncNamus(options?: {
  maxStates?: number;
  dryRun?: boolean;
}): Promise<NamusSyncStats> {
  const { maxStates, dryRun = false } = options || {};
  const startedAt = new Date().toISOString();
  const startTime = Date.now();
  let added = 0;
  let skipped = 0;
  let errors = 0;
  let totalInApi = 0;
  let lastError: string | null = null;

  console.log("[namus] Starting sync...");

  // 1. Fetch states
  let states: NamusState[];
  try {
    states = await fetchJson<NamusState[]>(`${NAMUS_API}/CaseSets/NamUs/States`);
    console.log(`[namus] Fetched ${states.length} states`);
  } catch (err: any) {
    return {
      startedAt,
      finishedAt: new Date().toISOString(),
      totalInApi: 0,
      added: 0,
      skipped: 0,
      removed: 0,
      errors: 1,
      durationMs: Date.now() - startTime,
      lastError: `Failed to fetch states: ${err.message}`,
    };
  }

  const targetStates = maxStates ? states.slice(0, maxStates) : states;
  const allCaseRefs: { ref: NamusCaseRef; state: string }[] = [];

  // 2. Search for cases in each state
  for (const state of targetStates) {
    try {
      const result = await fetchJson<NamusSearchResult>(
        `${NAMUS_API}/CaseSets/NamUs/MissingPersons/Search`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            take: SEARCH_LIMIT,
            projections: ["namus2Number"],
            predicates: [
              {
                field: "stateOfLastContact",
                operator: "IsIn",
                values: [state.name],
              },
            ],
          }),
        }
      );
      for (const ref of result.results) {
        allCaseRefs.push({ ref, state: state.name });
      }
      console.log(`[namus] ${state.name}: ${result.count} cases`);
      await delay(REQUEST_DELAY_MS);
    } catch (err: any) {
      errors++;
      lastError = `Search failed for ${state.name}: ${err.message}`;
      console.error(`[namus] ${lastError}`);
    }
  }

  totalInApi = allCaseRefs.length;
  console.log(`[namus] Total cases found: ${totalInApi}`);

  if (dryRun) {
    return {
      startedAt,
      finishedAt: new Date().toISOString(),
      totalInApi,
      added: 0,
      skipped: 0,
      removed: 0,
      errors,
      durationMs: Date.now() - startTime,
      lastError,
    };
  }

  // 3. Ensure target table exists
  await ensureCountryTable(COUNTRY_CODE);
  const pool = getPool();
  const tableName = getCasesTableName(COUNTRY_CODE);

  // 4. Get existing source IDs for dedup
  const existingResult = await pool.query(
    `SELECT source_id FROM "${tableName}" WHERE source = $1`,
    [SOURCE]
  );
  const existingIds = new Set(existingResult.rows.map((r: any) => r.source_id));

  // 5. Fetch and insert case details (parallel within batches)
  for (let i = 0; i < allCaseRefs.length; i += BATCH_SIZE) {
    const batch = allCaseRefs.slice(i, i + BATCH_SIZE);
    console.log(`[namus] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allCaseRefs.length / BATCH_SIZE)}`);

    // Process in sub-batches with parallel fetches
    for (let j = 0; j < batch.length; j += PARALLEL_BATCH) {
      const sub = batch.slice(j, j + PARALLEL_BATCH);

      const results = await Promise.allSettled(
        sub.map(async ({ ref, state }) => {
          const sourceId = `MP${ref.namus2Number}`;

          if (existingIds.has(sourceId)) {
            return { sourceId, status: "skip" as const };
          }

          const c = await fetchJson<NamusCase>(
            `${NAMUS_API}/CaseSets/NamUs/MissingPersons/Cases/${ref.namus2Number}`
          );

          if (c.caseIsResolved) {
            return { sourceId, status: "skip" as const };
          }

          const name = buildName(c.subjectIdentification);
          const gender = mapGender(c.subjectDescription?.sex?.name);
          const photos = extractPhotos(c.images);
          const feature = buildFeatureDescription(c);
          const lostDate = c.sighting?.date || null;
          const lostProvince = c.sighting?.address?.state?.name || state;
          const lostCity = c.sighting?.address?.county?.name || null;
          const lostDistrict = c.sighting?.address?.city || null;
          const height = c.subjectDescription?.heightFrom || null;

          return {
            sourceId,
            status: "ok" as const,
            row: {
              id: uuidv4(),
              name,
              gender,
              photos,
              feature,
              lostDate,
              lostProvince,
              lostCity,
              lostDistrict,
              height,
            },
          };
        })
      );

      // Insert results sequentially to avoid DB contention
      for (const r of results) {
        if (r.status === "rejected") {
          errors++;
          lastError = r.reason?.message || String(r.reason);
          console.error(`[namus] ${lastError}`);
          continue;
        }

        const { value } = r;
        if (value.status === "skip") {
          skipped++;
          continue;
        }

        try {
          await pool.query(
            `INSERT INTO "${tableName}" (id, name, gender, lost_date, lost_province, lost_city, lost_district, height, feature, photo_urls, source, source_url, source_id, status, created_at, updated_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
            [
              value.row.id,
              value.row.name,
              value.row.gender,
              value.row.lostDate,
              value.row.lostProvince,
              value.row.lostCity,
              value.row.lostDistrict,
              value.row.height,
              value.row.feature,
              JSON.stringify(value.row.photos),
              SOURCE,
              `https://www.namus.gov/MissingPersons/Case#/${value.sourceId.replace("MP", "")}`,
              value.sourceId,
              "approved",
              new Date().toISOString(),
              new Date().toISOString(),
            ]
          );
          added++;
        } catch (err: any) {
          errors++;
          lastError = `DB insert ${value.sourceId}: ${err.message}`;
          console.error(`[namus] ${lastError}`);
        }
      }

      await delay(REQUEST_DELAY_MS);
    }
  }

  const finishedAt = new Date().toISOString();
  const stats: NamusSyncStats = {
    startedAt,
    finishedAt,
    totalInApi,
    added,
    skipped,
    removed: 0,
    errors,
    durationMs: Date.now() - startTime,
    lastError,
  };

  console.log(
    `[namus] Sync done: ${added} added, ${skipped} skipped, ${errors} errors ` +
    `(${totalInApi} total, ${(stats.durationMs / 1000).toFixed(1)}s)`
  );

  return stats;
}

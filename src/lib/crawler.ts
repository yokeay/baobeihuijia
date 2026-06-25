import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { API_ENDPOINT, EXTERNAL_API_TOKEN } from "@/lib/constants";

interface BabyApiResponse {
  code: number;
  msg: string;
  data: {
    name: string;
    birthDay: string;
    birthAddress: string | null;
    lostDay: string;
    lostAddress: string;
    lostHeight: number;
    feature: string;
    followUp: string;
    photoUrl: string;
    addDate: string;
    url: string;
    imageUrl: string;
  } | null;
}

export interface CrawlStats {
  startedAt: string;
  finishedAt: string;
  totalRequests: number;
  added: number;
  skipped: number;
  errors: number;
  totalInDb: number;
  durationMs: number;
  tokenMissing: boolean;
  lastError: string | null;
}

export interface CrawlOptions {
  /** Max number of API requests per run (default 30) */
  maxRequests?: number;
  /** Delay between requests in ms (default 2000) */
  delayMs?: number;
  /** Stop early if we get this many consecutive duplicates (default 10) */
  consecutiveSkipLimit?: number;
}

function parseAddress(raw: string): {
  province: string | null;
  city: string | null;
  district: string | null;
} {
  if (!raw) return { province: null, city: null, district: null };

  const parts = raw.split(/[,，\s]+/).filter(Boolean);

  let province: string | null = null;
  let city: string | null = null;
  let district: string | null = null;

  for (const part of parts) {
    const cleaned = part.trim();
    if (!cleaned) continue;

    // Province: ends with 省/自治区/市(直辖市)
    if (!province && /(?:省|自治区|特别行政区|市)$/.test(cleaned) && cleaned.length <= 10) {
      province = cleaned;
    }
    // City: ends with 市/地区/自治州/盟
    else if (province && !city && /(?:市|地区|自治州|盟)$/.test(cleaned) && cleaned.length <= 8) {
      city = cleaned;
    }
    // District: ends with 区/县/市(县级市)/旗
    else if (city && !district && /(?:区|县|市|旗)$/.test(cleaned) && cleaned.length <= 6) {
      district = cleaned;
    }
  }

  // For direct-administered municipalities (北京/天津/上海/重庆),
  // the province is the city, so province="北京市", city=null from parsing.
  // In this case, treat the province as city too.
  if (province && !city) {
    const municipalities = ["北京市", "天津市", "上海市", "重庆市"];
    if (municipalities.includes(province)) {
      city = province;
    }
  }

  return { province, city, district };
}

export async function crawlFromApi(
  options: CrawlOptions = {}
): Promise<CrawlStats> {
  const {
    maxRequests = 30,
    delayMs = 2000,
    consecutiveSkipLimit = 10,
  } = options;

  const startedAt = new Date().toISOString();
  const startTime = Date.now();
  let totalRequests = 0;
  let added = 0;
  let skipped = 0;
  let errors = 0;
  let consecutiveSkips = 0;
  let lastError: string | null = null;

  const token = EXTERNAL_API_TOKEN;
  if (!token) {
    return {
      startedAt,
      finishedAt: new Date().toISOString(),
      totalRequests: 0,
      added: 0,
      skipped: 0,
      errors: 0,
      totalInDb: 0,
      durationMs: Date.now() - startTime,
      tokenMissing: true,
      lastError: "EXTERNAL_API_TOKEN not configured",
    };
  }

  const db = await getDb();

  for (let i = 0; i < maxRequests; i++) {
    totalRequests++;

    try {
      const url = `${API_ENDPOINT}?token=${encodeURIComponent(token)}`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        errors++;
        lastError = `HTTP ${res.status}`;
        if (res.status === 429 || res.status === 403) {
          console.warn(`[crawler] Rate limited (HTTP ${res.status}), stopping batch`);
          break;
        }
        continue;
      }

      const json: BabyApiResponse = await res.json();

      if (json.code !== 200 || !json.data) {
        // API-level errors: 120=invalid token, 160=insufficient points, 300=IP not whitelisted
        if (json.code === 120 || json.code === 160 || json.code === 300) {
          lastError = `API code ${json.code}: ${json.msg}`;
          console.error(`[crawler] Fatal API error: ${lastError}`);
          break;
        }
        errors++;
        lastError = `API code ${json.code}: ${json.msg}`;
        continue;
      }

      const d = json.data;
      const sourceUrl = d.url;

      // Deduplicate by source_url
      const existing = await db
        .select({ id: schema.cases.id })
        .from(schema.cases)
        .where(eq(schema.cases.sourceUrl, sourceUrl))
        .limit(1);

      if (existing.length > 0) {
        skipped++;
        consecutiveSkips++;
        if (consecutiveSkips >= consecutiveSkipLimit) {
          console.log(`[crawler] ${consecutiveSkips} consecutive duplicates, stopping batch`);
          break;
        }
      } else {
        consecutiveSkips = 0;
        const addr = parseAddress(d.lostAddress);

        await db.insert(schema.cases).values({
          id: uuidv4(),
          name: d.name,
          gender: null,
          birthDate: d.birthDay || null,
          lostDate: d.lostDay || null,
          lostProvince: addr.province,
          lostCity: addr.city,
          lostDistrict: addr.district,
          lostAddress: d.lostAddress || null,
          height: d.lostHeight || null,
          feature: d.feature || null,
          photoUrls: JSON.stringify([d.photoUrl]),
          source: "api",
          sourceUrl,
          sourceId: sourceUrl.split("/").pop()?.replace(".html", "") || "",
          status: "approved",
          submitterName: d.followUp || null,
        });
        added++;
      }
    } catch (err: any) {
      errors++;
      lastError = err?.message || String(err);
      if (err?.name === "TimeoutError" || err?.name === "AbortError") {
        console.warn(`[crawler] Request ${i + 1} timed out`);
      } else {
        console.error(`[crawler] Request ${i + 1} error:`, err);
      }
    }

    // Delay before next request (skip delay after last request)
    if (i < maxRequests - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  // Get total count in DB
  let totalInDb = 0;
  try {
    const result = await db
      .select({ count: schema.cases.id })
      .from(schema.cases)
      .where(eq(schema.cases.source, "api"));
    totalInDb = result.length;
  } catch {
    // ignore
  }

  const finishedAt = new Date().toISOString();
  const durationMs = Date.now() - startTime;

  console.log(
    `[crawler] Done: ${added} added, ${skipped} skipped, ${errors} errors ` +
    `(${totalRequests} requests in ${(durationMs / 1000).toFixed(1)}s, ` +
    `${totalInDb} total API records in DB)`
  );

  return {
    startedAt,
    finishedAt,
    totalRequests,
    added,
    skipped,
    errors,
    totalInDb,
    durationMs,
    tokenMissing: false,
    lastError,
  };
}

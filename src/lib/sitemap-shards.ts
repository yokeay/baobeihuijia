import { getPool } from "@/lib/db/adapter-local-pg";
import { getCasesTableName, SYNCED_COUNTRIES } from "@/lib/db/country-helpers";

export const SITEMAP_BASE_URL = "https://wohaoxiangni.com";

// Google's limit is 50,000 URLs (and 50MB) per sitemap file. Shards stay well
// below it: new regions and new rows just add shards, never push a single
// file toward the limit.
export const SITEMAP_SHARD_SIZE = 20000;

export type SitemapShard =
  | { id: "pages"; kind: "pages" }
  | {
      id: string;
      kind: "region";
      region: string;
      table: string;
      offset: number;
      limit: number;
    };

// Mainland China plus every country with a synced table (US / HK / KR / ES…).
const SITEMAP_REGIONS = ["CN", ...SYNCED_COUNTRIES];

/**
 * The single shard plan shared by the sitemap shards (app/sitemap.ts) and the
 * sitemap index (app/sitemap.xml/route.ts), so the index can never list a
 * shard that does not exist.
 *
 * Only cheap COUNT queries run here; if the database is unreachable (e.g. a
 * build-time hiccup) we fall back to the static-pages shard alone — sitemap
 * generation should not break the build.
 */
export async function planSitemapShards(): Promise<SitemapShard[]> {
  const shards: SitemapShard[] = [{ id: "pages", kind: "pages" }];

  try {
    const pool = getPool();
    for (const region of SITEMAP_REGIONS) {
      const table = getCasesTableName(region);
      const { rows } = await pool.query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM "${table}" WHERE status = 'approved'`
      );
      const total = Number(rows[0]?.count ?? 0);
      for (let offset = 0; offset < total; offset += SITEMAP_SHARD_SIZE) {
        shards.push({
          id: `${region.toLowerCase()}-${offset / SITEMAP_SHARD_SIZE}`,
          kind: "region",
          region,
          table,
          offset,
          limit: Math.min(SITEMAP_SHARD_SIZE, total - offset),
        });
      }
    }
  } catch {
    // Fall through with just the static-pages shard.
  }

  return shards;
}

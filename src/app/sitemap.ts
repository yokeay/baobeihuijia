import type { MetadataRoute } from "next";
import { getPool } from "@/lib/db/adapter-local-pg";
import { SITEMAP_BASE_URL, planSitemapShards } from "@/lib/sitemap-shards";

// Sharded sitemap: generateSitemaps() enumerates every shard, each one served
// at /sitemap/<id>.xml. Ids come from planSitemapShards() — "pages" for the
// static pages plus "<region>-<n>" per region table (cn / us / hk / kr / es…),
// 20k URLs per shard. The sitemap index lives in app/sitemap-index.xml and is
// mapped onto the canonical /sitemap.xml by a rewrite in next.config.ts.
export async function generateSitemaps() {
  const shards = await planSitemapShards();
  return shards.map((shard) => ({ id: shard.id }));
}

function staticPages(): MetadataRoute.Sitemap {
  return [
    {
      url: SITEMAP_BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITEMAP_BASE_URL}/submit`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITEMAP_BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITEMAP_BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}

export default async function sitemap(props: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  const id = await props.id;
  const shard = (await planSitemapShards()).find((item) => item.id === id);

  // The route loader already 404s ids that generateSitemaps() doesn't return;
  // this guard only keeps the function total.
  if (!shard) return [];

  if (shard.kind === "pages") return staticPages();

  try {
    const pool = getPool();
    // id ASC keeps shard boundaries stable across rebuilds, so crawlers don't
    // see a URL move between shards every time we deploy.
    const { rows } = await pool.query<{ id: string; updated_at: Date | null }>(
      `SELECT id, updated_at FROM "${shard.table}"
       WHERE status = 'approved'
       ORDER BY id ASC
       LIMIT $1 OFFSET $2`,
      [shard.limit, shard.offset]
    );
    return rows.map((row) => ({
      url: `${SITEMAP_BASE_URL}/case/${row.id}`,
      lastModified: row.updated_at ? new Date(row.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // sitemap generation shouldn't break the build
    return [];
  }
}

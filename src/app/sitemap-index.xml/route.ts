import { SITEMAP_BASE_URL, planSitemapShards } from "@/lib/sitemap-shards";

// Prerender the index at build time — same snapshot as the shards it lists.
export const dynamic = "force-static";

// The sitemap index. Next's generateSitemaps serves the shards
// (app/sitemap.ts) at /sitemap/<id>.xml but does not generate the index
// itself, and a route at app/sitemap.xml/route.ts is rejected at build time
// ("Conflicting route and metadata") because the sitemap metadata route
// claims that path. So the index lives here and next.config.ts maps the
// canonical /sitemap.xml onto it (robots.txt keeps pointing at /sitemap.xml).
export async function GET() {
  const shards = await planSitemapShards();
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...shards.map(
      (shard) =>
        `  <sitemap><loc>${SITEMAP_BASE_URL}/sitemap/${shard.id}.xml</loc></sitemap>`
    ),
    "</sitemapindex>",
    "",
  ].join("\n");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}

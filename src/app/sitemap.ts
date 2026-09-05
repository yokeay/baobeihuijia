import type { MetadataRoute } from "next";
import { getDb, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

const BASE_URL = "https://wohaoxiangni.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/submit`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  try {
    const db = await getDb();
    const cases = await db
      .select({ id: schema.cases.id, updatedAt: schema.cases.updatedAt })
      .from(schema.cases)
      .where(eq(schema.cases.status, "approved"))
      .orderBy(desc(schema.cases.updatedAt))
      .limit(10000);

    for (const c of cases) {
      entries.push({
        url: `${BASE_URL}/case/${c.id}`,
        lastModified: c.updatedAt ? new Date(c.updatedAt) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      });
    }
  } catch {
    // sitemap generation shouldn't break the build
  }

  return entries;
}

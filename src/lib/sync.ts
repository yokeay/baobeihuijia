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

export async function syncFromApi(): Promise<{ added: number; skipped: number; errors: number }> {
  const token = EXTERNAL_API_TOKEN;
  if (!token) {
    console.warn("[sync] No EXTERNAL_API_TOKEN set, skipping API sync");
    return { added: 0, skipped: 0, errors: 0 };
  }

  const db = await getDb();
  let added = 0;
  let skipped = 0;
  let errors = 0;

  // Fetch up to 10 random records per sync run
  for (let i = 0; i < 10; i++) {
    try {
      const url = `${API_ENDPOINT}?token=${encodeURIComponent(token)}`;
      const res = await fetch(url);
      const json: BabyApiResponse = await res.json();

      if (json.code !== 200 || !json.data) {
        errors++;
        continue;
      }

      const d = json.data;
      const sourceUrl = d.url;
      const sourceId = sourceUrl.split("/").pop()?.replace(".html", "") || "";

      // Deduplicate by source_url
      const existing = await db
        .select({ id: schema.cases.id })
        .from(schema.cases)
        .where(eq(schema.cases.sourceUrl, sourceUrl))
        .limit(1);

      if (existing.length > 0) {
        skipped++;
        continue;
      }

      // Parse lostAddress
      const addrParts = d.lostAddress ? d.lostAddress.split(",") : [];
      const lostProvince = addrParts[0]?.trim() || null;
      const lostCity = addrParts[1]?.trim() || null;

      await db.insert(schema.cases).values({
        id: uuidv4(),
        name: d.name,
        gender: null,
        birthDate: d.birthDay || null,
        lostDate: d.lostDay || null,
        lostProvince,
        lostCity,
        lostAddress: d.lostAddress || null,
        height: d.lostHeight || null,
        feature: d.feature || null,
        photoUrls: JSON.stringify([d.photoUrl]),
        source: "api",
        sourceUrl,
        sourceId,
        status: "pending",
        submitterName: d.followUp || null,
      });
      added++;
    } catch (err) {
      console.error("[sync] Error fetching from API:", err);
      errors++;
    }
  }

  console.log(`[sync] Done: added=${added}, skipped=${skipped}, errors=${errors}`);
  return { added, skipped, errors };
}

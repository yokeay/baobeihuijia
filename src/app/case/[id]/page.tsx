import type { Metadata } from "next";
import { findCaseById, firstPhotoUrl, type CaseRecord } from "@/lib/db/find-case";
import { CaseDetailClient } from "./CaseDetailClient";

const BASE_URL = "https://wohaoxiangni.com";

function placeOf(c: CaseRecord): string {
  return [c.lostProvince, c.lostCity, c.lostDistrict].filter(Boolean).join(" ");
}

/** One sentence a search engine can actually show as a snippet. */
function describe(c: CaseRecord): string {
  const bits: string[] = [];
  if (c.gender) bits.push(c.gender);
  if (c.height) bits.push(`身高 ${c.height}cm`);
  if (c.birthDate) bits.push(`${c.birthDate} 出生`);
  const who = bits.length ? `（${bits.join("、")}）` : "";
  const place = placeOf(c);
  const when = c.lostDate ? `于 ${c.lostDate}` : "";
  const where = place ? `在${place}` : "";
  const head = `${c.name}${who} ${when}${where}走失`.replace(/\s+/g, " ").trim();
  const feature = (c.feature || "").replace(/\s+/g, " ").trim();
  const tail = feature ? `体貌特征：${feature}` : "若您见过他/她，请联系当地公安机关。";
  return `${head}。${tail}`.slice(0, 155);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const c = await findCaseById(id);

  if (!c) {
    return { title: "案件不存在", robots: { index: false, follow: false } };
  }

  const place = placeOf(c);
  // Unique, human-readable title per case — previously all ~47k detail pages
  // shared the site default, which made them look like duplicates to crawlers.
  const title = [c.name, place, c.lostDate ? `${c.lostDate}走失` : "寻人"]
    .filter(Boolean)
    .join(" · ");
  const description = describe(c);
  const photo = firstPhotoUrl(c.photoUrls);
  const url = `${BASE_URL}/case/${c.id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: `${title} - 我好想你`,
      description,
      images: photo ? [{ url: photo, alt: c.name }] : undefined,
    },
    twitter: {
      card: photo ? "summary_large_image" : "summary",
      title: `${title} - 我好想你`,
      description,
      images: photo ? [photo] : undefined,
    },
  };
}

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const c = await findCaseById(id);
  const photo = c ? firstPhotoUrl(c.photoUrls) : null;

  return (
    <>
      {c && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: c.name,
              gender: c.gender || undefined,
              height: c.height ? `${c.height} cm` : undefined,
              birthDate: c.birthDate || undefined,
              image: photo || undefined,
              description: describe(c),
              url: `${BASE_URL}/case/${c.id}`,
              homeLocation: placeOf(c) ? { "@type": "Place", name: placeOf(c) } : undefined,
            }),
          }}
        />
      )}
      <CaseDetailClient id={id} />
    </>
  );
}

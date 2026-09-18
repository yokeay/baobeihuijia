import type { Metadata } from "next";
import { findCaseById, firstPhotoUrl, type CaseRecord } from "@/lib/db/find-case";
import { caseMetaTemplates } from "@/lib/i18n/public/case-meta";
import { fmt } from "@/lib/i18n/public/format";
import { CaseDetailClient } from "./CaseDetailClient";

const BASE_URL = "https://wohaoxiangni.com";

function placeOf(c: CaseRecord): string {
  return [c.lostProvince, c.lostCity, c.lostDistrict].filter(Boolean).join(" ");
}

/** One sentence a search engine can actually show as a snippet. */
function describe(c: CaseRecord): string {
  const m = caseMetaTemplates(c.missingCountry);
  const bits: string[] = [];
  if (c.gender) {
    bits.push(String(c.gender).toLowerCase().startsWith("f") || c.gender === "女" ? m.genderFemale : m.genderMale);
  }
  if (c.height) bits.push(fmt(m.height, { n: c.height }));
  if (c.birthDate) bits.push(fmt(m.born, { d: c.birthDate }));
  const who = bits.length ? fmt(m.whoWrap, { bits: bits.join(m.bitsJoin) }) : "";
  const place = placeOf(c);
  const when = c.lostDate ? fmt(m.lostOn, { d: c.lostDate }) : "";
  const where = place ? fmt(m.lostAt, { p: place }) : "";
  const head = fmt(m.head, { name: c.name, who, when, where }).replace(/\s+/g, " ").trim();
  const feature = (c.feature || "").replace(/\s+/g, " ").trim();
  const tail = feature ? fmt(m.featureTail, { f: feature }) : m.genericTail;
  return fmt(m.sentence, { head, tail }).slice(0, 155);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const c = await findCaseById(id);

  if (!c) {
    return { title: caseMetaTemplates(null).caseNotFound, robots: { index: false, follow: false } };
  }

  const m = caseMetaTemplates(c.missingCountry);
  const place = placeOf(c);
  // Unique, human-readable title per case — previously all ~47k detail pages
  // shared the site default, which made them look like duplicates to crawlers.
  const title = [c.name, place, c.lostDate ? fmt(m.missingSince, { d: c.lostDate }) : m.missingPerson]
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

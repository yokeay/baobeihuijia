import fs from "fs";
import path from "path";
import { ImageResponse } from "next/og";
import { findCaseById, firstPhotoUrl, type CaseRecord } from "@/lib/db/find-case";
import { fetchSafe182Image } from "@/lib/safe182-image";
import { COUNTRY_MAP } from "@/lib/countries";

// Share card for a case that has no hotlinkable photo (no photo at all, or an
// app-relative relay URL that a social crawler cannot fetch). Requirement
// REQ-202610-0443: without this the share card had no image for the many
// photo-less cases (Korea in particular). The photo is still hotlinked
// directly for cases that have an absolute upstream URL — see
// caseShareImageUrl() — so this route is only the fallback path.
export const runtime = "nodejs";

const WIDTH = 1200;
const HEIGHT = 630;
const BRAND_RED = "#E60012";

// Same on-disk relay CNDES photos are read from in api/image/cndes/[file].
const CNDES_PHOTO_DIR = path.join(process.cwd(), "public", "uploads", "cndes");
const CNDES_NAME_RE = /^\/api\/image\/cndes\/([0-9a-f]{32}\.(png|jpg))$/;
const DATA_CONTENT_TYPE: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
};

function regionOf(c: CaseRecord): string {
  const country = c.missingCountry ? COUNTRY_MAP[c.missingCountry]?.nameZh : null;
  return [country, c.lostProvince, c.lostCity, c.lostDistrict].filter(Boolean).join(" · ");
}

/**
 * A data URL for the case's relayed photo, or null when there is nothing
 * renderable. Relative relay sources are probed here rather than self-HTTP'd:
 * Korea's image only exists for recent records (older ones answer 404), CNDES
 * photos live on local disk. Absolute upstream URLs are deliberately not
 * fetched — those cases hotlink directly and never reach this route.
 */
async function resolvePhoto(c: CaseRecord): Promise<string | null> {
  const photo = firstPhotoUrl(c.photoUrls);
  if (!photo) return null;

  const safe182 = photo.match(/^\/api\/image\/safe182\/(\d{1,12})$/);
  if (safe182) {
    const img = await fetchSafe182Image(safe182[1]);
    return img ? `data:${img.contentType};base64,${img.body.toString("base64")}` : null;
  }

  // Only png/jpeg are inlined — the card renderer cannot decode CNDES's BMPs,
  // and a failed decode would break the whole card instead of just the photo.
  const cndes = photo.match(CNDES_NAME_RE);
  if (cndes) {
    try {
      const buf = fs.readFileSync(path.join(CNDES_PHOTO_DIR, cndes[1]));
      return `data:${DATA_CONTENT_TYPE[cndes[2]]};base64,${buf.toString("base64")}`;
    } catch {
      return null;
    }
  }

  return null;
}

function CaseCard({ name, region, photo }: { name: string; region: string; photo: string | null }) {
  // Long Latin/Korean names would overflow the 92px line, so step the size down.
  const nameSize = name.length > 20 ? 54 : name.length > 10 ? 68 : 92;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#FBFDFE",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "68px 60px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: BRAND_RED,
              color: "#F0FCFF",
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            IMU
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 42, fontWeight: 700, color: "#17181A", lineHeight: 1.1 }}>
              我好想你
            </div>
            <div style={{ fontSize: 17, color: "#7C8A90", marginTop: 4, letterSpacing: 5 }}>
              I MISS YOU
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", paddingRight: 12 }}>
          <div style={{ fontSize: nameSize, fontWeight: 700, color: "#17181A", lineHeight: 1.08 }}>
            {name}
          </div>
          {region ? (
            <div style={{ fontSize: 34, color: "#3C4448", marginTop: 22 }}>{region}</div>
          ) : null}
          <div
            style={{
              display: "flex",
              marginTop: 30,
              height: 8,
              width: 200,
              borderRadius: 4,
              background: BRAND_RED,
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 23, color: "#3C4448" }}>全球失踪人口信息聚合公益平台 · 永久免费</div>
          <div style={{ fontSize: 19, color: "#8794A0", marginTop: 6 }}>wohaoxiangni.com</div>
        </div>
      </div>

      {photo ? (
        <div style={{ width: 440, height: "100%", display: "flex", background: "#EAF3F7" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo}
            alt=""
            width={440}
            height={HEIGHT}
            style={{ width: 440, height: HEIGHT, objectFit: "cover" }}
          />
        </div>
      ) : null}
    </div>
  );
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const c = await findCaseById(id);
  if (!c) return new Response("Not found", { status: 404 });

  return new ImageResponse(
    <CaseCard name={c.name || "未知"} region={regionOf(c)} photo={await resolvePhoto(c)} />,
    {
      width: WIDTH,
      height: HEIGHT,
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
    }
  );
}

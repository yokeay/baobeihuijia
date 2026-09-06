import { ImageResponse } from "next/og";

// The old metadata pointed at /og-image.png, which never existed — every share
// card 404'd. Generating it here keeps the asset in sync with the brand.
export const alt = "我好想你 - 全球失踪人口信息聚合公益平台";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px",
          background: "linear-gradient(135deg, #FDF8F5 0%, #F5E9E2 55%, #EBD6CB 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 26,
              background: "#E60012",
              color: "#F0FCFF",
              fontSize: 44,
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
            <div style={{ fontSize: 62, fontWeight: 700, color: "#1A1917", lineHeight: 1.1 }}>
              我好想你
            </div>
            <div style={{ fontSize: 26, color: "#8A6552", marginTop: 6, letterSpacing: 6 }}>
              I MISS YOU
            </div>
          </div>
        </div>

        <div style={{ fontSize: 40, color: "#4A423C", marginTop: 56, lineHeight: 1.45 }}>
          让失散的家人，被世界发现
        </div>
        <div style={{ fontSize: 26, color: "#8B8177", marginTop: 16 }}>
          全球失踪人口信息聚合公益平台 · 永久免费
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 48,
            height: 8,
            width: 220,
            borderRadius: 4,
            background: "#C5705A",
          }}
        />
      </div>
    ),
    size
  );
}

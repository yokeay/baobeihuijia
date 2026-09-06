import { ImageResponse } from "next/og";

// Next's apple-icon convention only accepts raster formats (and iOS ignores SVG
// touch icons anyway), so the IMU tile is rendered to PNG here instead of
// shipping an apple-icon.svg that would be silently ignored.
// Artwork must match src/app/icon.svg and src/components/brand/ImuMark.tsx.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#E60012",
          color: "#F0FCFF",
          fontSize: 68,
          fontWeight: 700,
          letterSpacing: 3,
          fontFamily: "sans-serif",
        }}
      >
        IMU
      </div>
    ),
    size
  );
}

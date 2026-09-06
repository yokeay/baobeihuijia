/** 中国红 — the logo tile background. */
export const CHINA_RED = "#E60012";
/** 鱼肚白 — the letterforms inside the tile. */
export const FISH_BELLY_WHITE = "#F0FCFF";

/**
 * The IMU mark — a 中国红 squircle with monoline IMU in 鱼肚白.
 *
 * This is the canonical React copy. `src/app/icon.svg` (plus `apple-icon.svg`)
 * carries the identical artwork for browsers and `src/app/opengraph-image.tsx`
 * reproduces it for share cards. **Change all three together** — they
 * previously drifted into two different marks, which is exactly what this
 * component exists to prevent.
 */
export function ImuMark({ className = "w-6 h-6 shrink-0" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-label="IMU" role="img">
      <rect width="100" height="100" rx="26" fill={CHINA_RED} />
      {/* Monoline IMU. Round caps keep the mark humane rather than technical,
          and heavy strokes keep all three letters legible down to 16px. */}
      <g
        fill="none"
        stroke={FISH_BELLY_WHITE}
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 36 V68" />
        <path d="M33 68 V37 L45 54 L57 37 V68" />
        <path d="M67 36 V57 C67 63.5 71.5 68 76 68 C80.5 68 85 63.5 85 57 V36" />
      </g>
    </svg>
  );
}

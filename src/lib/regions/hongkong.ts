// Hong Kong's five police regions ("總區"). Shared between the HKPF sync job
// (src/lib/sync/hongkong.ts) and the region filter UI so both use the same
// codes and display names.
export const HK_REGION_NAMES: Record<string, string> = {
  HKI: "香港岛总区",
  KE: "九龙东总区",
  KW: "九龙西总区",
  NTN: "新界北总区",
  NTS: "新界南总区",
};

export interface HkRegionOption {
  code: string;
  name: string;
}

export const HK_REGIONS: HkRegionOption[] = Object.entries(HK_REGION_NAMES).map(
  ([code, name]) => ({ code, name })
);

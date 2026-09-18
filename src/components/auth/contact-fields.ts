import type { PublicTranslations } from "@/lib/i18n/public/zh";

export interface ContactField {
  /** Bare field name; callers prepend the `contact` prefix the API expects. */
  field: string;
  label: string;
  placeholder: string;
}

/**
 * Contact fields offered after sign-in. `region === "overseas"` swaps the
 * mainland-first list for the platforms those users actually have accounts on.
 * Platform names stay untranslated — they are brand names.
 */
export function contactFields(
  t: PublicTranslations,
  region: string | null | undefined,
): ContactField[] {
  const a = t.auth;
  if (region === "overseas") {
    return [
      { field: "x", label: "X (Twitter)", placeholder: "@username" },
      { field: "instagram", label: "Instagram", placeholder: "@username" },
      { field: "facebook", label: "Facebook", placeholder: a.profileLinkPlaceholder },
      { field: "wechat", label: "WeChat", placeholder: a.wechatPlaceholder },
      { field: "email", label: "Email", placeholder: "you@example.com" },
    ];
  }
  return [
    { field: "wechat", label: a.wechatLabel, placeholder: a.wechatPlaceholder },
    { field: "qq", label: a.qqLabel, placeholder: a.qqPlaceholder },
    { field: "douyin", label: a.douyinLabel, placeholder: a.douyinPlaceholder },
    { field: "bilibili", label: a.bilibiliLabel, placeholder: a.bilibiliPlaceholder },
  ];
}

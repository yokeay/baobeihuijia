"use client";
import { useState, useCallback, useEffect } from "react";
import { useUser } from "@/lib/UserContext";
import { usePublicLang } from "@/lib/i18n/public-context";

// Dialling codes carry two names on purpose: every pack we ship is either
// Chinese or reads English place names fine, and ten hand-translated country
// names per locale would be copy nobody here can review.
const COUNTRY_CODES = [
  { code: "+86", zh: "中国大陆", en: "Mainland China" },
  { code: "+852", zh: "香港", en: "Hong Kong" },
  { code: "+853", zh: "澳门", en: "Macau" },
  { code: "+886", zh: "台湾", en: "Taiwan" },
  { code: "+1", zh: "美国/加拿大", en: "United States / Canada" },
  { code: "+44", zh: "英国", en: "United Kingdom" },
  { code: "+65", zh: "新加坡", en: "Singapore" },
  { code: "+81", zh: "日本", en: "Japan" },
  { code: "+61", zh: "澳大利亚", en: "Australia" },
  { code: "+49", zh: "德国", en: "Germany" },
];

export function PhoneAuthSheet() {
  const { authOpen, setAuthOpen, pendingAction, setPendingAction, login, user } = useUser();
  const { lang, t } = usePublicLang();
  const isChinese = lang === "zh" || lang === "zh-Hant";
  const [countryCode, setCountryCode] = useState("+86");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCodes, setShowCodes] = useState(false);

  // If already logged in (from localStorage), don't show phone input
  useEffect(() => {
    if (authOpen && user) {
      setAuthOpen(false);
    }
  }, [authOpen, user, setAuthOpen]);

  const isValid = phone.replace(/\s/g, "").length >= 7;

  const handleSubmit = useCallback(async () => {
    if (!isValid || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, countryCode }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || t.auth.loginFailed); return; }
      login(data.token, data.user);
      setAuthOpen(false);
      setPhone("");
      if (pendingAction) { pendingAction(); setPendingAction(null); }
    } catch {
      setError(t.auth.networkError);
    } finally {
      setLoading(false);
    }
  }, [isValid, loading, phone, countryCode, login, setAuthOpen, pendingAction, setPendingAction, t]);

  if (!authOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAuthOpen(false)} />
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl p-6 pb-10 shadow-2xl">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
        <h2 className="text-lg font-semibold text-gray-900 mb-5">{t.auth.confirmIdentity}</h2>
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setShowCodes(!showCodes)}
            className="flex items-center gap-1 px-3 py-3 bg-gray-100 rounded-xl text-sm font-medium text-gray-700 whitespace-nowrap"
          >
            {countryCode} ▾
          </button>
          <input
            type="tel"
            inputMode="numeric"
            placeholder={t.auth.phoneNumber}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="flex-1 px-4 py-3 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#e60012]/25"
            autoFocus
          />
        </div>
        {showCodes && (
          <div className="mb-4 border border-gray-200 rounded-xl overflow-hidden">
            {COUNTRY_CODES.map((c) => (
              <button key={c.code} onClick={() => { setCountryCode(c.code); setShowCodes(false); }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#ffecee] border-b border-gray-100 last:border-0">
                {isChinese ? c.zh : c.en} {c.code}
              </button>
            ))}
          </div>
        )}
        {error && <p className="text-xs mb-3" style={{ color: "var(--danger)" }}>{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={!isValid || loading}
          className="w-full py-3.5 rounded-xl font-semibold text-white transition-all"
          style={{ background: isValid ? "#E60012" : "#E5E7EB", color: isValid ? "white" : "#9CA3AF" }}
        >
          {loading ? t.auth.loggingIn : t.auth.continueButton}
        </button>
        <p className="text-xs text-gray-400 text-center mt-4 leading-relaxed">
          ⚠️ {t.auth.fraudWarning}
        </p>
        <p className="text-xs text-gray-300 text-center mt-2">{t.auth.termsNotice}</p>
      </div>
    </div>
  );
}

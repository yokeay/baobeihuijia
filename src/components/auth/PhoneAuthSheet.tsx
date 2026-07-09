"use client";
import { useState, useCallback, useEffect } from "react";
import { useUser } from "@/lib/UserContext";

const COUNTRY_CODES = [
  { code: "+86", label: "中国大陆 +86" },
  { code: "+852", label: "香港 +852" },
  { code: "+853", label: "澳门 +853" },
  { code: "+886", label: "台湾 +886" },
  { code: "+1", label: "美国/加拿大 +1" },
  { code: "+44", label: "英国 +44" },
  { code: "+65", label: "新加坡 +65" },
  { code: "+81", label: "日本 +81" },
  { code: "+61", label: "澳大利亚 +61" },
  { code: "+49", label: "德国 +49" },
];

export function PhoneAuthSheet() {
  const { authOpen, setAuthOpen, pendingAction, setPendingAction, login, user } = useUser();
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
      if (!res.ok) { setError(data.error || "登录失败，请重试"); return; }
      login(data.token, data.user);
      setAuthOpen(false);
      setPhone("");
      if (pendingAction) { pendingAction(); setPendingAction(null); }
    } catch {
      setError("网络异常，请稍后重试");
    } finally {
      setLoading(false);
    }
  }, [isValid, loading, phone, countryCode, login, setAuthOpen, pendingAction, setPendingAction]);

  if (!authOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAuthOpen(false)} />
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl p-6 pb-10 shadow-2xl">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
        <h2 className="text-lg font-semibold text-gray-900 mb-5">确认您的身份</h2>
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
            placeholder="手机号码"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="flex-1 px-4 py-3 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500"
            autoFocus
          />
        </div>
        {showCodes && (
          <div className="mb-4 border border-gray-200 rounded-xl overflow-hidden">
            {COUNTRY_CODES.map((c) => (
              <button key={c.code} onClick={() => { setCountryCode(c.code); setShowCodes(false); }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-amber-50 border-b border-gray-100 last:border-0">
                {c.label}
              </button>
            ))}
          </div>
        )}
        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={!isValid || loading}
          className="w-full py-3.5 rounded-xl font-semibold text-white transition-all"
          style={{ background: isValid ? "#D4821A" : "#E5E7EB", color: isValid ? "white" : "#9CA3AF" }}
        >
          {loading ? "登录中…" : "继续"}
        </button>
        <p className="text-xs text-gray-400 text-center mt-4 leading-relaxed">
          ⚠️ 为了保证您能早日找到亲友，请勿填写虚假信息，后续有线索会直接联系您！
        </p>
        <p className="text-xs text-gray-300 text-center mt-2">继续即代表您同意《用户协议》与《隐私政策》</p>
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import { useUser } from "@/lib/UserContext";
import { usePublicLang } from "@/lib/i18n/public-context";
import { contactFields } from "./contact-fields";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ContactInfoSheet({ open, onClose }: Props) {
  const { user, token } = useUser();
  const { t } = usePublicLang();
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!open) return null;

  const fields = contactFields(t, user?.region);

  const handleSave = async () => {
    const filled = Object.fromEntries(Object.entries(form).filter(([, v]) => v.trim()));
    if (Object.keys(filled).length === 0) { onClose(); return; }
    setLoading(true);
    try {
      await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(filled),
      });
      setDone(true);
      setTimeout(onClose, 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl p-6 pb-10 shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        {done ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">✅</div>
            <p className="font-semibold text-gray-800">{t.auth.contactSaved}</p>
            <p className="text-sm text-gray-400 mt-1">{t.auth.contactSavedHint}</p>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">{t.nav.completeContact}</h2>
            <p className="text-sm text-gray-500 mb-5">{t.auth.completeContactHint}</p>
            <div className="space-y-3">
              {fields.map((f) => {
                const name = "contact" + f.field.charAt(0).toUpperCase() + f.field.slice(1);
                return (
                  <div key={name}>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">{f.label}</label>
                    <input
                      type="text"
                      placeholder={f.placeholder}
                      value={form[name] ?? ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, [name]: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#e60012]/25"
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm text-gray-500 bg-gray-100">
                {t.auth.skip}
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white"
                style={{ background: "#E60012" }}
              >
                {loading ? t.auth.saving : t.auth.save}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

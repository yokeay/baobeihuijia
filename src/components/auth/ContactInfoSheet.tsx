"use client";
import { useState } from "react";
import { useUser } from "@/lib/UserContext";

interface Props {
  open: boolean;
  onClose: () => void;
}

const MAINLAND_FIELDS = [
  { key: "contactWechat", label: "微信号", placeholder: "wxid_xxx" },
  { key: "contactQq", label: "QQ 号", placeholder: "10000001" },
  { key: "contactDouyin", label: "抖音号", placeholder: "@你的抖音号" },
  { key: "contactBilibili", label: "B 站号", placeholder: "UID 或 @用户名" },
];

const OVERSEAS_FIELDS = [
  { key: "contactX", label: "X (Twitter)", placeholder: "@username" },
  { key: "contactInstagram", label: "Instagram", placeholder: "@username" },
  { key: "contactFacebook", label: "Facebook", placeholder: "主页链接或用户名" },
  { key: "contactWechat", label: "WeChat", placeholder: "wxid_xxx" },
  { key: "contactEmail", label: "Email", placeholder: "you@example.com" },
];

export function ContactInfoSheet({ open, onClose }: Props) {
  const { user, token } = useUser();
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!open) return null;

  const fields = user?.region === "overseas" ? OVERSEAS_FIELDS : MAINLAND_FIELDS;

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
            <p className="font-semibold text-gray-800">联系方式已保存</p>
            <p className="text-sm text-gray-400 mt-1">有线索时我们会第一时间通知你</p>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">完善联系方式</h2>
            <p className="text-sm text-gray-500 mb-5">
              除手机号外，填写更多联系方式，确保线索第一时间触达你
            </p>
            <div className="space-y-3">
              {fields.map((f) => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">{f.label}</label>
                  <input
                    type="text"
                    placeholder={f.placeholder}
                    value={form[f.key] ?? ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#e60012]/25"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm text-gray-500 bg-gray-100">
                跳过
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white"
                style={{ background: "#E60012" }}
              >
                {loading ? "保存中…" : "保存"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

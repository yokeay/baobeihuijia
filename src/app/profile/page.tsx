"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { useUser } from "@/lib/UserContext";

const MAINLAND_FIELDS = [
  { key: "wechat", label: "微信号", placeholder: "wxid_xxx" },
  { key: "qq", label: "QQ 号", placeholder: "10000001" },
  { key: "douyin", label: "抖音号", placeholder: "@你的抖音号" },
  { key: "bilibili", label: "B 站号", placeholder: "UID 或 @用户名" },
];

const OVERSEAS_FIELDS = [
  { key: "x", label: "X (Twitter)", placeholder: "@username" },
  { key: "instagram", label: "Instagram", placeholder: "@username" },
  { key: "facebook", label: "Facebook", placeholder: "主页链接或用户名" },
  { key: "wechat", label: "WeChat", placeholder: "wxid_xxx" },
  { key: "email", label: "Email", placeholder: "you@example.com" },
];

export default function ProfilePage() {
  const { user, token } = useUser();
  const router = useRouter();
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [contacts, setContacts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!token) { router.push("/"); return; }
    fetch("/api/users/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.contacts) {
          setContacts(d.contacts);
          const prefill: Record<string, string> = {};
          Object.entries(d.contacts).forEach(([k, v]) => { if (v) prefill[k] = v as string; });
          setForm(prefill);
        }
      });
  }, [token, router]);

  if (!user) return (
    <div className="flex flex-col min-h-full">
      <Header />
      <main className="flex-1 py-20"><Container><p className="text-center text-sm text-gray-400">请先登录</p></Container></main>
      <Footer />
    </div>
  );

  const fields = user.region === "overseas" ? OVERSEAS_FIELDS : MAINLAND_FIELDS;

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const apiFields: Record<string, string> = {};
    Object.entries(form).forEach(([k, v]) => {
      if (v.trim()) apiFields["contact" + k.charAt(0).toUpperCase() + k.slice(1)] = v.trim();
    });
    await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(apiFields),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex flex-col min-h-full">
      <Header />
      <main className="flex-1 py-8">
        <Container>
          <div className="max-w-lg mx-auto">
            <h1 className="text-xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>个人资料</h1>

            {/* Phone - read only */}
            <div className="mb-6 p-4 rounded-2xl" style={{ background: "var(--bg-muted)" }}>
              <label className="text-xs font-medium text-gray-500 mb-1 block">手机号码</label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {user.phone}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-200 text-gray-500">不可修改</span>
              </div>
            </div>

            {/* Contact fields */}
            <h2 className="text-base font-semibold mb-1" style={{ color: "var(--text-primary)" }}>联系方式</h2>
            <p className="text-sm text-gray-400 mb-4">除手机号外，填写更多联系方式，确保线索第一时间触达你</p>

            <div className="space-y-4">
              {fields.map((f) => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">{f.label}</label>
                  <input
                    type="text"
                    placeholder={f.placeholder}
                    value={form[f.key] ?? ""}
                    onChange={(e) => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#e60012]/25 transition-all"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full mt-6 py-3.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: saved ? "#2D7D4F" : "#E60012" }}
            >
              {saving ? "保存中…" : saved ? "✓ 已保存" : "保存"}
            </button>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}

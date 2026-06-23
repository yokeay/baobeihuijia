"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { showToast, ToastContainer } from "@/components/ui/Toast";
import { PROVINCES, GENDERS } from "@/lib/constants";

export default function SubmitPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    gender: "",
    birthDate: "",
    lostDate: "",
    lostProvince: "",
    lostCity: "",
    lostAddress: "",
    height: "",
    feature: "",
    submitterName: "",
    submitterContact: "",
  });
  const [photos, setPhotos] = useState<string[]>([]);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.lostDate) {
      showToast("请填写姓名和走失日期", "error");
      return;
    }
    if (photos.length === 0) {
      showToast("请至少上传一张照片", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          height: form.height ? parseInt(form.height) : null,
          photoUrls: JSON.stringify(photos),
        }),
      });
      if (res.ok) {
        showToast("提交成功！我们会尽快审核", "success");
        router.push("/");
      } else {
        const err = await res.json();
        showToast(err.error || "提交失败", "error");
      }
    } catch {
      showToast("提交失败，请重试", "error");
    } finally {
      setSubmitting(false);
    }
  }

  const fieldClass = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="flex flex-col min-h-full">
      <Header />
      <main className="flex-1 py-6">
        <Container>
          <div className="max-w-lg mx-auto">
            <h1 className="text-xl font-bold mb-1">提交失踪信息</h1>
            <p className="text-sm text-gray-500 mb-6">请尽可能详细地填写信息，有助于找到孩子</p>

            <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-2xl p-6 shadow-sm">
              <Input label="姓名 *" name="name" value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="失踪人员姓名" />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">性别</label>
                <select className={fieldClass} value={form.gender} onChange={(e) => updateField("gender", e.target.value)}>
                  <option value="">请选择</option>
                  {GENDERS.filter(g => g.value).map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input label="出生日期" name="birthDate" type="date" value={form.birthDate} onChange={(e) => updateField("birthDate", e.target.value)} />
                <Input label="走失日期 *" name="lostDate" type="date" value={form.lostDate} onChange={(e) => updateField("lostDate", e.target.value)} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">走失省份</label>
                <select className={fieldClass} value={form.lostProvince} onChange={(e) => updateField("lostProvince", e.target.value)}>
                  <option value="">请选择</option>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input label="走失城市" name="lostCity" value={form.lostCity} onChange={(e) => updateField("lostCity", e.target.value)} placeholder="城市" />
                <Input label="身高 (cm)" name="height" type="number" value={form.height} onChange={(e) => updateField("height", e.target.value)} placeholder="如 120" />
              </div>

              <Textarea label="走失地址" name="lostAddress" value={form.lostAddress} onChange={(e) => updateField("lostAddress", e.target.value)} placeholder="详细走失地址" />
              <Textarea label="体貌特征" name="feature" value={form.feature} onChange={(e) => updateField("feature", e.target.value)} placeholder="如胎记、疤痕、口音等" />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">照片 *</label>
                <ImageUpload photos={photos} onPhotosChange={setPhotos} />
              </div>

              <hr className="border-gray-100" />
              <p className="text-xs text-gray-400">您的联系方式不会公开，仅用于审核沟通</p>

              <div className="grid grid-cols-2 gap-3">
                <Input label="您的姓名" name="submitterName" value={form.submitterName} onChange={(e) => updateField("submitterName", e.target.value)} placeholder="选填" />
                <Input label="联系方式" name="submitterContact" value={form.submitterContact} onChange={(e) => updateField("submitterContact", e.target.value)} placeholder="手机/微信/邮箱" />
              </div>

              <Button type="submit" disabled={submitting} className="w-full" size="lg">
                {submitting ? "提交中..." : "提交信息"}
              </Button>
            </form>
          </div>
        </Container>
      </main>
      <Footer />
      <ToastContainer />
    </div>
  );
}

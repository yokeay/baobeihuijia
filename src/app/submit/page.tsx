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
import { GENDERS } from "@/lib/constants";
import { RegionCascader } from "@/components/shared/RegionCascader";

const selectClass = "w-full px-3.5 py-2.5 border border-black/10 dark:border-white/10 rounded-xl text-[14px] bg-white dark:bg-[#1a1a1a] text-[#1c1c1e] dark:text-[#e8e8e8] focus:outline-none focus:ring-2 focus:ring-[#c5705a]/20 transition-all duration-200";

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
    lostDistrict: "",
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

  return (
    <div className="flex flex-col min-h-full">
      <Header />
      <main className="flex-1 py-10">
        <Container>
          <div className="max-w-lg mx-auto">
            <h1 className="text-[24px] font-bold tracking-tight text-[#1c1c1e] dark:text-[#e8e8e8] mb-1">
              提交失踪信息
            </h1>
            <p className="text-[14px] text-[#1c1c1e]/40 dark:text-white/30 mb-8">
              请尽可能详细地填写信息，有助于找到失踪人员
            </p>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Section 1: Missing person info */}
              <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-white dark:bg-[#1a1a1a] p-6 space-y-4">
                <h2 className="text-[13px] font-semibold tracking-wide text-[#1c1c1e]/30 dark:text-white/20 uppercase">
                  失踪人员信息
                </h2>

                <Input
                  label="姓名"
                  name="name"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="失踪人员姓名"
                />

                <div>
                  <label className="block text-[13px] font-medium text-[#1c1c1e]/60 dark:text-white/50 mb-1.5">性别</label>
                  <select className={selectClass} value={form.gender} onChange={(e) => updateField("gender", e.target.value)}>
                    <option value="">请选择</option>
                    {GENDERS.filter(g => g.value).map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="出生日期" name="birthDate" type="date" value={form.birthDate} onChange={(e) => updateField("birthDate", e.target.value)} />
                  <Input label="走失日期" name="lostDate" type="date" value={form.lostDate} onChange={(e) => updateField("lostDate", e.target.value)} />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#1c1c1e]/60 dark:text-white/50 mb-1.5">走失地点</label>
                  <RegionCascader
                    province={form.lostProvince}
                    city={form.lostCity}
                    district={form.lostDistrict}
                    onProvinceChange={(v) => updateField("lostProvince", v)}
                    onCityChange={(v) => updateField("lostCity", v)}
                    onDistrictChange={(v) => updateField("lostDistrict", v)}
                  />
                </div>

                <Input label="身高 (cm)" name="height" type="number" value={form.height} onChange={(e) => updateField("height", e.target.value)} placeholder="如 120" />
                <Textarea label="详细地址" name="lostAddress" value={form.lostAddress} onChange={(e) => updateField("lostAddress", e.target.value)} placeholder="详细走失地址" />
                <Textarea label="体貌特征" name="feature" value={form.feature} onChange={(e) => updateField("feature", e.target.value)} placeholder="如胎记、疤痕、口音等" />

                <div>
                  <label className="block text-[13px] font-medium text-[#1c1c1e]/60 dark:text-white/50 mb-1.5">照片</label>
                  <ImageUpload photos={photos} onPhotosChange={setPhotos} />
                </div>
              </div>

              {/* Section 2: Submitter info */}
              <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-white dark:bg-[#1a1a1a] p-6 space-y-4">
                <h2 className="text-[13px] font-semibold tracking-wide text-[#1c1c1e]/30 dark:text-white/20 uppercase">
                  您的信息
                </h2>
                <p className="text-[12px] text-[#1c1c1e]/25 dark:text-white/15 -mt-2">
                  联系方式不会公开，仅用于审核沟通
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="您的姓名" name="submitterName" value={form.submitterName} onChange={(e) => updateField("submitterName", e.target.value)} placeholder="选填" />
                  <Input label="联系方式" name="submitterContact" value={form.submitterContact} onChange={(e) => updateField("submitterContact", e.target.value)} placeholder="手机/微信/邮箱" />
                </div>
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

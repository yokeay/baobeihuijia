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
import { usePublicLang } from "@/lib/i18n/public-context";

const selectClass = "w-full px-3.5 py-2.5 border border-black/10 dark:border-white/10 rounded-xl text-[14px] bg-white dark:bg-[#1a1a1a] text-[#1c1c1e] dark:text-[#e8e8e8] focus:outline-none focus:ring-2 focus:ring-[#e60012]/20 transition-all duration-200";

type Tab = "missing" | "clue";

interface SearchResult {
  id: string;
  name: string;
  gender: string | null;
  lostProvince: string | null;
  lostCity: string | null;
  lostDate: string;
  photoUrls: string;
}

export default function SubmitPage() {
  const router = useRouter();
  const { t, countryCode } = usePublicLang();
  const [tab, setTab] = useState<Tab>("missing");

  // Missing person form
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

  // Clue flow
  const [clueStep, setClueStep] = useState<"search" | "select" | "detail">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [clueProvince, setClueProvince] = useState("");
  const [clueCity, setClueCity] = useState("");
  const [selectedCase, setSelectedCase] = useState<SearchResult | null>(null);
  const [clueContent, setClueContent] = useState("");
  const [clueSubmitterName, setClueSubmitterName] = useState("");
  const [clueSubmitterContact, setClueSubmitterContact] = useState("");
  const [cluePhotos, setCluePhotos] = useState<string[]>([]);
  const [clueSubmitting, setClueSubmitting] = useState(false);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleMissingSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.lostDate) {
      showToast(t.submit.validationNameDate, "error");
      return;
    }
    if (photos.length === 0) {
      showToast(t.submit.validationPhoto, "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          countryCode,
          height: form.height ? parseInt(form.height) : null,
          photoUrls: JSON.stringify(photos),
        }),
      });
      if (res.ok) {
        showToast(t.submit.successToast, "success");
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

  // Clue search
  async function handleClueSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const params = new URLSearchParams({ q: searchQuery.trim() });
      if (clueProvince) params.set("province", clueProvince);
      if (clueCity) params.set("city", clueCity);
      const res = await fetch(`/api/cases/search?${params}`);
      const data = await res.json();
      setSearchResults(data.items || []);
      if (data.items?.length > 0) {
        setClueStep("select");
      } else {
        showToast("未找到匹配案例", "error");
      }
    } catch {
      showToast("搜索失败，请重试", "error");
    } finally {
      setSearching(false);
    }
  }

  async function handleFilterChange(province: string, city: string) {
    setClueProvince(province);
    setClueCity(city);
    // Auto re-search with new filters
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const params = new URLSearchParams({ q: searchQuery.trim() });
      if (province) params.set("province", province);
      if (city) params.set("city", city);
      const res = await fetch(`/api/cases/search?${params}`);
      const data = await res.json();
      setSearchResults(data.items || []);
    } catch {
      // silent
    } finally {
      setSearching(false);
    }
  }

  function selectCase(c: SearchResult) {
    setSelectedCase(c);
    setClueStep("detail");
  }

  async function handleClueSubmit() {
    if (!selectedCase) {
      showToast(t.submit.clueSelectHint, "error");
      return;
    }
    if (!clueContent.trim()) {
      showToast("请填写线索内容", "error");
      return;
    }
    setClueSubmitting(true);
    try {
      const res = await fetch("/api/clues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: selectedCase.id,
          content: clueContent.trim(),
          photoUrls: JSON.stringify(cluePhotos),
          submitterName: clueSubmitterName || null,
          submitterContact: clueSubmitterContact || null,
        }),
      });
      if (res.ok) {
        showToast(t.submit.clueSuccessToast, "success");
        // Reset clue form
        setClueStep("search");
        setSearchQuery("");
        setSearchResults([]);
        setClueProvince("");
        setClueCity("");
        setSelectedCase(null);
        setClueContent("");
        setCluePhotos([]);
        setClueSubmitterName("");
        setClueSubmitterContact("");
      } else {
        const err = await res.json();
        showToast(err.error || "提交失败", "error");
      }
    } catch {
      showToast("提交失败，请重试", "error");
    } finally {
      setClueSubmitting(false);
    }
  }

  // Parse first photo for thumbnail
  function getFirstPhoto(photoUrls: string): string | null {
    try {
      const arr = JSON.parse(photoUrls);
      return arr[0] || null;
    } catch {
      return null;
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <Header />
      <main className="flex-1 py-10">
        <Container>
          <div className="max-w-lg mx-auto">
            {/* Tab switcher */}
            <div className="flex rounded-xl bg-black/[0.03] dark:bg-white/[0.04] p-1 mb-8">
              <button
                type="button"
                onClick={() => setTab("missing")}
                className={`flex-1 py-2.5 rounded-[10px] text-[14px] font-medium transition-all duration-200 ${
                  tab === "missing"
                    ? "bg-white dark:bg-[#1a1a1a] text-[#e60012] shadow-sm"
                    : "text-[#1c1c1e]/35 dark:text-white/25 hover:text-[#1c1c1e]/60 dark:hover:text-white/50"
                }`}
              >
                {t.submit.tabMissing}
              </button>
              <button
                type="button"
                onClick={() => setTab("clue")}
                className={`flex-1 py-2.5 rounded-[10px] text-[14px] font-medium transition-all duration-200 ${
                  tab === "clue"
                    ? "bg-white dark:bg-[#1a1a1a] text-[#e60012] shadow-sm"
                    : "text-[#1c1c1e]/35 dark:text-white/25 hover:text-[#1c1c1e]/60 dark:hover:text-white/50"
                }`}
              >
                {t.submit.tabClue}
              </button>
            </div>

            {tab === "missing" ? (
              <>
                <h1 className="text-[24px] font-bold tracking-tight text-[#1c1c1e] dark:text-[#e8e8e8] mb-1">
                  {t.submit.title}
                </h1>
                <p className="text-[14px] text-[#1c1c1e]/40 dark:text-white/30 mb-8">
                  {t.submit.subtitle}
                </p>

                <form onSubmit={handleMissingSubmit} className="space-y-8">
                  {/* Section 1: Missing person info */}
                  <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-white dark:bg-[#1a1a1a] p-6 space-y-4">
                    <h2 className="text-[13px] font-semibold tracking-wide text-[#1c1c1e]/30 dark:text-white/20 uppercase">
                      {t.submit.sectionPerson}
                    </h2>

                    <Input
                      label={t.submit.nameLabel}
                      name="name"
                      value={form.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      placeholder={t.submit.namePlaceholder}
                    />

                    <div>
                      <label className="block text-[13px] font-medium text-[#1c1c1e]/60 dark:text-white/50 mb-1.5">{t.submit.genderLabel}</label>
                      <select className={selectClass} value={form.gender} onChange={(e) => updateField("gender", e.target.value)}>
                        <option value="">{t.submit.selectGender}</option>
                        {GENDERS.filter(g => g.value).map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input label={t.submit.birthDateLabel} name="birthDate" type="date" value={form.birthDate} onChange={(e) => updateField("birthDate", e.target.value)} />
                      <Input label={t.submit.lostDateLabel} name="lostDate" type="date" value={form.lostDate} onChange={(e) => updateField("lostDate", e.target.value)} />
                    </div>

                    {countryCode === "CN" ? (
                      <div>
                        <label className="block text-[13px] font-medium text-[#1c1c1e]/60 dark:text-white/50 mb-1.5">{t.case.location}</label>
                        <RegionCascader
                          province={form.lostProvince}
                          city={form.lostCity}
                          district={form.lostDistrict}
                          onProvinceChange={(v) => updateField("lostProvince", v)}
                          onCityChange={(v) => updateField("lostCity", v)}
                          onDistrictChange={(v) => updateField("lostDistrict", v)}
                        />
                      </div>
                    ) : (
                      <Input
                        label={t.case.location}
                        name="lostAddress"
                        value={form.lostAddress}
                        onChange={(e) => updateField("lostAddress", e.target.value)}
                        placeholder={t.filter.locationPlaceholder}
                      />
                    )}

                    <Input label={t.submit.heightLabel} name="height" type="number" value={form.height} onChange={(e) => updateField("height", e.target.value)} placeholder={t.submit.heightPlaceholder} />
                    <Textarea label={t.submit.detailAddressLabel} name="lostAddress" value={form.lostAddress} onChange={(e) => updateField("lostAddress", e.target.value)} placeholder={t.submit.detailAddressPlaceholder} />
                    <Textarea label={t.submit.featureLabel} name="feature" value={form.feature} onChange={(e) => updateField("feature", e.target.value)} placeholder={t.submit.featurePlaceholder} />

                    <div>
                      <label className="block text-[13px] font-medium text-[#1c1c1e]/60 dark:text-white/50 mb-1.5">{t.submit.photoLabel}</label>
                      <ImageUpload photos={photos} onPhotosChange={setPhotos} />
                    </div>
                  </div>

                  {/* Section 2: Submitter info */}
                  <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-white dark:bg-[#1a1a1a] p-6 space-y-4">
                    <h2 className="text-[13px] font-semibold tracking-wide text-[#1c1c1e]/30 dark:text-white/20 uppercase">
                      {t.submit.sectionYou}
                    </h2>
                    <p className="text-[12px] text-[#1c1c1e]/25 dark:text-white/15 -mt-2">
                      {t.submit.privacyHint}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input label={t.submit.yourNameLabel} name="submitterName" value={form.submitterName} onChange={(e) => updateField("submitterName", e.target.value)} placeholder={t.submit.yourNamePlaceholder} />
                      <Input label={t.submit.contactLabel} name="submitterContact" value={form.submitterContact} onChange={(e) => updateField("submitterContact", e.target.value)} placeholder={t.submit.contactPlaceholder} />
                    </div>
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full" size="lg">
                    {submitting ? t.submit.submitting : t.submit.submitButton}
                  </Button>
                </form>
              </>
            ) : (
              <>
                <h1 className="text-[24px] font-bold tracking-tight text-[#1c1c1e] dark:text-[#e8e8e8] mb-1">
                  {t.submit.tabClue}
                </h1>
                <p className="text-[14px] text-[#1c1c1e]/40 dark:text-white/30 mb-8">
                  {t.submit.clueSubtitle}
                </p>

                {/* Step 1: Search */}
                {clueStep === "search" && (
                  <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-white dark:bg-[#1a1a1a] p-6 space-y-4">
                    <h2 className="text-[13px] font-semibold tracking-wide text-[#1c1c1e]/30 dark:text-white/20 uppercase">
                      {t.submit.clueStepSearch}
                    </h2>
                    <Input
                      label={t.submit.clueSearchLabel}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t.submit.clueSearchPlaceholder}
                      onKeyDown={(e) => e.key === "Enter" && handleClueSearch()}
                    />
                    <div>
                        <label className="block text-[13px] font-medium text-[#1c1c1e]/60 dark:text-white/50 mb-1.5">{t.filter.provinceLabel}</label>
                        <RegionCascader
                          province={clueProvince}
                          city={clueCity}
                          district=""
                          onProvinceChange={(v) => handleFilterChange(v, "")}
                          onCityChange={(v) => handleFilterChange(clueProvince, v)}
                          onDistrictChange={() => {}}
                        />
                    </div>
                    <Button onClick={handleClueSearch} disabled={searching || !searchQuery.trim()} className="w-full">
                      {searching ? "搜索中..." : t.filter.searchButton}
                    </Button>
                  </div>
                )}

                {/* Step 2: Select case */}
                {clueStep === "select" && (
                  <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-white dark:bg-[#1a1a1a] p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-[13px] font-semibold tracking-wide text-[#1c1c1e]/30 dark:text-white/20 uppercase">
                        {t.submit.clueStepSelect}
                      </h2>
                      <button
                        type="button"
                        onClick={() => setClueStep("search")}
                        className="text-[13px] text-[#e60012] hover:underline"
                      >
                        {t.filter.searchButton}
                      </button>
                    </div>

                    {/* Inline filter */}
                    <div>
                      <label className="block text-[13px] font-medium text-[#1c1c1e]/60 dark:text-white/50 mb-1.5">{t.filter.provinceLabel}</label>
                      <RegionCascader
                        province={clueProvince}
                        city={clueCity}
                        district=""
                        onProvinceChange={(v) => handleFilterChange(v, "")}
                        onCityChange={(v) => handleFilterChange(clueProvince, v)}
                        onDistrictChange={() => {}}
                      />
                    </div>

                    {searchResults.length === 0 ? (
                      <p className="text-[14px] text-[#1c1c1e]/35 dark:text-white/25 py-4 text-center">{t.grid.empty}</p>
                    ) : (
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {searchResults.map((r) => {
                          const thumb = getFirstPhoto(r.photoUrls);
                          return (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => selectCase(r)}
                              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors text-left border border-black/5 dark:border-white/5"
                            >
                              {thumb ? (
                                <img src={thumb} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-black/[0.04] dark:bg-white/[0.04] shrink-0" />
                              )}
                              <div className="min-w-0">
                                <div className="text-[14px] font-medium text-[#1c1c1e] dark:text-[#e8e8e8] truncate">
                                  {r.name}
                                </div>
                                <div className="text-[12px] text-[#1c1c1e]/35 dark:text-white/25">
                                  {r.gender && <span>{r.gender === "male" ? "男" : "女"} · </span>}
                                  {r.lostDate && <span>{r.lostDate} · </span>}
                                  {[r.lostProvince, r.lostCity].filter(Boolean).join(" ")}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Fill clue details */}
                {clueStep === "detail" && selectedCase && (
                  <div className="space-y-8">
                    {/* Selected case summary */}
                    <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-white dark:bg-[#1a1a1a] p-4 flex items-center gap-3">
                      {(() => {
                        const thumb = getFirstPhoto(selectedCase.photoUrls);
                        return thumb ? (
                          <img src={thumb} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] shrink-0" />
                        );
                      })()}
                      <div className="min-w-0 flex-1">
                        <div className="text-[15px] font-semibold text-[#1c1c1e] dark:text-[#e8e8e8]">
                          {selectedCase.name}
                        </div>
                        <div className="text-[12px] text-[#1c1c1e]/35 dark:text-white/25">
                          {selectedCase.gender === "male" ? "男" : selectedCase.gender === "female" ? "女" : ""}
                          {selectedCase.lostDate && ` · ${selectedCase.lostDate}`}
                          {[selectedCase.lostProvince, selectedCase.lostCity].filter(Boolean).join(" ") && ` · ${[selectedCase.lostProvince, selectedCase.lostCity].filter(Boolean).join(" ")}`}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setClueStep("select")}
                        className="text-[12px] text-[#e60012] hover:underline shrink-0"
                      >
                        {t.submit.clueStepSelect}
                      </button>
                    </div>

                    {/* Clue content form */}
                    <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-white dark:bg-[#1a1a1a] p-6 space-y-4">
                      <h2 className="text-[13px] font-semibold tracking-wide text-[#1c1c1e]/30 dark:text-white/20 uppercase">
                        {t.submit.clueStepDetail}
                      </h2>

                      <Textarea
                        label={t.submit.clueContentLabel}
                        value={clueContent}
                        onChange={(e) => setClueContent(e.target.value)}
                        placeholder={t.submit.clueContentPlaceholder}
                      />

                      <div>
                        <label className="block text-[13px] font-medium text-[#1c1c1e]/60 dark:text-white/50 mb-1.5">{t.submit.photoLabel}</label>
                        <ImageUpload photos={cluePhotos} onPhotosChange={setCluePhotos} />
                      </div>
                    </div>

                    {/* Submitter info */}
                    <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-white dark:bg-[#1a1a1a] p-6 space-y-4">
                      <h2 className="text-[13px] font-semibold tracking-wide text-[#1c1c1e]/30 dark:text-white/20 uppercase">
                        {t.submit.sectionYou}
                      </h2>
                      <p className="text-[12px] text-[#1c1c1e]/25 dark:text-white/15 -mt-2">
                        {t.submit.privacyHint}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input label={t.submit.yourNameLabel} value={clueSubmitterName} onChange={(e) => setClueSubmitterName(e.target.value)} placeholder={t.submit.yourNamePlaceholder} />
                        <Input label={t.submit.contactLabel} value={clueSubmitterContact} onChange={(e) => setClueSubmitterContact(e.target.value)} placeholder={t.submit.contactPlaceholder} />
                      </div>
                    </div>

                    <Button onClick={handleClueSubmit} disabled={clueSubmitting} className="w-full" size="lg">
                      {clueSubmitting ? t.submit.submitting : t.submit.submitButton}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </Container>
      </main>
      <Footer />
      <ToastContainer />
    </div>
  );
}

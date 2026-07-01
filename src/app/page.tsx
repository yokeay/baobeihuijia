"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { CaseGrid } from "@/components/case/CaseGrid";
import { CaseFilter } from "@/components/case/CaseFilter";
import { LiveTotal } from "@/components/ui/Odometer";
import { ToastContainer } from "@/components/ui/Toast";
import { usePublicLang } from "@/lib/i18n/public-context";

interface CaseItem {
  id: string;
  name: string;
  gender: string | null;
  lostDate: string | null;
  lostProvince: string | null;
  lostCity: string | null;
  photoUrls: string;
  height: number | null;
}

export default function HomePage() {
  const { t, countryCode } = usePublicLang();
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [gender, setGender] = useState("");
  const [search, setSearch] = useState("");

  const fetchCases = useCallback(async (p: number, reset: boolean) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    const params = new URLSearchParams();
    params.set("page", String(p));
    params.set("limit", "24");
    params.set("countryCode", countryCode);
    if (province) params.set("province", province);
    if (city) params.set("city", city);
    if (district) params.set("district", district);
    if (gender) params.set("gender", gender);
    if (search) params.set("search", search);

    try {
      const res = await fetch(`/api/cases?${params}`);
      const data = await res.json();
      if (reset) {
        setCases(data.items);
      } else {
        setCases((prev) => [...prev, ...data.items]);
      }
      setTotal(data.total);
      setHasMore(data.page < data.totalPages);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [province, city, district, gender, search, countryCode]);

  // Reset when country changes
  useEffect(() => {
    setPage(1);
    setProvince("");
    setCity("");
    setDistrict("");
    setGender("");
    setSearch("");
  }, [countryCode]);

  useEffect(() => {
    setPage(1);
    fetchCases(1, true);
  }, [fetchCases]);

  function handleLoadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchCases(nextPage, false);
  }

  return (
    <div className="flex flex-col min-h-full">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="py-16 md:py-24 text-center">
          <Container>
            <h1 className="text-[28px] md:text-[40px] font-bold tracking-tight text-[#1c1c1e] dark:text-[#e8e8e8] leading-relaxed">
              {t.hero.line1}<br />{t.hero.line2}
            </h1>
            <p className="mt-4 text-[15px] text-[#1c1c1e]/40 dark:text-white/30 max-w-md mx-auto leading-relaxed">
              {t.hero.subtitle}
            </p>
            <div className="flex items-center justify-center gap-8 mt-10">
              <div>
                <div className="text-[32px] font-semibold tracking-tight text-[#c5705a]">
                  <LiveTotal initialTotal={total} />
                </div>
                <div className="text-[12px] text-[#1c1c1e]/30 dark:text-white/20 mt-0.5">{t.hero.totalLabel}</div>
              </div>
              <div className="w-px h-10 bg-black/10 dark:bg-white/10" />
              <div>
                <div className="text-[32px] font-semibold tracking-tight text-[#c5705a]">
                  {t.hero.freeLabel}
                </div>
                <div className="text-[12px] text-[#1c1c1e]/30 dark:text-white/20 mt-0.5">{t.hero.freeSubLabel}</div>
              </div>
            </div>
          </Container>
        </section>

        {/* Filter + Grid */}
        <Container>
          <CaseFilter
            province={province}
            city={city}
            district={district}
            gender={gender}
            search={search}
            onProvinceChange={setProvince}
            onCityChange={setCity}
            onDistrictChange={setDistrict}
            onGenderChange={setGender}
            onSearchChange={setSearch}
          />
          <CaseGrid
            items={cases}
            loading={loading}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={handleLoadMore}
          />
        </Container>

        <div className="py-12" />
      </main>
      <Footer />
      <ToastContainer />
    </div>
  );
}

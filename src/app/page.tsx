"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { CaseGrid } from "@/components/case/CaseGrid";
import { CaseSidebar } from "@/components/case/CaseSidebar";
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
  const [globalTotal, setGlobalTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [gender, setGender] = useState("");
  const [search, setSearch] = useState("");

  const contentRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const slideRef = useRef<"hero" | "content">("hero");
  const animatingRef = useRef(false);

  // Global total across all countries (for the hero stat) — independent of
  // the current country filter used by the list below.
  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => setGlobalTotal(data.total ?? 0))
      .catch(() => {});
  }, []);

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

  // PPT-style paging: page 1 is the hero, page 2 is the content section.
  // Scrolling down on the hero always pages to content. Scrolling up while
  // the content section is itself scrolled to its top pages back to hero.
  // Once inside content and scrolled down, wheel/touch behaves natively.
  useEffect(() => {
    function goTo(target: "hero" | "content") {
      if (animatingRef.current || slideRef.current === target) return;
      animatingRef.current = true;
      slideRef.current = target;
      const el = target === "hero" ? heroRef.current : contentRef.current;
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => { animatingRef.current = false; }, 700);
    }

    function handleWheel(e: WheelEvent) {
      if (animatingRef.current) { e.preventDefault(); return; }
      if (slideRef.current === "hero" && e.deltaY > 0) {
        e.preventDefault();
        goTo("content");
        return;
      }
      if (slideRef.current === "content" && e.deltaY < 0 && window.scrollY <= (contentRef.current?.offsetTop ?? 0) + 4) {
        e.preventDefault();
        goTo("hero");
      }
    }

    let touchStartY = 0;
    function handleTouchStart(e: TouchEvent) {
      touchStartY = e.touches[0]?.clientY ?? 0;
    }
    function handleTouch(e: TouchEvent) {
      if (animatingRef.current) { e.preventDefault(); return; }
      const y = e.touches[0]?.clientY ?? touchStartY;
      const deltaY = touchStartY - y; // positive = swiping up (content-wise scroll down)
      if (slideRef.current === "hero" && deltaY > 10) {
        e.preventDefault();
        goTo("content");
        return;
      }
      if (slideRef.current === "content" && deltaY < -10 && window.scrollY <= (contentRef.current?.offsetTop ?? 0) + 4) {
        e.preventDefault();
        goTo("hero");
      }
    }

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouch, { passive: false });
    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouch);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-full">
      <Header />
      <main className="flex-1">
        {/* Hero — single full-viewport screen. First scroll snaps to content below. */}
        <section ref={heroRef} className="relative min-h-[calc(100vh-3rem)] flex flex-col items-center justify-center text-center px-4">
          <Container>
            <h1 className="text-[28px] md:text-[44px] font-bold tracking-tight text-[#1c1c1e] dark:text-[#e8e8e8] leading-relaxed">
              {t.hero.line1}<br />{t.hero.line2}
            </h1>
            <p className="mt-4 text-[15px] text-[#1c1c1e]/40 dark:text-white/30 max-w-md mx-auto leading-relaxed">
              {t.hero.subtitle}
            </p>
            <div className="flex items-center justify-center gap-8 mt-10">
              <div>
                <div className="text-[32px] font-semibold tracking-tight text-[#c5705a]">
                  <LiveTotal initialTotal={globalTotal} />
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

          <div className="absolute bottom-8 flex flex-col items-center gap-1 animate-breathe">
            <span className="text-[11px] text-[#1c1c1e]/30 dark:text-white/20">向下滑动查看寻人信息</span>
            <svg className="h-4 w-4 text-[#1c1c1e]/25 dark:text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </div>
        </section>

        {/* Content — sidebar (filters) + masonry grid */}
        <div ref={contentRef}>
          <Container>
            <div className="flex gap-6 items-start">
              <CaseSidebar
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
              <div className="flex-1 min-w-0">
                <CaseGrid
                  items={cases}
                  loading={loading}
                  hasMore={hasMore}
                  loadingMore={loadingMore}
                  onLoadMore={handleLoadMore}
                />
              </div>
            </div>
          </Container>
        </div>

        <div className="py-12" />
      </main>
      <Footer />
      <ToastContainer />
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { CaseGrid } from "@/components/case/CaseGrid";
import { CaseSidebar } from "@/components/case/CaseSidebar";
import { LiveTotal } from "@/components/ui/Odometer";
import { Starfield } from "@/components/home/Starfield";
import { ToastContainer } from "@/components/ui/Toast";
import { usePublicLang } from "@/lib/i18n/public-context";

const HEADER_H = 48;
const PPT_OUT_MS = 340;
const PPT_IN_MS = 460;

// 06:00–18:00 算白天，其余算夜间。判定要按访客本地时间（浏览器时区），
// 而且得在首帧之前就定下来 —— layout.tsx 里有一份同样的判断，两边改要一起改。
function isDaytime(): boolean {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18;
}

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
  const { t, countryCode, promptRegionLang } = usePublicLang();
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
  const [heroPhase, setHeroPhase] = useState<"idle" | "out" | "in">("idle");

  const contentRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);

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

  // 新疆/内蒙古/西藏 selected within the CN region filter — offer a local-
  // language overlay on top of the CN default.
  useEffect(() => {
    if (countryCode === "CN") promptRegionLang(province);
  }, [countryCode, province, promptRegionLang]);

  useEffect(() => {
    setPage(1);
    fetchCases(1, true);
  }, [fetchCases]);

  function handleLoadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchCases(nextPage, false);
  }

  // 刷新后的第一次向下滚动：淡出首屏 → 瞬移一屏 → 淡入列表，像翻 PPT。
  // 只拦这一次，翻完立刻摘掉监听，之后（含从第二页滚回第一页）都是原来的连续滚动。
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let triggered = false;
    let touchArmY: number | null = null;

    function detach() {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    }

    function begin() {
      if (triggered) return;
      triggered = true;
      setHeroPhase("out");
      window.setTimeout(() => {
        const content = contentRef.current;
        if (content) {
          const top = content.getBoundingClientRect().top + window.scrollY - HEADER_H;
          window.scrollTo({ top, behavior: "auto" });
        }
        setHeroPhase("in");
        window.setTimeout(() => {
          setHeroPhase("idle");
          detach();
        }, PPT_IN_MS);
      }, PPT_OUT_MS);
    }

    function onWheel(e: WheelEvent) {
      // 切换途中把滚动吃掉，不然淡出和滚动叠在一起，看着像卡了一下
      if (triggered) {
        e.preventDefault();
        return;
      }
      if (window.scrollY > 4 || e.deltaY <= 0) return;
      e.preventDefault();
      begin();
    }

    function onTouchStart(e: TouchEvent) {
      touchArmY = window.scrollY <= 4 ? e.touches[0]?.clientY ?? null : null;
    }

    function onTouchMove(e: TouchEvent) {
      if (triggered) {
        e.preventDefault();
        return;
      }
      if (touchArmY === null) return;
      const y = e.touches[0]?.clientY ?? touchArmY;
      if (touchArmY - y > 8) {
        e.preventDefault();
        begin();
      }
    }

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    return detach;
  }, []);

  // 首页整页不画滚动条（照样能滚），停在首屏时导航栏透明浮在天空上。
  // 昼/夜按访客本地时间：首帧之前 layout.tsx 里的内联脚本已经先判过一次
  // （不然会先黑一帧再变白），这里负责客户端路由回到首页时补上。
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("home-no-scrollbar");
    root.classList.toggle("home-day", isDaytime());

    function syncHeader() {
      const heroHeight = heroRef.current?.offsetHeight ?? window.innerHeight;
      root.classList.toggle("home-hero-top", window.scrollY < heroHeight - 160);
    }
    syncHeader();
    window.addEventListener("scroll", syncHeader, { passive: true });
    window.addEventListener("resize", syncHeader);
    return () => {
      window.removeEventListener("scroll", syncHeader);
      window.removeEventListener("resize", syncHeader);
      root.classList.remove("home-no-scrollbar", "home-hero-top", "home-day");
    };
  }, []);

  return (
    <div className="flex flex-col min-h-full">
      <Header />
      <main className="flex-1">
        {/* 首屏 — 一屏夜空，刷新后第一次向下滚动整屏淡出翻到列表页 */}
        <section
          ref={heroRef}
          className={`hero-screen relative flex flex-col items-center justify-center text-center px-4${
            heroPhase === "out" ? " hero-ppt-out" : ""
          }`}
        >
          <Starfield />

          <Container className="relative z-10">
            <h1 className="hero-title text-[28px] md:text-[44px] font-bold tracking-tight leading-relaxed">
              {t.hero.line1}<br />{t.hero.line2}
            </h1>
            <p className="hero-subtitle mt-4 text-[15px] max-w-md mx-auto leading-relaxed">
              {t.hero.subtitle}
            </p>
            <div className="flex items-center justify-center gap-8 mt-10">
              <div>
                <div className="hero-metric text-[32px] font-semibold tracking-tight">
                  <LiveTotal initialTotal={globalTotal} />
                </div>
                <div className="hero-metric-label text-[12px] mt-0.5">{t.hero.totalLabel}</div>
              </div>
              <div className="hero-rule w-px h-10" />
              <div>
                <div className="hero-metric text-[32px] font-semibold tracking-tight">
                  {t.hero.freeLabel}
                </div>
                <div className="hero-metric-label text-[12px] mt-0.5">{t.hero.freeSubLabel}</div>
              </div>
            </div>
          </Container>

          {/* 第一页整页都是天空，提示随便压在哪都看得见 */}
          <div className="absolute bottom-32 flex flex-col items-center gap-1 animate-breathe">
            <span className="hero-hint text-[11px]">{t.hero.scrollHint}</span>
            <svg className="hero-hint-icon h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </div>
        </section>

        {/* 列表页 — 侧栏（筛选）+ 瀑布流 */}
        <div ref={contentRef} className={heroPhase === "in" ? "content-ppt-in" : undefined}>
          <Container>
            <div className="flex gap-6 items-start">
              <CaseSidebar
                countryCode={countryCode}
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

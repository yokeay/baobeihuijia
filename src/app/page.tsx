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

// 翻屏动画时长，要和 globals.css 里 .home-slide 的 transition 一致。
const SWITCH_MS = 400;
// 触屏上最少要划出这么多像素才算翻屏，免得轻点两下就翻过去。
const SWIPE_PX = 8;

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

// 首页只有两屏，任何时刻整屏只属于其中一屏，中间态不存在。
type Screen = "hero" | "list";

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
  const [screen, setScreen] = useState<Screen>("hero");
  // 每次打开 / 刷新首页换一个随机排序种子，服务端据此把「未选地区」的列表打乱，
  // 不再永远是同一批最新数据。种子必须固定住（而不是每次请求现生成），否则
  // 「加载更多」会翻到另一套顺序上，导致重复与漏掉记录。
  const [seed] = useState(() => Math.random().toString(36).slice(2, 10));

  const listRef = useRef<HTMLDivElement>(null);
  // 事件监听挂在 window 上、只注册一次，所以「现在在哪一屏」得从 ref 里读，
  // 不能在闭包里读 state —— 那样拿到的是注册那一刻的旧值。
  const screenRef = useRef<Screen>("hero");
  // 翻屏途中把后续的滚动/触摸输入吃掉，不然一次惯性滚动能连翻两屏。
  const switchingRef = useRef(false);
  const switchTimer = useRef<number | null>(null);

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
    // 由服务端决定要不要打乱：只有没选地区时才用得上，带上也无副作用。
    params.set("seed", seed);
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
  }, [province, city, district, gender, search, countryCode, seed]);

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

  // 翻屏。只翻整屏、不滚动页面，所以两屏之间永远不存在「一半宣传页一半列表」的
  // 中间状态。导航栏透明态跟着走：宣传页上透明浮着，列表页上恢复毛玻璃。
  const goto = useCallback((next: Screen) => {
    if (switchingRef.current || screenRef.current === next) return;
    switchingRef.current = true;
    screenRef.current = next;
    setScreen(next);
    document.documentElement.classList.toggle("home-hero-top", next === "hero");
    if (switchTimer.current !== null) window.clearTimeout(switchTimer.current);
    switchTimer.current = window.setTimeout(() => {
      switchingRef.current = false;
      switchTimer.current = null;
    }, SWITCH_MS);
  }, []);

  // 进列表页的三种输入都走这里：往下滚、手指往上划、方向键。
  // 回宣传页只在「列表已经滚到最顶上」时才认，否则那是在列表里正常往回翻。
  useEffect(() => {
    let touchStartY: number | null = null;

    function listAtTop(): boolean {
      const el = listRef.current;
      return !el || el.scrollTop <= 0;
    }

    function onWheel(e: WheelEvent) {
      // 切换途中把滚动吃掉，不然淡出和滚动叠在一起，看着像卡了一下
      if (switchingRef.current) {
        e.preventDefault();
        return;
      }
      if (screenRef.current === "hero") {
        if (e.deltaY > 0) {
          e.preventDefault();
          goto("list");
        }
        return;
      }
      const el = listRef.current;
      // 光标停在滚动容器以外的地方（最典型的是浮在列表上面的那 48px 导航栏）时，
      // 浏览器找不到可滚的祖先，这一下就白滚了。把增量转交给列表，别留一条死带。
      if (el && !el.contains(e.target as Node)) {
        e.preventDefault();
        if (e.deltaY < 0 && el.scrollTop <= 0) {
          goto("hero");
          return;
        }
        el.scrollTop += e.deltaY * (e.deltaMode === 1 ? 16 : 1);
        return;
      }
      if (e.deltaY < 0 && listAtTop()) {
        e.preventDefault();
        goto("hero");
      }
    }

    function onTouchStart(e: TouchEvent) {
      const y = e.touches[0]?.clientY ?? null;
      // 列表没停在顶端时这一划属于列表内部滚动，别记起点
      touchStartY = y !== null && (screenRef.current === "hero" || listAtTop()) ? y : null;
    }

    function onTouchMove(e: TouchEvent) {
      if (switchingRef.current) {
        e.preventDefault();
        return;
      }
      if (touchStartY === null) return;
      const y = e.touches[0]?.clientY ?? touchStartY;
      const dy = touchStartY - y; // >0 = 手指往上划
      if (screenRef.current === "hero" && dy > SWIPE_PX) {
        e.preventDefault();
        goto("list");
      } else if (screenRef.current === "list" && dy < -SWIPE_PX && listAtTop()) {
        e.preventDefault();
        goto("hero");
      }
    }

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [goto]);

  // 页面本身不滚了，键盘用户没有滚动惯性可用，方向键补上同一套翻屏；
  // 在输入框里打字不算。
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (switchingRef.current) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable) return;

      if (screenRef.current === "hero") {
        if (e.key !== "ArrowDown" && e.key !== "PageDown") return;
      } else {
        if (e.key !== "ArrowUp" && e.key !== "PageUp" && e.key !== "Home") return;
        const el = listRef.current;
        if (el && el.scrollTop > 0) return;
      }
      e.preventDefault();
      goto(screenRef.current === "hero" ? "list" : "hero");
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goto]);

  // 首页整页不画滚动条（照样能滚的是列表那一列，见 .no-scrollbar），
  // 导航栏浮在天空上的透明态跟着当前那一屏走。
  // 昼/夜按访客本地时间：首帧之前 layout.tsx 里的内联脚本已经先判过一次
  // （不然会先黑一帧再变白），这里负责客户端路由回到首页时补上。
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("home-no-scrollbar");
    root.classList.toggle("home-day", isDaytime());
    root.classList.toggle("home-hero-top", screenRef.current === "hero");
    return () => {
      if (switchTimer.current !== null) window.clearTimeout(switchTimer.current);
      root.classList.remove("home-no-scrollbar", "home-hero-top", "home-day");
    };
  }, []);

  return (
    <div className="home-viewport">
      <Header />
      {/* 两屏都从视口最顶上铺起（连导航栏那 3rem 一起盖住），导航靠 z-40 浮在上面 */}
      <main className="absolute inset-0">
        {/* 第一屏 — 一屏夜空，整屏不滚；往下滚 / 点提示翻到列表页 */}
        <section
          className={`hero-screen home-slide home-slide-hero flex flex-col items-center justify-center text-center px-4${
            screen === "list" ? " home-slide-off" : ""
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

          {/* 第一页整页都是天空，提示随便压在哪都看得见。
              顺手做成按钮：不会用滚轮和触屏的人（含键盘）也能进列表页。 */}
          <button
            type="button"
            onClick={() => goto("list")}
            className="absolute bottom-32 flex flex-col items-center gap-1 animate-breathe"
          >
            <span className="hero-hint text-[11px]">{t.hero.scrollHint}</span>
            <svg className="hero-hint-icon h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </button>
        </section>

        {/* 第二屏 — 列表页：整屏不滚，只有列表那一列内部滚（左侧栏吸住不动），
            滚到底露出页脚，页脚跟着列表一起走。 */}
        <section
          className={`home-slide home-slide-list bg-[#f5fafc] ${
            screen === "hero" ? " home-slide-off" : ""
          }`}
        >
          {/* 避让导航栏的那点留白要放在内容里，不能放在滚动容器自己身上：
              滚动容器的 padding-top 会叠加到吸顶元素的偏移上，左侧筛选栏会被推低一截。 */}
          <div ref={listRef} className="no-scrollbar h-full overflow-y-auto overscroll-contain">
            <Container className="pt-12">
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
            <Footer />
          </div>
        </section>
      </main>
      <ToastContainer />
    </div>
  );
}

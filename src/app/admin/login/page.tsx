"use client";

import { useAdmin } from "../context";

export default function AdminLoginPage() {
  const { t } = useAdmin();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f8fa] dark:bg-[#0a0a0a] px-6">
      <div className="w-full max-w-[400px]">
        <div className="rounded-2xl bg-white dark:bg-[#121316] border border-black/[0.06] dark:border-white/[0.07] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_24px_48px_-24px_rgba(16,24,40,0.28)] px-8 py-9">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#e60012] text-white flex items-center justify-center text-[20px] font-semibold shadow-[0_8px_20px_-8px_rgba(230,0,18,0.6)]">
              寻
            </div>
            <div className="mt-4 text-[10.5px] font-semibold tracking-[0.16em] uppercase text-[#98a2b3]">
              Admin
            </div>
            <h1 className="mt-1.5 text-[19px] font-semibold tracking-tight text-[#101828] dark:text-gray-100">
              {t.login.title}
            </h1>
            <p className="mt-1 text-[12.5px] leading-relaxed text-[#98a2b3]">
              {t.login.subtitle}
            </p>
          </div>

          <a
            href="/api/auth/github"
            className="mt-7 flex items-center justify-center gap-2.5 h-11 w-full rounded-xl bg-[#101828] dark:bg-white text-white dark:text-[#101828] text-[13px] font-medium transition-all hover:bg-[#1d2939] dark:hover:bg-gray-100 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e60012]/40 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#121316]"
          >
            <svg width={17} height={17} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            {t.login.button}
          </a>
        </div>

        <p className="mt-5 text-center text-[11.5px] text-[#b0b8c4] dark:text-gray-600">
          仅限授权管理员访问
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { CommentList } from "@/components/comment/CommentList";
import { CommentForm } from "@/components/comment/CommentForm";
import { ToastContainer } from "@/components/ui/Toast";
import { usePublicLang } from "@/lib/i18n/public-context";
import { fmt, genderLabel, photoPlaceholder } from "@/lib/i18n/public/format";
import { useUser } from "@/lib/UserContext";
import { ContactInfoSheet } from "@/components/auth/ContactInfoSheet";

export function CaseDetailClient({ id }: { id: string }) {
  const { t } = usePublicLang();
  const { token, setAuthOpen, setPendingAction } = useUser();
  const [following, setFollowing] = useState(false);
  const [contactSheetOpen, setContactSheetOpen] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionForm, setQuestionForm] = useState("");
  const [qSubmitting, setQSubmitting] = useState(false);
  const [caseData, setCaseData] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [clues, setClues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [clueForm, setClueForm] = useState("");
  const [clueSubmitting, setClueSubmitting] = useState(false);

  async function handleQuestionSubmit() {
    if (!questionForm.trim() || qSubmitting) return;
    if (!token) {
      setPendingAction(() => doSubmitQuestion());
      setAuthOpen(true);
      return;
    }
    doSubmitQuestion();
  }

  async function doSubmitQuestion() {
    const tk = token || localStorage.getItem("bbhj_token") || "";
    setQSubmitting(true);
    await fetch(`/api/cases/${id}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tk}` },
      body: JSON.stringify({ content: questionForm }),
    });
    setQuestionForm("");
    setQSubmitting(false);
    fetchQuestions();
  }
  async function submitClue() {
    if (!clueForm.trim()) return;
    if (!token) {
      setPendingAction(() => doSubmitClue());
      setAuthOpen(true);
      return;
    }
    doSubmitClue();
  }
  async function doSubmitClue() {
    const tk = token || localStorage.getItem("bbhj_token") || "";
    setClueSubmitting(true);
    try {
      await fetch(`/api/cases/${id}/clues`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tk}` },
        body: JSON.stringify({ content: clueForm }),
      });
      setClueForm("");
      fetchClues();
    } finally {
      setClueSubmitting(false);
    }
  }


  async function fetchCase() {
    const res = await fetch(`/api/cases/${id}`);
    const data = await res.json();
    setCaseData(data);
    setLoading(false);
  }

  async function fetchComments() {
    const res = await fetch(`/api/cases/${id}/comments`);
    const data = await res.json();
    setComments(data);
  }

  async function fetchClues() {
    const res = await fetch(`/api/cases/${id}/clues`);
    const data = await res.json();
    setClues(data.items || []);
  }

  async function fetchQuestions() {
    const res = await fetch(`/api/cases/${id}/questions`);
    const data = await res.json();
    setQuestions(data.items || []);
  }

  async function recordView() {
    fetch(`/api/cases/${id}/view`, { method: 'POST' }).catch(() => {});
  }

  async function fetchFollowStatus() {
    if (!token) return;
    const res = await fetch(`/api/cases/${id}/follow`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setFollowing(data.following ?? false);
  }

  async function handleFollow() {
    if (!token) {
      setPendingAction(() => doFollow());
      setAuthOpen(true);
      return;
    }
    doFollow();
  }

  async function doFollow() {
    const tk = token || localStorage.getItem("bbhj_token") || "";
    const res = await fetch(`/api/cases/${id}/follow`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tk}` },
    });
    const data = await res.json();
    setFollowing(data.following ?? false);
    if (data.following) setContactSheetOpen(true);
  }

  useEffect(() => {
    fetchCase();
    fetchComments();
    fetchClues();
    fetchQuestions();
    fetchFollowStatus();
    recordView();
  }, [id, token]);

  const duration = (() => {
    if (!caseData?.lostDate) return '';
    const d = new Date(caseData.lostDate);
    const now = new Date();
    const years = now.getFullYear() - d.getFullYear();
    const months = now.getMonth() - d.getMonth() + years * 12;
    if (months >= 12) return fmt(t.time.aboutYears, { n: Math.floor(months / 12) });
    if (months > 0) return fmt(t.time.aboutMonths, { n: months });
    return t.time.lessThanMonth;
  })();

  if (loading) return (
    <div className="flex flex-col min-h-full"><Header /><main className="flex-1 py-20"><Container><p className="text-center text-sm text-gray-400">{t.case.loading}</p></Container></main><Footer /></div>
  );

  if (!caseData) return (
    <div className="flex flex-col min-h-full"><Header /><main className="flex-1 py-20"><Container><p className="text-center text-sm text-gray-400">{t.case.notFound}</p></Container></main><Footer /></div>
  );

  const photos: string[] = (() => { try { const a = JSON.parse(caseData.photoUrls || "[]"); return Array.isArray(a) ? a : []; } catch { return []; } })();

  return (
    <div className="flex flex-col min-h-full">
      <Header />
      <main className="flex-1 py-8">
        <Container>
          <div className="max-w-5xl mx-auto">

            {/* 上：详情区 - 左图右信息 */}
            <div className="flex flex-col md:flex-row gap-8 mb-10">

              {/* 左：照片 */}
              <div className="md:w-72 flex-shrink-0">
                <div className="w-full rounded-2xl overflow-hidden bg-gray-100 shadow-md" style={{aspectRatio:'3/4'}}>
                  <img
                    src={photos[0] || photoPlaceholder(t.case.noPhoto)}
                    alt={caseData.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {photos.length > 1 && (
                  <div className="flex gap-2 mt-2">
                    {photos.slice(1,4).map((p,i) => (
                      <img key={i} src={p} className="w-16 h-20 object-cover rounded-lg opacity-80 hover:opacity-100 transition-opacity" />
                    ))}
                  </div>
                )}
              </div>

              {/* 右：信息 + 操作按钮 */}
              <div className="flex-1 flex flex-col">

                {/* 姓名 + 状态 */}
                <div className="flex items-center gap-3 mb-4">
                  <h1 className="text-2xl font-bold" style={{color:'var(--text-primary)'}}>{caseData.name}</h1>
                  {caseData.status === 'found' && <span className="px-2 py-1 rounded-full text-xs font-semibold text-white" style={{ background: "var(--success)" }}>{t.case.statusFound}</span>}
                  {caseData.status !== 'found' && <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{background:'var(--accent-light)',color:'var(--accent)'}}>{t.case.statusSearching}</span>}
                </div>

                {/* 统计：浏览 + 守候 */}
                <div className="flex gap-4 mb-5 text-sm" style={{color:'var(--text-tertiary)'}}>
                  {(caseData.viewCount ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      {caseData.viewCount} {t.case.viewsUnit}
                    </span>
                  )}
                  {(caseData.followCount ?? 0) > 0 && <span>🕯 {caseData.followCount} {t.case.watchersUnit}</span>}
                </div>

                {/* 字段信息 */}
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 mb-6 text-sm">
                  {caseData.gender && <><dt className="font-medium" style={{color:'var(--text-secondary)'}}>{t.case.gender}</dt><dd style={{color:'var(--text-primary)'}}>{genderLabel(caseData.gender, t)}</dd></>}
                  {caseData.birthDate && <><dt className="font-medium" style={{color:'var(--text-secondary)'}}>{t.case.birthDate}</dt><dd style={{color:'var(--text-primary)'}}>{caseData.birthDate?.slice?.(0,10)}</dd></>}
                  {caseData.lostDate && <><dt className="font-medium" style={{color:'var(--text-secondary)'}}>{t.case.lostTime}</dt><dd style={{color:'var(--text-primary)'}}>{caseData.lostDate?.slice?.(0,10)}（{duration}）</dd></>}
                </dl>

                {/* 更多字段 */}
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 mb-6 text-sm">
                  {caseData.height && <><dt className="font-medium" style={{color:'var(--text-secondary)'}}>{t.case.height}</dt><dd style={{color:'var(--text-primary)'}}>{caseData.height} {t.case.cm}</dd></>}
                  {caseData.lostAddress && <><dt className="font-medium" style={{color:'var(--text-secondary)'}}>{t.case.lostAddress}</dt><dd style={{color:'var(--text-primary)'}}>{caseData.lostAddress}</dd></>}
                  {caseData.lostProvince && <><dt className="font-medium" style={{color:'var(--text-secondary)'}}>{t.case.lostRegion}</dt><dd style={{color:'var(--text-primary)'}}>{[caseData.lostProvince, caseData.lostCity, caseData.lostDistrict].filter(Boolean).join(' ')}</dd></>}
                  {caseData.submitterName && <><dt className="font-medium" style={{color:'var(--text-secondary)'}}>{t.case.provider}</dt><dd style={{color:'var(--text-primary)'}}>{caseData.submitterName}</dd></>}
                  {caseData.source && <><dt className="font-medium" style={{color:'var(--text-secondary)'}}>{t.case.dataSource}</dt><dd style={{color:'var(--text-primary)'}}>{caseData.source === 'api' ? t.case.sourceBaobeihuijia : caseData.source}</dd></>}
                </dl>
                {caseData.feature && (
                  <div className="mb-6 p-4 rounded-xl text-sm leading-relaxed" style={{background:'var(--bg-muted)',color:'var(--text-primary)'}}>
                    <p className="font-medium mb-1" style={{color:'var(--text-secondary)'}}>{t.case.featureFull}</p>
                    <p className="whitespace-pre-wrap">{caseData.feature}</p>
                  </div>
                )}

                {/* 操作按钮区 - 统一在右侧底部 */}
                <div className="flex flex-wrap gap-3 mt-auto pt-4">
                  <button
                    onClick={handleFollow}
                    className="px-6 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                    style={{background: following ? '#E60012' : 'var(--bg-muted)', color: following ? 'white' : 'var(--text-primary)', border: '1px solid var(--border-default)'}}
                  >
                    {following ? t.case.following : t.case.follow}
                  </button>
                  {caseData.sourceUrl && (
                    <a href={caseData.sourceUrl} target="_blank" rel="noreferrer"
                      className="px-6 py-3 rounded-xl text-sm font-semibold"
                      style={{background:'var(--bg-muted)',color:'var(--text-primary)',border:'1px solid var(--border-default)'}}>
                      {t.case.viewSourceArrow}
                    </a>
                  )}
                </div>

              </div>{/* 右侧信息结束 */}
            </div>{/* 左右布局结束 */}


            {/* 下：线索区 */}
            {clues.length > 0 && (
              <div className="mb-8">
                <h2 className="text-base font-semibold mb-4" style={{color:'var(--text-primary)'}}>{t.case.cluesTitle}</h2>
                <div className="space-y-3">
                  {clues.map((c: any) => (
                    <div key={c.id} className="p-4 rounded-2xl" style={{background:'var(--bg-muted)'}}>
                      <p className="text-sm" style={{color:'var(--text-primary)'}}>{c.content}</p>
                      <p className="text-xs mt-1" style={{color:'var(--text-tertiary)'}}>{c.contactName ?? t.case.anonymous} · {c.createdAt?.slice?.(0,10)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mb-10">
              <h2 className="text-base font-semibold mb-3" style={{color:'var(--text-primary)'}}>{t.case.provideClue}</h2>
              <div className="flex flex-col gap-2">
                <textarea rows={2} placeholder={t.case.cluePlaceholder} value={clueForm} onChange={e=>setClueForm(e.target.value)} className="w-full rounded-xl px-3 py-2 text-sm outline-none resize-none" style={{background:'var(--bg-muted)',color:'var(--text-primary)'}} />
                <button onClick={submitClue} disabled={!clueForm.trim()} className="self-end px-4 py-1.5 rounded-full text-sm font-medium disabled:opacity-40" style={{background:'var(--color-primary)',color:'#fff'}}>{t.case.submitClue}</button>
              </div>
            </div>

            {/* 疑问区 */}
            <div className="mb-10">
              <h2 className="text-base font-semibold mb-4" style={{color:'var(--text-primary)'}}>{t.case.questionsTitle}</h2>
              <div className="flex gap-2 mb-4">
                <textarea rows={2} placeholder={t.case.questionPlaceholder} value={questionForm}
                  onChange={(e) => setQuestionForm(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl text-sm outline-none resize-none"
                  style={{background:'var(--bg-muted)',border:'1px solid var(--border-default)',color:'var(--text-primary)'}}
                />
                <button disabled={!questionForm.trim() || qSubmitting}
                  onClick={handleQuestionSubmit}
                  className="px-4 py-2 rounded-xl text-sm font-semibold self-end"
                  style={{background: questionForm.trim() ? '#E60012' : '#E5E7EB', color: questionForm.trim() ? 'white' : '#9CA3AF'}}>
                  {qSubmitting ? t.case.submittingShort : t.case.submitShort}
                </button>
              </div>
              {questions.length > 0 && (
                <div className="space-y-3">
                  {questions.map((q: any) => (
                    <div key={q.id} className="p-3 rounded-xl" style={{background:'var(--bg-muted)'}}>
                      <p className="text-sm" style={{color:'var(--text-primary)'}}>{q.content}</p>
                      <p className="text-xs mt-1" style={{color:'var(--text-tertiary)'}}>{q.submitterName ?? t.case.anonymousUser}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 评论区 */}
            <div className="mb-10">
              <h2 className="text-base font-semibold mb-4" style={{color:'var(--text-primary)'}}>{t.case.comments}</h2>
              <CommentList comments={comments} />
              <div className="mt-4">
                <CommentForm caseId={id} onCommentAdded={() => fetchComments()} />
              </div>
            </div>

          </div>{/* max-w-5xl 结束 */}
        </Container>
      </main>
      <Footer />
      <ContactInfoSheet open={contactSheetOpen} onClose={() => setContactSheetOpen(false)} />
    </div>
  );
}

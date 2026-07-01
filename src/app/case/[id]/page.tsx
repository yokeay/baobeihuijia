"use client";

import { useState, useEffect, use } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { CommentList } from "@/components/comment/CommentList";
import { CommentForm } from "@/components/comment/CommentForm";
import { ToastContainer } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { usePublicLang } from "@/lib/i18n/public-context";

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = usePublicLang();
  const [caseData, setCaseData] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [clues, setClues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

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

  useEffect(() => {
    fetchCase();
    fetchComments();
    fetchClues();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <Header />
        <main className="flex-1 py-20"><Container><p className="text-center text-[14px] text-[#1c1c1e]/30">{t.case.loading}</p></Container></main>
        <Footer />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="flex flex-col min-h-full">
        <Header />
        <main className="flex-1 py-20"><Container><p className="text-center text-[14px] text-[#1c1c1e]/30">{t.case.notFound}</p></Container></main>
        <Footer />
      </div>
    );
  }

  const photos: string[] = JSON.parse(caseData.photoUrls || "[]");

  return (
    <div className="flex flex-col min-h-full">
      <Header />
      <main className="flex-1 py-8">
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: caseData.name,
              description: `${caseData.name}${caseData.gender ? `，${caseData.gender}` : ""}${caseData.height ? `，身高${caseData.height}cm` : ""}${caseData.lostDate ? `，于${caseData.lostDate}走失` : ""}${caseData.feature ? `。体貌特征：${caseData.feature}` : ""}`,
              image: photos[0] || undefined,
              gender: caseData.gender || undefined,
              height: caseData.height ? `${caseData.height / 100} m` : undefined,
              birthDate: caseData.birthDate || undefined,
              url: `https://wohaoxiangni.com/case/${caseData.id}`,
            }),
          }}
        />
        <Container>
          <div className="max-w-4xl mx-auto">
            {/* Photos */}
            {photos.length > 0 && (
              <div className="mb-8">
                <div className="rounded-2xl overflow-hidden bg-black/5 dark:bg-white/5">
                  <img
                    src={photos[activePhoto]}
                    alt={caseData.name}
                    className="w-full aspect-[4/3] md:aspect-[16/9] object-contain cursor-zoom-in"
                    onClick={() => setLightboxOpen(true)}
                  />
                </div>
                {photos.length > 1 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                    {photos.map((url: string, i: number) => (
                      <button
                        key={i}
                        onClick={() => setActivePhoto(i)}
                        className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                          i === activePhoto
                            ? "border-[#c5705a] opacity-100"
                            : "border-transparent opacity-50 hover:opacity-80"
                        }`}
                      >
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Two-column info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {/* Left: Basic info */}
              <div className="md:col-span-1">
                <h1 className="text-[24px] font-bold tracking-tight text-[#1c1c1e] dark:text-[#e8e8e8] mb-2">
                  {caseData.name}
                </h1>
                <p className="text-[13px] text-[#1c1c1e]/30 dark:text-white/20 mb-6">
                  {t.case.lostDate}{caseData.lostDate || t.case.unknown}
                </p>

                <div className="space-y-3 text-[14px]">
                  <InfoRow label={t.case.gender} value={caseData.gender} />
                  <InfoRow label={t.case.height} value={caseData.height ? `${caseData.height}${t.case.cm}` : null} />
                  <InfoRow label={t.case.birthDate} value={caseData.birthDate} />
                </div>
              </div>

              {/* Right: Location + details */}
              <div className="md:col-span-2 space-y-5">
                <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-white dark:bg-[#1a1a1a] p-5">
                  <h3 className="text-[12px] font-medium text-[#1c1c1e]/30 dark:text-white/20 mb-3 uppercase tracking-wide">
                    {t.case.lostInfo}
                  </h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-[14px]">
                    <InfoItem label={t.case.province} value={caseData.lostProvince} />
                    <InfoItem label={t.case.city} value={caseData.lostCity} />
                    <InfoItem label={t.case.district} value={caseData.lostDistrict} />
                    <InfoItem label={t.case.lostDate} value={caseData.lostDate} />
                  </div>
                  {caseData.lostAddress && (
                    <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5">
                      <span className="text-[12px] text-[#1c1c1e]/30 dark:text-white/20">{t.case.detailAddress}</span>
                      <p className="text-[14px] mt-0.5 text-[#1c1c1e]/70 dark:text-white/60">{caseData.lostAddress}</p>
                    </div>
                  )}
                  {caseData.feature && (
                    <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5">
                      <span className="text-[12px] text-[#1c1c1e]/30 dark:text-white/20">{t.case.feature}</span>
                      <p className="text-[14px] mt-0.5 text-[#1c1c1e]/70 dark:text-white/60">{caseData.feature}</p>
                    </div>
                  )}
                </div>

                {caseData.sourceUrl && (
                  <a
                    href={caseData.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[13px] text-[#c5705a] hover:text-[#b05a45] transition-colors"
                  >
                    {t.case.viewSource} <span className="text-[11px]">→</span>
                  </a>
                )}
              </div>
            </div>

            {/* Clue Timeline */}
            {clues.length > 0 && (
              <div className="mt-10 pt-8 border-t border-black/5 dark:border-white/5">
                <h2 className="text-[16px] font-semibold tracking-tight text-[#1c1c1e] dark:text-[#e8e8e8] mb-5">
                  {t.case.timelineTitle}
                </h2>
                <div className="relative pl-6">
                  {/* Vertical line */}
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-black/[0.06] dark:bg-white/[0.08]" />
                  <div className="space-y-6">
                    {clues.map((clue: any) => {
                      const cluePhotos: string[] = (() => {
                        try { return JSON.parse(clue.photoUrls || "[]"); } catch { return []; }
                      })();
                      return (
                        <div key={clue.id} className="relative">
                          {/* Dot */}
                          <div className="absolute left-[-18px] top-1.5 w-[15px] h-[15px] rounded-full bg-[#c5705a]/15 dark:bg-[#c5705a]/20 border-2 border-[#c5705a] flex items-center justify-center">
                            <div className="w-[5px] h-[5px] rounded-full bg-[#c5705a]" />
                          </div>
                          <div className="rounded-xl border border-black/5 dark:border-white/5 bg-white dark:bg-[#1a1a1a] p-4">
                            <p className="text-[14px] text-[#1c1c1e]/80 dark:text-white/70 leading-relaxed">
                              {clue.content}
                            </p>
                            {cluePhotos.length > 0 && (
                              <div className="flex gap-2 mt-3 flex-wrap">
                                {cluePhotos.map((url: string, i: number) => (
                                  <img key={i} src={url} alt="" className="w-16 h-16 rounded-lg object-cover" />
                                ))}
                              </div>
                            )}
                            <div className="mt-3 text-[11px] text-[#1c1c1e]/25 dark:text-white/15">
                              {new Date(clue.createdAt).toLocaleDateString("zh-CN", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Comments */}
            <div className="mt-10 pt-8 border-t border-black/5 dark:border-white/5">
              <h2 className="text-[16px] font-semibold tracking-tight text-[#1c1c1e] dark:text-[#e8e8e8] mb-5">
                {t.case.comments}
              </h2>
              <CommentForm caseId={id} onCommentAdded={fetchComments} />
              <div className="mt-5">
                <CommentList comments={comments} />
              </div>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
      <Modal
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        className="max-w-[90vw] max-h-[90vh] p-2 bg-transparent shadow-none"
      >
        <img
          src={photos[activePhoto]}
          alt={caseData.name}
          className="max-w-full max-h-[85vh] object-contain rounded-lg"
        />
      </Modal>
      <ToastContainer />
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <span className="text-[#1c1c1e]/30 dark:text-white/20 text-[12px]">{label}</span>
      <p className="text-[14px] mt-0.5">{value || "—"}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-black/5 dark:border-white/5">
      <span className="text-[#1c1c1e]/40 dark:text-white/30">{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}

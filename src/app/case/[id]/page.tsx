"use client";

import { useState, useEffect, use } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { CommentList } from "@/components/comment/CommentList";
import { CommentForm } from "@/components/comment/CommentForm";
import { ToastContainer } from "@/components/ui/Toast";

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [caseData, setCaseData] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);

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

  useEffect(() => {
    fetchCase();
    fetchComments();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <Header />
        <main className="flex-1 py-20"><Container><p className="text-center text-[14px] text-[#1c1c1e]/30">加载中...</p></Container></main>
        <Footer />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="flex flex-col min-h-full">
        <Header />
        <main className="flex-1 py-20"><Container><p className="text-center text-[14px] text-[#1c1c1e]/30">案件不存在</p></Container></main>
        <Footer />
      </div>
    );
  }

  const photos: string[] = JSON.parse(caseData.photoUrls || "[]");

  return (
    <div className="flex flex-col min-h-full">
      <Header />
      <main className="flex-1 py-8">
        <Container>
          <div className="max-w-4xl mx-auto">
            {/* Photos */}
            {photos.length > 0 && (
              <div className="mb-8">
                <div className="rounded-2xl overflow-hidden bg-black/5 dark:bg-white/5">
                  <img
                    src={photos[activePhoto]}
                    alt={caseData.name}
                    className="w-full aspect-[4/3] md:aspect-[16/9] object-contain"
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
                  走失于 {caseData.lostDate || "未知"}
                </p>

                <div className="space-y-3 text-[14px]">
                  <InfoRow label="性别" value={caseData.gender} />
                  <InfoRow label="身高" value={caseData.height ? `${caseData.height}cm` : null} />
                  <InfoRow label="出生日期" value={caseData.birthDate} />
                </div>
              </div>

              {/* Right: Location + details */}
              <div className="md:col-span-2 space-y-5">
                <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-white dark:bg-[#1a1a1a] p-5">
                  <h3 className="text-[12px] font-medium text-[#1c1c1e]/30 dark:text-white/20 mb-3 uppercase tracking-wide">
                    走失信息
                  </h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-[14px]">
                    <InfoItem label="省份" value={caseData.lostProvince} />
                    <InfoItem label="城市" value={caseData.lostCity} />
                    <InfoItem label="区县" value={caseData.lostDistrict} />
                    <InfoItem label="走失日期" value={caseData.lostDate} />
                  </div>
                  {caseData.lostAddress && (
                    <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5">
                      <span className="text-[12px] text-[#1c1c1e]/30 dark:text-white/20">详细地址</span>
                      <p className="text-[14px] mt-0.5 text-[#1c1c1e]/70 dark:text-white/60">{caseData.lostAddress}</p>
                    </div>
                  )}
                  {caseData.feature && (
                    <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5">
                      <span className="text-[12px] text-[#1c1c1e]/30 dark:text-white/20">体貌特征</span>
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
                    查看原始来源 <span className="text-[11px]">→</span>
                  </a>
                )}
              </div>
            </div>

            {/* Comments */}
            <div className="mt-10 pt-8 border-t border-black/5 dark:border-white/5">
              <h2 className="text-[16px] font-semibold tracking-tight text-[#1c1c1e] dark:text-[#e8e8e8] mb-5">
                评论
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

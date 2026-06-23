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
        <main className="flex-1 py-10"><Container><p className="text-center text-gray-400">加载中...</p></Container></main>
        <Footer />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="flex flex-col min-h-full">
        <Header />
        <main className="flex-1 py-10"><Container><p className="text-center text-gray-400">案件不存在</p></Container></main>
        <Footer />
      </div>
    );
  }

  const photos: string[] = JSON.parse(caseData.photoUrls || "[]");

  return (
    <div className="flex flex-col min-h-full">
      <Header />
      <main className="flex-1 py-6">
        <Container>
          <div className="max-w-2xl mx-auto">
            {/* Photos */}
            {photos.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-6">
                {photos.map((url: string, i: number) => (
                  <img
                    key={i}
                    src={url}
                    alt={caseData.name}
                    className="w-full aspect-square object-cover rounded-xl"
                  />
                ))}
              </div>
            )}

            {/* Info */}
            <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
              <h1 className="text-xl font-bold mb-4">{caseData.name}</h1>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <InfoItem label="性别" value={caseData.gender} />
                <InfoItem label="身高" value={caseData.height ? `${caseData.height}cm` : null} />
                <InfoItem label="出生日期" value={caseData.birthDate} />
                <InfoItem label="走失日期" value={caseData.lostDate} />
                <InfoItem label="走失省份" value={caseData.lostProvince} />
                <InfoItem label="走失城市" value={caseData.lostCity} />
              </div>
              {caseData.lostAddress && (
                <div className="mt-3 text-sm">
                  <span className="text-gray-400">走失地址：</span>
                  <span>{caseData.lostAddress}</span>
                </div>
              )}
              {caseData.feature && (
                <div className="mt-3 text-sm">
                  <span className="text-gray-400">体貌特征：</span>
                  <span>{caseData.feature}</span>
                </div>
              )}
              {caseData.sourceUrl && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <a
                    href={caseData.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    查看原始来源 →
                  </a>
                </div>
              )}
            </div>

            {/* Comments */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="font-semibold text-lg mb-4">评论</h2>
              <CommentForm caseId={id} onCommentAdded={fetchComments} />
              <div className="mt-6">
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
      <span className="text-gray-400">{label}：</span>
      <span>{value || "未知"}</span>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function CommentForm({
  caseId,
  onCommentAdded,
}: {
  caseId: string;
  onCommentAdded: () => void;
}) {
  const [authorName, setAuthorName] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!authorName.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorName: authorName.trim(), content: content.trim() }),
      });
      if (res.ok) {
        setContent("");
        onCommentAdded();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        placeholder="你的昵称"
        value={authorName}
        onChange={(e) => setAuthorName(e.target.value)}
        className="w-full px-3.5 py-2.5 border border-black/10 dark:border-white/10 rounded-xl text-[14px] bg-white dark:bg-[#1a1a1a] text-[#1c1c1e] dark:text-[#e8e8e8] focus:outline-none focus:ring-2 focus:ring-[#c5705a]/20 transition-all duration-200 placeholder:text-[#1c1c1e]/25 dark:placeholder:text-white/20"
        maxLength={20}
      />
      <textarea
        placeholder="写下你想说的话..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full px-3.5 py-2.5 border border-black/10 dark:border-white/10 rounded-xl text-[14px] resize-none bg-white dark:bg-[#1a1a1a] text-[#1c1c1e] dark:text-[#e8e8e8] focus:outline-none focus:ring-2 focus:ring-[#c5705a]/20 transition-all duration-200 placeholder:text-[#1c1c1e]/25 dark:placeholder:text-white/20"
        rows={3}
        maxLength={500}
      />
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={submitting || !authorName.trim() || !content.trim()}>
          {submitting ? "提交中..." : "发表评论"}
        </Button>
      </div>
    </form>
  );
}

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
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        maxLength={20}
      />
      <textarea
        placeholder="写下你想说的话..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
        rows={3}
        maxLength={500}
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={submitting || !authorName.trim() || !content.trim()}>
          {submitting ? "提交中..." : "发表评论"}
        </Button>
      </div>
    </form>
  );
}

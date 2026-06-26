interface Comment {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export function CommentList({ comments }: { comments: Comment[] }) {
  if (comments.length === 0) {
    return <p className="text-[13px] text-[#1c1c1e]/25 dark:text-white/15 text-center py-10">暂无评论，来说两句吧</p>;
  }

  return (
    <div className="space-y-3">
      {comments.map((c) => (
        <div key={c.id} className="bg-black/[0.03] dark:bg-white/[0.03] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-[13px] text-[#1c1c1e] dark:text-[#e8e8e8]">{c.authorName}</span>
            <span className="text-[11px] text-[#1c1c1e]/25 dark:text-white/15">{c.createdAt}</span>
          </div>
          <p className="text-[14px] text-[#1c1c1e]/60 dark:text-white/50">{c.content}</p>
        </div>
      ))}
    </div>
  );
}

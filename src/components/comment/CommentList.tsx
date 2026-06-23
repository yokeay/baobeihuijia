interface Comment {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export function CommentList({ comments }: { comments: Comment[] }) {
  if (comments.length === 0) {
    return <p className="text-gray-400 text-sm text-center py-8">暂无评论，来说两句吧</p>;
  }

  return (
    <div className="space-y-4">
      {comments.map((c) => (
        <div key={c.id} className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{c.authorName}</span>
            <span className="text-xs text-gray-400">{c.createdAt}</span>
          </div>
          <p className="text-sm text-gray-700">{c.content}</p>
        </div>
      ))}
    </div>
  );
}

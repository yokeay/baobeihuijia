interface CaseItem {
  id: string;
  name: string;
  gender: string | null;
  lostDate: string | null;
  lostProvince: string | null;
  lostCity: string | null;
  status: string;
  source: string;
  createdAt: string;
  photoUrls: string;
}

interface ReviewQueueProps {
  cases: CaseItem[];
  onReview: (id: string, status: "approved" | "rejected") => void;
  loading?: boolean;
}

const statusLabels: Record<string, string> = {
  pending: "待审核",
  approved: "已通过",
  rejected: "已拒绝",
};

export function ReviewQueue({ cases: items, onReview, loading }: ReviewQueueProps) {
  if (loading) {
    return <p className="text-gray-400 text-sm py-8 text-center">加载中...</p>;
  }

  if (items.length === 0) {
    return <p className="text-gray-400 text-sm py-8 text-center">暂无待审核案件</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-2 px-3 font-medium text-gray-500">照片</th>
            <th className="text-left py-2 px-3 font-medium text-gray-500">姓名</th>
            <th className="text-left py-2 px-3 font-medium text-gray-500">走失地点</th>
            <th className="text-left py-2 px-3 font-medium text-gray-500">来源</th>
            <th className="text-left py-2 px-3 font-medium text-gray-500">状态</th>
            <th className="text-right py-2 px-3 font-medium text-gray-500">操作</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const photos: string[] = JSON.parse(item.photoUrls || "[]");
            return (
              <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="py-2 px-3">
                  {photos[0] && (
                    <img src={photos[0]} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  )}
                </td>
                <td className="py-2 px-3 font-medium">{item.name}</td>
                <td className="py-2 px-3 text-gray-500">
                  {[item.lostProvince, item.lostCity].filter(Boolean).join(" ") || "-"}
                </td>
                <td className="py-2 px-3 text-gray-500">
                  {item.source === "api" ? "API同步" : item.source === "user_submit" ? "用户提交" : item.source}
                </td>
                <td className="py-2 px-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    item.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                    item.status === "approved" ? "bg-green-100 text-green-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {statusLabels[item.status] || item.status}
                  </span>
                </td>
                <td className="py-2 px-3 text-right">
                  {item.status === "pending" && (
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => onReview(item.id, "approved")}
                        className="px-2 py-1 text-xs bg-green-500 text-white rounded-md hover:bg-green-600"
                      >
                        通过
                      </button>
                      <button
                        onClick={() => onReview(item.id, "rejected")}
                        className="px-2 py-1 text-xs bg-red-500 text-white rounded-md hover:bg-red-600"
                      >
                        拒绝
                      </button>
                    </div>
                  )}
                  {item.status !== "pending" && (
                    <a
                      href={`/admin/dashboard?view=${item.id}`}
                      className="text-xs text-primary hover:underline"
                    >
                      查看
                    </a>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

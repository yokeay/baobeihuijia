export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 text-center text-sm text-gray-400">
        <p className="mb-1">我好想你 - 全球失踪儿童信息聚合公益平台</p>
        <p>本平台为纯公益性质，不收取任何费用。数据来源于公开API及用户提交。</p>
        <p className="mt-2">如有线索请联系当地公安机关。本平台不支持私下联系。</p>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-300 mb-2">捐助</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">ClodHost.com 赞助服务器相关费用</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">安徽安庆太湖王震 赞助域名费用</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">安徽安庆太湖孙程鑫 提供技术支持</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

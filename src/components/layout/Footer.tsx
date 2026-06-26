export function Footer() {
  return (
    <footer className="border-t border-black/5 dark:border-white/5 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 text-center text-[13px] text-[#1c1c1e]/40 dark:text-white/30">
        <p className="mb-1 text-[#1c1c1e]/60 dark:text-white/50">我好想你 — 全球失踪儿童信息聚合公益平台</p>
        <p>本平台为纯公益性质，不收取任何费用。数据来源于公开API及用户提交。</p>
        <p className="mt-1">如有线索请联系当地公安机关。本平台不支持私下联系。</p>
        <div className="mt-5 pt-4 border-t border-black/5 dark:border-white/5">
          <p className="text-[11px] text-[#1c1c1e]/25 dark:text-white/20 mb-2">捐助</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] bg-black/5 dark:bg-white/5 text-[#1c1c1e]/40 dark:text-white/30">ClodHost.com 赞助服务器</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] bg-black/5 dark:bg-white/5 text-[#1c1c1e]/40 dark:text-white/30">安徽安庆太湖王震 赞助域名</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] bg-black/5 dark:bg-white/5 text-[#1c1c1e]/40 dark:text-white/30">安徽安庆太湖孙程鑫 技术支持</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

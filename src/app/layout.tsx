import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "宝贝回家 - 全球失踪儿童信息聚合公益平台",
  description: "助力每一个家庭团圆，全球失踪儿童信息聚合公益平台",
  keywords: ["宝贝回家", "失踪儿童", "寻人", "公益", "团圆"],
  authors: [{ name: "宝贝回家公益平台" }],
  openGraph: {
    title: "宝贝回家 - 全球失踪儿童信息聚合公益平台",
    description: "助力每一个家庭团圆",
    type: "website",
    locale: "zh_CN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="h-full bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}

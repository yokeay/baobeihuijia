import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "我好想你 - 全球失踪儿童信息聚合公益平台",
  description: "助力每一个家庭团圆，全球失踪儿童信息聚合公益平台",
  keywords: ["我好想你", "失踪儿童", "寻人", "公益", "团圆"],
  authors: [{ name: "我好想你公益平台" }],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "我好想你 - 全球失踪儿童信息聚合公益平台",
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

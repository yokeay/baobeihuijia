import type { Metadata } from "next";
import { PublicLangProvider } from "@/lib/i18n/public-context";
import { UserProvider } from "@/lib/UserContext";
import { PhoneAuthSheet } from "@/components/auth/PhoneAuthSheet";
import "./globals.css";

const BASE_URL = "https://wohaoxiangni.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "我好想你 - 全球失踪人口信息聚合公益平台",
    template: "%s - 我好想你",
  },
  description: "助力每一个家庭团圆，全球失踪人口信息聚合公益平台。聚合全球公开失踪人口数据，永久免费，让失散的家人被世界发现。",
  keywords: [
    "我好想你",
    "失踪人口",
    "寻人",
    "公益",
    "团圆",
    "走失",
    "寻亲",
    "宝贝回家",
    "失踪儿童",
    "寻找亲人",
  ],
  authors: [{ name: "我好想你公益平台" }],
  creator: "我好想你公益平台",
  publisher: "我好想你公益平台",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/logo-imu.svg", type: "image/svg+xml", sizes: "any" },
    ],
    shortcut: "/favicon.svg",
    apple: "/logo-imu.svg",
  },
  alternates: {
    canonical: BASE_URL,
    languages: {
      "zh-CN": `${BASE_URL}`,
      "en": `${BASE_URL}?lang=en`,
    },
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    alternateLocale: "en",
    url: BASE_URL,
    siteName: "我好想你",
    title: "我好想你 - 全球失踪人口信息聚合公益平台",
    description: "助力每一个家庭团圆，全球失踪人口信息聚合公益平台。聚合全球公开失踪人口数据，永久免费。",
  },
  twitter: {
    card: "summary_large_image",
    title: "我好想你 - 全球失踪人口信息聚合公益平台",
    description: "助力每一个家庭团圆，全球失踪人口信息聚合公益平台",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  // Baidu-specific
  other: {
    "baidu-site-verification": "placeholder-code",
    "renderer": "webkit",
    "X-UA-Compatible": "IE=edge,chrome=1",
    "format-detection": "telephone=no",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <head>
        {/* Baidu-specific meta */}
        <meta name="applicable-device" content="pc,mobile" />
        <meta httpEquiv="Cache-Control" content="no-siteapp" />
        <meta httpEquiv="Cache-Control" content="no-transform" />
        {/* JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "我好想你",
              alternateName: ["我好想你公益平台", "Wohaoxiangni", "IMU", "I Miss You", "imu 寻人"],
              url: BASE_URL,
              inLanguage: ["zh-CN", "zh-Hant", "en", "ja", "ko", "fr", "de"],
              description: "全球失踪人口信息聚合公益平台，助力每一个家庭团圆",
              publisher: {
                "@type": "Organization",
                name: "我好想你公益平台",
                alternateName: "IMU",
                url: BASE_URL,
                logo: `${BASE_URL}/logo-imu.svg`,
              },
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${BASE_URL}/?search={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
      </head>
      <body className="h-full bg-gray-50 text-gray-900 antialiased">
        <UserProvider><PublicLangProvider>{children}<PhoneAuthSheet /></PublicLangProvider></UserProvider>
      </body>
    </html>
  );
}

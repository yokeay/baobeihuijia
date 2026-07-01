import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
      {
        userAgent: "Baiduspider",
        allow: "/",
        disallow: ["/admin/", "/api/"],
        crawlDelay: 1,
      },
    ],
    sitemap: "https://wohaoxiangni.com/sitemap.xml",
  };
}

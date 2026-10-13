import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // /sitemap.xml is the canonical sitemap entry (robots.txt and search
  // engines point at it), but Next rejects a route file at
  // app/sitemap.xml/route.ts next to the sitemap metadata route
  // ("Conflicting route and metadata"). The index therefore lives at
  // /sitemap-index.xml and this maps the canonical URL onto it.
  async rewrites() {
    return {
      fallback: [
        { source: "/sitemap.xml", destination: "/sitemap-index.xml" },
      ],
    };
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  serverExternalPackages: ["better-sqlite3"],
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    serverComponentsHmrCache: false,
  },
};

export default nextConfig;

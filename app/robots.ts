// app/robots.ts
// 搜尋引擎索引規則。公開頁開放索引;後台/API/會員私頁與停權頁不索引。
import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://vektr.com.tw";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/member", "/suspended"],
    },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}

// app/sitemap.ts
// 網站地圖:對外公開的真功能頁(找球場、約球、法務)+ 動態球場詳情頁。
// 球場查 DB(active);若 DB 不可用則只輸出靜態頁(try/catch,不讓 build 失敗)。
// 刻意不收錄 Coming Soon 模組(shop/coach/learn/member),避免索引到薄內容。
import type { MetadataRoute } from "next";
import { pool } from "@/app/lib/db";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.vektr.com.tw";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/courts`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE}/match`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  let courtRoutes: MetadataRoute.Sitemap = [];
  try {
    const r = await pool.query(
      `SELECT id, updated_at FROM courts WHERE status = 'active' ORDER BY id LIMIT 5000`
    );
    courtRoutes = r.rows.map((c) => ({
      url: `${SITE}/courts/detail/${c.id}`,
      lastModified: c.updated_at ? new Date(c.updated_at) : now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch {
    // DB 不可用時略過動態頁,至少回傳靜態頁
  }

  return [...staticRoutes, ...courtRoutes];
}

// app/courts/cities/[city]/page.tsx
// 城市球場列表(server component,SEO 落地頁)。直接讀 DB(active courts where city=param)。
import type { Metadata } from "next";
import Link from "next/link";
import { pool } from "@/app/lib/db";

export const dynamic = "force-dynamic";

type CityCourt = {
  id: string;
  name: string;
  address: string | null;
  district: string | null;
  type: string | null;
  hourly_rate: number | null;
  rating: string | null;
  rating_count: number;
  is_verified: boolean;
};

const TYPE_LABEL: Record<string, string> = { indoor: "室內", outdoor: "室外", mixed: "混合" };

async function getCityCourts(city: string): Promise<CityCourt[]> {
  try {
    const r = await pool.query(
      `SELECT id, name, address, district, type, hourly_rate, rating, rating_count, is_verified
         FROM courts
        WHERE status = 'active' AND city = $1
        ORDER BY rating DESC NULLS LAST, rating_count DESC
        LIMIT 300`,
      [city]
    );
    return r.rows.map((c) => ({
      id: String(c.id),
      name: c.name,
      address: c.address ?? null,
      district: c.district ?? null,
      type: c.type ?? null,
      hourly_rate: c.hourly_rate ?? null,
      rating: c.rating ?? null,
      rating_count: Number(c.rating_count ?? 0),
      is_verified: !!c.is_verified,
    }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const name = decodeURIComponent(city);
  return {
    title: `${name}匹克球球場`,
    description: `${name}的匹克球(pickleball)球場列表 — 場地類型、收費、評分與地址,找到適合的球場開始約球。`,
  };
}

export default async function CityCourtsPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;
  const name = decodeURIComponent(city);
  const courts = await getCityCourts(name);

  return (
    <div className="bg-[var(--color-bg)]">
      <div className="max-w-3xl mx-auto px-6 lg:px-8 py-14">
        <Link href="/courts" className="text-sm text-[var(--color-text-muted)] hover:underline">
          ← 球場地圖
        </Link>
        <h1 className="mt-5 text-3xl font-black tracking-tight text-[var(--color-text)]">
          {name}匹克球球場
        </h1>
        <p className="mt-2 text-[var(--color-text-muted)]">
          {courts.length > 0 ? `共 ${courts.length} 個球場` : "目前尚無收錄球場"}
        </p>

        {courts.length === 0 ? (
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 text-[var(--color-text-muted)]">
            這個城市還沒有收錄球場。你可以到{" "}
            <Link href="/courts" className="text-[var(--color-primary)] underline">球場地圖</Link>{" "}
            看看附近其他球場,或透過頁尾「聯絡我們」推薦球場給我們收錄。
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4">
            {courts.map((c) => (
              <Link
                key={c.id}
                href={`/courts/detail/${c.id}`}
                className="block rounded-xl border border-slate-200 bg-white p-5 hover:border-[var(--color-primary)] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="font-bold text-lg text-[var(--color-text)]">{c.name}</div>
                  {c.is_verified && (
                    <span className="flex-shrink-0 text-[11px] font-bold text-[var(--color-primary)] border border-[var(--color-primary)] rounded px-1.5 py-0.5">
                      已認領
                    </span>
                  )}
                </div>
                <div className="mt-1.5 text-sm text-[var(--color-text-muted)] leading-relaxed">
                  {c.district ? `${c.district} · ` : ""}
                  {c.address || "地址未提供"}
                </div>
                <div className="mt-2 text-sm text-[var(--color-text-muted)]">
                  {c.rating ? `★ ${c.rating}（${c.rating_count}）` : "尚無評分"}
                  {" · "}
                  {c.type ? TYPE_LABEL[c.type] ?? c.type : "類型未定"}
                  {" · "}
                  {c.hourly_rate != null ? `NT$${c.hourly_rate}/hr` : "收費未定"}
                </div>
                <span className="mt-3 inline-block text-sm font-bold text-[var(--color-primary)]">
                  查看詳情 →
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

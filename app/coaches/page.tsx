// app/coaches/page.tsx — 教練列表(純媒合,真資料)
import type { Metadata } from "next";
import Link from "next/link";
import { listActiveCoaches } from "@/app/lib/coachesDb";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "教練媒合",
  description: "VEKTR 認證教練:依地區與專長找到適合你的匹克球教練,線上送出預約需求。",
};

export default async function CoachesPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>;
}) {
  const { city } = await searchParams;
  const coaches = await listActiveCoaches(city ?? null);

  return (
    <div className="bg-[var(--color-bg)]">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-14">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="font-mono text-xs tracking-[0.2em] uppercase text-[var(--color-text-muted)]">
              Coaches
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-[var(--color-text)]">
              找教練
            </h1>
            <p className="mt-2 text-[var(--color-text-muted)]">
              依地區與專長找到適合你的匹克球教練,線上送出預約需求,教練會與你聯繫。
            </p>
          </div>
          <Link
            href="/coaches/apply"
            className="px-4 py-2 rounded-md border border-[var(--color-primary)] text-[var(--color-primary)] font-bold text-sm whitespace-nowrap"
          >
            我是教練,申請加入
          </Link>
        </div>

        {coaches.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-[var(--color-text-muted)]">
              {city ? `「${city}」目前還沒有上架的教練。` : "教練陸續招募上架中,敬請期待。"}
            </p>
            <Link
              href="/coaches/apply"
              className="mt-4 inline-block px-5 py-2.5 rounded-md bg-[var(--color-primary)] text-white font-bold text-sm"
            >
              成為首批教練 →
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {coaches.map((c) => (
              <Link
                key={c.id}
                href={`/coaches/detail/${c.id}`}
                className="block rounded-2xl border border-slate-200 bg-white p-5 hover:border-[var(--color-primary)] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xl font-bold overflow-hidden flex-shrink-0">
                    {c.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      c.name[0]
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-lg text-[var(--color-text)]">{c.name}</div>
                    <div className="text-sm text-[var(--color-text-muted)]">
                      {[c.city, c.district].filter(Boolean).join(" ") || "地區未填"}
                      {c.dupr_rating != null ? ` · DUPR ${c.dupr_rating}` : ""}
                    </div>
                  </div>
                </div>
                {c.specialties && (
                  <div className="mt-3 text-sm text-[var(--color-text-muted)]">專長:{c.specialties}</div>
                )}
                <div className="mt-2 text-sm font-bold text-[var(--color-primary)]">
                  {c.hourly_rate != null ? `參考價 NT$${c.hourly_rate}/hr · ` : ""}查看與預約 →
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

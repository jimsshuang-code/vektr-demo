// app/coaches/detail/[id]/page.tsx — 教練個人頁(server) + 預約表單(client)
import type { Metadata } from "next";
import Link from "next/link";
import { getActiveCoach } from "@/app/lib/coachesDb";
import BookingForm from "./BookingForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const c = await getActiveCoach(Number(id));
  if (!c) return { title: "教練" };
  return {
    title: `${c.name} 教練`,
    description: `${c.name} — ${[c.city, c.specialties].filter(Boolean).join(" · ") || "VEKTR 匹克球教練"}。線上預約。`,
  };
}

export default async function CoachDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await getActiveCoach(Number(id));

  if (!c) {
    return (
      <div className="bg-[var(--color-bg)]">
        <div className="max-w-2xl mx-auto px-6 lg:px-8 py-16 text-center">
          <p className="text-[var(--color-text-muted)]">找不到這位教練,或目前未開放預約。</p>
          <Link href="/coaches" className="mt-4 inline-block text-[var(--color-primary)] font-bold underline">
            ← 回教練列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-bg)]">
      <div className="max-w-2xl mx-auto px-6 lg:px-8 py-14">
        <Link href="/coaches" className="text-sm text-[var(--color-text-muted)] hover:underline">
          ← 教練列表
        </Link>

        <div className="mt-5 flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-3xl font-bold overflow-hidden flex-shrink-0">
            {c.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              c.name[0]
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black text-[var(--color-text)]">{c.name}</h1>
            <div className="text-[var(--color-text-muted)] mt-1">
              {[c.city, c.district].filter(Boolean).join(" ") || "地區未填"}
              {c.dupr_rating != null ? ` · DUPR ${c.dupr_rating}` : ""}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          {c.specialties && (
            <Row label="專長" value={c.specialties} />
          )}
          {c.hourly_rate != null && <Row label="參考收費" value={`NT$${c.hourly_rate} / 小時(實際由雙方議定)`} />}
        </div>

        {c.bio && (
          <div className="mt-6">
            <h2 className="text-lg font-bold text-[var(--color-text)]">關於我</h2>
            <p className="mt-2 text-[var(--color-text-muted)] leading-relaxed whitespace-pre-wrap">{c.bio}</p>
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-[var(--color-text)]">預約這位教練</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1 mb-4">
            留下你的聯絡方式與需求,教練會主動與你聯繫安排。
          </p>
          <BookingForm coachId={c.id} coachName={c.name} />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="font-bold text-[var(--color-text)] w-20 flex-shrink-0">{label}</span>
      <span className="text-[var(--color-text-muted)]">{value}</span>
    </div>
  );
}

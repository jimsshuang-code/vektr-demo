// app/match/history/page.tsx — 約球紀錄(真實歷史)
import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/app/lib/currentUser";
import { myMatchHistory } from "@/app/lib/memberDb";
import { MemberShell, LoginPrompt, EmptyState } from "@/app/member/_components/MemberUI";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "約球紀錄" };

const STATUS_LABEL: Record<string, { t: string; c: string }> = {
  open: { t: "開放中", c: "#2563eb" },
  completed: { t: "已結束", c: "#64748b" },
  cancelled: { t: "已取消", c: "#dc2626" },
};
const fmt = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} (${"日一二三四五六"[d.getDay()]}) ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export default async function MatchHistoryPage() {
  const me = await getCurrentUser();
  if (!me) {
    return (
      <MemberShell title="約球紀錄" back={{ href: "/match", label: "約球總覽" }}>
        <LoginPrompt what="約球紀錄" />
      </MemberShell>
    );
  }
  const history = await myMatchHistory(me.id).catch(() => []);

  return (
    <MemberShell title="約球紀錄" back={{ href: "/match", label: "約球總覽" }}>
      {history.length === 0 ? (
        <EmptyState>
          你還沒有約球紀錄。到{" "}
          <Link href="/match" className="text-[var(--color-primary)] underline">約球</Link>{" "}
          加入或開一場球局,打完就會出現在這裡。
        </EmptyState>
      ) : (
        <div className="grid gap-3">
          {history.map((h) => {
            const st = STATUS_LABEL[h.status] ?? { t: h.status, c: "#64748b" };
            const ended = new Date(h.scheduled_at).getTime() + h.duration_min * 60000 < Date.now();
            return (
              <Link
                key={h.match_id}
                href={`/match/${h.match_id}`}
                className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-[var(--color-primary)] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="font-bold text-[var(--color-text)]">{h.title || "匹克球球局"}</div>
                  <span className="flex-shrink-0 text-[11px] font-bold rounded px-2 py-0.5" style={{ color: st.c, border: `1px solid ${st.c}33` }}>
                    {st.t}
                  </span>
                </div>
                <div className="mt-1.5 text-sm text-[var(--color-text-muted)] leading-relaxed">
                  🕐 {fmt(h.scheduled_at)}<br />
                  📍 {h.court_name || "自訂地點"}
                </div>
                <div className="mt-2 text-sm">
                  {h.my_status === "left" ? (
                    <span className="text-[var(--color-text-muted)]">已退出</span>
                  ) : h.my_rating != null ? (
                    <span className="text-amber-500 font-bold">我的評分 {"★".repeat(h.my_rating)}</span>
                  ) : ended || h.status === "completed" ? (
                    <span className="text-[var(--color-primary)] font-bold">可評分 →</span>
                  ) : (
                    <span className="text-[var(--color-text-muted)]">尚未結束</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </MemberShell>
  );
}

// app/member/friends/page.tsx — 我的球友(一起打過球的人)
import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/app/lib/currentUser";
import { myPlayPartners } from "@/app/lib/memberDb";
import { MemberShell, LoginPrompt, EmptyState } from "../_components/MemberUI";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "我的球友" };

export default async function MemberFriendsPage() {
  const me = await getCurrentUser();
  if (!me) {
    return (
      <MemberShell title="我的球友" back={{ href: "/member", label: "會員中心" }}>
        <LoginPrompt what="球友名單" />
      </MemberShell>
    );
  }
  const partners = await myPlayPartners(me.id).catch(() => []);

  return (
    <MemberShell title="我的球友" back={{ href: "/member", label: "會員中心" }}>
      {partners.length === 0 ? (
        <EmptyState>
          還沒有一起打過球的球友。到{" "}
          <Link href="/match" className="text-[var(--color-primary)] underline">約球</Link>{" "}
          加入球局,和你同場的人就會出現在這裡。
        </EmptyState>
      ) : (
        <>
          <p className="text-sm text-[var(--color-text-muted)] mb-3">
            這些是和你同場打過球的球友,依共同場次排序。
          </p>
          <div className="grid gap-2.5">
            {partners.map((p) => (
              <div
                key={p.user_id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5"
              >
                <div className="w-11 h-11 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-bold overflow-hidden flex-shrink-0">
                  {p.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    p.name?.[0] ?? "球"
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-[var(--color-text)]">{p.name || "球友"}</div>
                  <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    {p.dupr_rating != null ? `DUPR ${p.dupr_rating} · ` : ""}
                    一起打過 {p.games} 場
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </MemberShell>
  );
}

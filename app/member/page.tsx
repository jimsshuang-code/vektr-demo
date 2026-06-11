// app/member/page.tsx — 會員中心儀表板
import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/app/lib/currentUser";
import { getMyProfile, myMatchHistory, myPlayPartners } from "@/app/lib/memberDb";
import { MemberShell, LoginPrompt } from "./_components/MemberUI";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "會員中心" };

const TIER_LABEL: Record<string, string> = {
  beginner: "新手", intermediate: "進階", advanced: "高手", pro: "競技",
};

export default async function MemberPage() {
  const me = await getCurrentUser();
  if (!me) {
    return (
      <MemberShell title="會員中心">
        <LoginPrompt what="會員中心" />
      </MemberShell>
    );
  }

  const [profile, history, partners] = await Promise.all([
    getMyProfile(me.id),
    myMatchHistory(me.id).catch(() => []),
    myPlayPartners(me.id).catch(() => []),
  ]);

  const played = history.filter((h) => h.my_status === "joined").length;

  return (
    <MemberShell title="會員中心">
      {/* 個人卡 */}
      <div className="rounded-2xl bg-[var(--color-bg-dark)] text-white p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-2xl font-bold overflow-hidden">
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            profile?.name?.[0] ?? "球"
          )}
        </div>
        <div>
          <div className="text-xl font-bold">{profile?.name || "球友"}</div>
          <div className="text-slate-300 text-sm mt-0.5">
            {profile?.dupr_rating != null ? `DUPR ${profile.dupr_rating}` : "尚無 DUPR"}
            {profile?.tier ? ` · ${TIER_LABEL[profile.tier] ?? profile.tier}` : ""}
          </div>
        </div>
      </div>

      {/* 數據 */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        <Stat n={played} label="參與球局" />
        <Stat n={partners.length} label="認識球友" />
        <Stat n={partners.reduce((s, p) => s + p.games, 0)} label="共打場次" />
      </div>

      {/* 功能入口 */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Tile href="/match/history" title="約球紀錄" desc="你參與過的所有球局" />
        <Tile href="/member/level" title="我的等級" desc="DUPR 等級與說明" />
        <Tile href="/member/friends" title="我的球友" desc="一起打過球的人" />
        <Tile href="/invites" title="邀請好友" desc="推薦碼與邀請成果" />
        <Tile href="/member/orders" title="我的訂單" desc="商城訂單(即將開賣)" />
        <Tile href="/member/coaching" title="教練紀錄" desc="課程預約(即將開放)" />
      </div>
    </MemberShell>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
      <div className="text-2xl font-black text-[var(--color-text)]">{n}</div>
      <div className="text-xs text-[var(--color-text-muted)] mt-1">{label}</div>
    </div>
  );
}

function Tile({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-[var(--color-primary)] transition-colors"
    >
      <div className="font-bold text-[var(--color-text)]">{title}</div>
      <div className="text-sm text-[var(--color-text-muted)] mt-0.5">{desc}</div>
    </Link>
  );
}

// app/member/level/page.tsx — 我的等級(DUPR)
import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/app/lib/currentUser";
import { getMyProfile } from "@/app/lib/memberDb";
import { MemberShell, LoginPrompt } from "../_components/MemberUI";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "我的等級" };

const TIER_LABEL: Record<string, string> = {
  beginner: "新手", intermediate: "進階", advanced: "高手", pro: "競技",
};

export default async function MemberLevelPage() {
  const me = await getCurrentUser();
  if (!me) {
    return (
      <MemberShell title="我的等級" back={{ href: "/member", label: "會員中心" }}>
        <LoginPrompt what="等級資訊" />
      </MemberShell>
    );
  }
  const profile = await getMyProfile(me.id);
  const dupr = profile?.dupr_rating;

  return (
    <MemberShell title="我的等級" back={{ href: "/member", label: "會員中心" }}>
      <div className="rounded-2xl bg-[var(--color-bg-dark)] text-white p-8 text-center">
        <div className="text-sm text-slate-300">我的 DUPR 等級</div>
        <div className="text-5xl font-black mt-1">{dupr != null ? dupr : "—"}</div>
        <div className="text-slate-300 text-sm mt-2">
          {profile?.tier ? TIER_LABEL[profile.tier] ?? profile.tier : "尚未評級"}
        </div>
      </div>

      {dupr == null && (
        <div className="mt-5 rounded-xl border border-slate-200 bg-[var(--color-bg-muted)] p-5 text-sm text-[var(--color-text-muted)] leading-relaxed">
          你還沒有 DUPR 等級。多參與約球、賽後互評,系統會逐步建立你的球技評分。先到{" "}
          <Link href="/match" className="text-[var(--color-primary)] underline">約球</Link>{" "}找場次加入吧。
        </div>
      )}

      <div className="mt-6 space-y-3 text-[var(--color-text-muted)] leading-relaxed">
        <h2 className="text-lg font-bold text-[var(--color-text)]">DUPR 是什麼?</h2>
        <p>
          DUPR(Dynamic Universal Pickleball Rating)是國際通用的匹克球動態評分,範圍約
          2.0–8.0,依你與不同對手的實際比賽結果動態調整。數字越接近,代表程度越相近。
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>2.0–3.0</strong> 入門到初階</li>
          <li><strong>3.0–4.0</strong> 中階,能穩定來回</li>
          <li><strong>4.0–5.0</strong> 進階,戰術成熟</li>
          <li><strong>5.0+</strong> 競技/職業水準</li>
        </ul>
        <p className="text-sm">
          想更了解分級與賽事,看{" "}
          <Link href="/learn/events" className="text-[var(--color-primary)] underline">學習中心 · 賽事與分級</Link>。
        </p>
      </div>
    </MemberShell>
  );
}

// app/member/coaching/page.tsx — 我的課程(教練預約未上線,誠實空狀態)
import type { Metadata } from "next";
import Link from "next/link";
import { MemberShell, EmptyState } from "../_components/MemberUI";

export const metadata: Metadata = { title: "我的課程" };

export default function MemberCoachingPage() {
  return (
    <MemberShell title="我的課程" back={{ href: "/member", label: "會員中心" }}>
      <EmptyState>
        你還沒有課程紀錄。{" "}
        <Link href="/coaches" className="text-[var(--color-primary)] underline">教練媒合</Link>{" "}
        即將上線,預約課程後,你的上課紀錄與教練筆記會整理在這裡。
      </EmptyState>
    </MemberShell>
  );
}

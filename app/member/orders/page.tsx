// app/member/orders/page.tsx — 我的訂單(商城未開賣,誠實空狀態)
import type { Metadata } from "next";
import Link from "next/link";
import { MemberShell, EmptyState } from "../_components/MemberUI";

export const metadata: Metadata = { title: "我的訂單" };

export default function MemberOrdersPage() {
  return (
    <MemberShell title="我的訂單" back={{ href: "/member", label: "會員中心" }}>
      <EmptyState>
        你目前沒有任何訂單。VEKTR{" "}
        <Link href="/shop" className="text-[var(--color-primary)] underline">商城</Link>{" "}
        正在籌備中,開賣後你的購買與試打預約紀錄會出現在這裡。
      </EmptyState>
    </MemberShell>
  );
}

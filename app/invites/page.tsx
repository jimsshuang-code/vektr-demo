// app/invites/page.tsx
// 球友端「我邀了幾人」頁(server component)。顯示自己的推薦碼、邀請連結與已邀來的球友。
// 資料:推薦碼以 withUser(me.id) 讀自身;邀來名單走 SECURITY DEFINER my_referral_stats(me.id)。
import Link from "next/link";
import { getCurrentUser } from "@/app/lib/currentUser";
import { withUser } from "@/app/lib/matchDb";
import { pool } from "@/app/lib/db";
import InviteActionsClient from "./InviteActions";

export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://vektr.com.tw";
const C = { navy: "#1e3a8a", ink: "#0f172a", lime: "#65a30d", limeBg: "#f7fee7", txt2: "#64748b", line: "#e2e8f0", bg: "#f8fafc" };

type Invitee = { user_id: number; name: string | null; joined_at: string };

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

export default async function InvitesPage() {
  const me = await getCurrentUser();

  if (!me) {
    return (
      <Shell>
        <div style={{ textAlign: "center", color: C.txt2, padding: "40px 0" }}>
          <p style={{ fontSize: 15, marginBottom: 16 }}>請先以 LINE 登入,才能看到你的邀請成果。</p>
          <Link href="/match" style={{ color: C.navy, fontWeight: 700, textDecoration: "underline" }}>
            前往約球登入
          </Link>
        </div>
      </Shell>
    );
  }

  let referralCode: string | null = null;
  let invitees: Invitee[] = [];
  let loadError: string | null = null;
  try {
    referralCode = await withUser(me.id, async (c) => {
      const r = await c.query("SELECT referral_code FROM users WHERE id = $1", [me.id]);
      return (r.rows[0]?.referral_code as string | null) ?? null;
    });
    const r = await pool.query("SELECT * FROM my_referral_stats($1)", [me.id]);
    invitees = r.rows.map((x) => ({
      user_id: Number(x.user_id),
      name: x.name ?? null,
      joined_at: new Date(x.joined_at).toISOString(),
    }));
  } catch (e) {
    loadError = e instanceof Error ? e.message : String(e);
  }

  const shareUrl = referralCode ? `${SITE}/match?ref=${referralCode}` : `${SITE}/match`;

  return (
    <Shell>
      {/* 邀請數大卡 */}
      <div style={{ background: C.navy, color: "#fff", borderRadius: 16, padding: "24px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 14, opacity: 0.85 }}>你已成功邀請</div>
        <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.1, margin: "6px 0" }}>{invitees.length}</div>
        <div style={{ fontSize: 14, opacity: 0.85 }}>位球友加入 VEKTR</div>
      </div>

      {/* 推薦碼 + 分享 */}
      <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 16, padding: 18, marginTop: 14 }}>
        <div style={{ fontSize: 13, color: C.txt2 }}>你的推薦碼</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.ink, fontFamily: "ui-monospace, monospace", letterSpacing: 1, marginTop: 2 }}>
          {referralCode || "—"}
        </div>
        <p style={{ fontSize: 13, color: C.txt2, marginTop: 8, lineHeight: 1.7 }}>
          把下面的連結分享給朋友,他們透過你的連結加入並以 LINE 登入後,就會算進你的邀請成果。
        </p>
        <InviteActionsClient shareUrl={shareUrl} />
      </div>

      {/* 邀來名單 */}
      <h2 style={{ fontSize: 15, fontWeight: 800, color: C.ink, margin: "22px 0 10px" }}>邀來的球友</h2>
      {loadError ? (
        <div style={{ padding: 16, border: "1px solid #fecaca", background: "#fef2f2", borderRadius: 10, color: "#dc2626", fontSize: 14 }}>
          載入失敗:{loadError}
          <div style={{ marginTop: 6, color: "#7f1d1d", fontSize: 13 }}>若顯示找不到函式,請先套用 007 與 009 migration。</div>
        </div>
      ) : invitees.length === 0 ? (
        <div style={{ padding: 20, border: `1px solid ${C.line}`, background: C.bg, borderRadius: 12, fontSize: 14, color: C.txt2 }}>
          還沒有人透過你的連結加入。分享你的邀請連結,揪朋友一起打球吧!
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {invitees.map((p) => (
            <div key={p.user_id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12, padding: "12px 14px" }}>
              <span style={{ fontWeight: 700, color: C.ink, fontSize: 14.5 }}>{p.name || "球友"}</span>
              <span style={{ fontSize: 12.5, color: C.txt2 }}>{fmtDate(p.joined_at)} 加入</span>
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "-apple-system, 'Noto Sans TC', sans-serif" }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "20px 16px 80px" }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: C.ink, margin: "0 0 16px" }}>邀請好友 · 我的成果</h1>
        {children}
      </div>
    </div>
  );
}

// app/admin/page.tsx — 後台首頁儀表板(真功能,列出可用模組 + 待處理數)
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/app/lib/rbac";
import { adminListCoaches, adminListBookings } from "@/app/lib/coachesDb";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const guard = await requireAdmin("members");
  if (!guard.ok) {
    if (guard.status === 401) redirect("/admin/login");
    return <div style={{ padding: 24, color: "#dc2626" }}>沒有權限。</div>;
  }

  // 待處理摘要(失敗不影響頁面)
  let pendingCoaches = 0;
  let newBookings = 0;
  try {
    const [coaches, bookings] = await Promise.all([adminListCoaches("pending"), adminListBookings()]);
    pendingCoaches = coaches.length;
    newBookings = bookings.filter((b) => b.status === "new").length;
  } catch {
    /* ignore */
  }

  const cards = [
    { href: "/admin/courts", title: "球場管理", desc: "新增、編輯、認領與上下架球場" },
    { href: "/admin/matches", title: "約球檢舉", desc: "檢舉審核與球友停權管理" },
    { href: "/admin/coaches", title: "教練管理", desc: "教練申請審核與學員預約", badge: pendingCoaches + newBookings },
    { href: "/admin/referrals", title: "推薦成長", desc: "推薦碼歸因排行與成長數據" },
  ];

  const soon = ["會員管理", "商品管理", "訂單管理", "權限管理", "系統設定"];

  return (
    <div style={{ fontFamily: "Inter, 'Noto Sans TC', sans-serif", color: "#0a1929" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>管理後台</h1>
      <p style={{ fontSize: 13, color: "#4a5a6e", margin: "0 0 20px" }}>
        歡迎,{guard.email || "管理員"}({guard.role})
      </p>

      {(pendingCoaches > 0 || newBookings > 0) && (
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          {pendingCoaches > 0 && <Pill text={`${pendingCoaches} 位教練待審核`} href="/admin/coaches" />}
          {newBookings > 0 && <Pill text={`${newBookings} 筆新預約需求`} href="/admin/coaches" />}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
        {cards.map((c) => (
          <Link key={c.href} href={c.href} style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 800, fontSize: 16 }}>{c.title}</span>
              {c.badge ? (
                <span style={{ background: "#dc2626", color: "#fff", fontSize: 12, fontWeight: 800, borderRadius: 999, padding: "2px 8px", minWidth: 20, textAlign: "center" }}>
                  {c.badge}
                </span>
              ) : null}
            </div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>{c.desc}</div>
            <div style={{ fontSize: 13, color: "#1e3a8a", fontWeight: 700, marginTop: 12 }}>進入 →</div>
          </Link>
        ))}
      </div>

      <h2 style={{ fontSize: 14, fontWeight: 800, margin: "28px 0 10px", color: "#64748b" }}>即將開放</h2>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {soon.map((s) => (
          <span key={s} style={{ fontSize: 13, color: "#94a3b8", border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 12px" }}>
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

const card: React.CSSProperties = {
  display: "block",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: 18,
  background: "#fff",
  textDecoration: "none",
  color: "#0a1929",
};

function Pill({ text, href }: { text: string; href: string }) {
  return (
    <Link href={href} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fef9c3", color: "#854d0e", borderRadius: 999, padding: "8px 14px", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
      ● {text}
    </Link>
  );
}

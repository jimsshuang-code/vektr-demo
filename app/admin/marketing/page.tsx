// app/admin/marketing/page.tsx — 行銷後台:公告/橫幅(server,rbac content)
import { redirect } from "next/navigation";
import { requireAdmin } from "@/app/lib/rbac";
import { adminListAnnouncements, type Announcement } from "@/app/lib/marketingDb";
import MarketingAdmin from "./MarketingAdmin";

export const dynamic = "force-dynamic";

export default async function AdminMarketingPage() {
  const guard = await requireAdmin("content", { write: true });
  if (!guard.ok) {
    if (guard.status === 401) redirect("/admin/login");
    return <div style={{ padding: 24, color: "#dc2626" }}>沒有權限檢視行銷管理(需 editor 以上)。</div>;
  }

  let rows: Announcement[] = [];
  let loadError: string | null = null;
  try {
    rows = await adminListAnnouncements();
  } catch (e) {
    loadError = e instanceof Error ? e.message : String(e);
  }

  return (
    <div style={{ fontFamily: "Inter, 'Noto Sans TC', sans-serif", color: "#0a1929" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>行銷管理</h1>
      <p style={{ fontSize: 13, color: "#4a5a6e", margin: "0 0 20px" }}>MARKETING · 站台公告 / 橫幅(顯示在全站頂部)</p>
      {loadError ? (
        <div style={{ padding: 16, border: "1px solid #fecaca", background: "#fef2f2", borderRadius: 8, color: "#dc2626", fontSize: 14 }}>
          載入失敗:{loadError}
          <div style={{ marginTop: 6, color: "#7f1d1d", fontSize: 13 }}>若顯示找不到資料表,請先套用 014_marketing.sql。</div>
        </div>
      ) : (
        <MarketingAdmin rows={rows} />
      )}
    </div>
  );
}

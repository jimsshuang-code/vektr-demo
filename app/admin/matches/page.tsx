// app/admin/matches/page.tsx
// A2 -- Admin 檢舉佇列 (server component)。
// 守衛: rbac.requireAdmin('members', { write:true }) -> 僅 super_admin/admin。
// 資料: adminListReports() 走 SECURITY DEFINER admin_list_reports(admin_users.id)。

import { redirect } from "next/navigation";
import { requireAdmin } from "@/app/lib/rbac";
import { adminListReports, type AdminReportRow } from "@/app/lib/reportsDb";
import ReportQueue from "./ReportQueue";

export const dynamic = "force-dynamic";

export default async function AdminMatchesPage() {
  const guard = await requireAdmin("members", { write: true });
  if (!guard.ok) {
    if (guard.status === 401) redirect("/admin/login");
    return (
      <div style={{ padding: 24, color: "#dc2626" }}>沒有權限檢視檢舉佇列(需 admin 或 super_admin)。</div>
    );
  }

  let rows: AdminReportRow[] = [];
  let loadError: string | null = null;
  try {
    rows = await adminListReports(Number(guard.adminId), null);
  } catch (e) {
    loadError = e instanceof Error ? e.message : String(e);
  }

  return (
    <div style={{ fontFamily: "Inter, 'Noto Sans TC', sans-serif", color: "#0a1929" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>檢舉佇列</h1>
      <p style={{ fontSize: 13, color: "#4a5a6e", margin: "0 0 20px" }}>MATCH 模組 · 檢舉審核與停權管理</p>

      {loadError ? (
        <div style={{ padding: 16, border: "1px solid #fecaca", background: "#fef2f2", borderRadius: 8, color: "#dc2626", fontSize: 14 }}>
          載入失敗:{loadError}
        </div>
      ) : (
        <ReportQueue initialRows={rows} />
      )}
    </div>
  );
}

// app/admin/coaches/page.tsx — 後台教練審核 + 預約檢視(server,rbac)
import { redirect } from "next/navigation";
import { requireAdmin } from "@/app/lib/rbac";
import { adminListCoaches, adminListBookings, type AdminCoach, type Booking } from "@/app/lib/coachesDb";
import CoachAdmin from "./CoachAdmin";

export const dynamic = "force-dynamic";

export default async function AdminCoachesPage() {
  const guard = await requireAdmin("coaches", { write: true });
  if (!guard.ok) {
    if (guard.status === 401) redirect("/admin/login");
    return <div style={{ padding: 24, color: "#dc2626" }}>沒有權限檢視教練管理(需 admin 或 super_admin)。</div>;
  }

  let coaches: AdminCoach[] = [];
  let bookings: Booking[] = [];
  let loadError: string | null = null;
  try {
    [coaches, bookings] = await Promise.all([adminListCoaches(null), adminListBookings()]);
  } catch (e) {
    loadError = e instanceof Error ? e.message : String(e);
  }

  return (
    <div style={{ fontFamily: "Inter, 'Noto Sans TC', sans-serif", color: "#0a1929" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>教練管理</h1>
      <p style={{ fontSize: 13, color: "#4a5a6e", margin: "0 0 20px" }}>COACH 模組 · 申請審核與預約需求(純媒合,無金流)</p>
      {loadError ? (
        <div style={{ padding: 16, border: "1px solid #fecaca", background: "#fef2f2", borderRadius: 8, color: "#dc2626", fontSize: 14 }}>
          載入失敗:{loadError}
          <div style={{ marginTop: 6, color: "#7f1d1d", fontSize: 13 }}>若顯示找不到資料表,請先套用 011_coaches.sql。</div>
        </div>
      ) : (
        <CoachAdmin coaches={coaches} bookings={bookings} />
      )}
    </div>
  );
}

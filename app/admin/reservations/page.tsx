// app/admin/reservations/page.tsx — 後台球場預約接單(server,rbac)
import { redirect } from "next/navigation";
import { requireAdmin } from "@/app/lib/rbac";
import { adminListReservations, type Reservation } from "@/app/lib/reservationsDb";
import ReservationAdmin from "./ReservationAdmin";

export const dynamic = "force-dynamic";

export default async function AdminReservationsPage() {
  const guard = await requireAdmin("courts", { write: true });
  if (!guard.ok) {
    if (guard.status === 401) redirect("/admin/login");
    return <div style={{ padding: 24, color: "#dc2626" }}>沒有權限檢視球場預約。</div>;
  }

  let rows: Reservation[] = [];
  let loadError: string | null = null;
  try {
    rows = await adminListReservations(null);
  } catch (e) {
    loadError = e instanceof Error ? e.message : String(e);
  }

  return (
    <div style={{ fontFamily: "Inter, 'Noto Sans TC', sans-serif", color: "#0a1929" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>球場預約</h1>
      <p style={{ fontSize: 13, color: "#4a5a6e", margin: "0 0 20px" }}>COURT 模組 · 代球場端接單(現場付款,無線上金流)</p>
      {loadError ? (
        <div style={{ padding: 16, border: "1px solid #fecaca", background: "#fef2f2", borderRadius: 8, color: "#dc2626", fontSize: 14 }}>
          載入失敗:{loadError}
          <div style={{ marginTop: 6, color: "#7f1d1d", fontSize: 13 }}>若顯示找不到資料表,請先套用 012_reservations.sql。</div>
        </div>
      ) : (
        <ReservationAdmin rows={rows} />
      )}
    </div>
  );
}

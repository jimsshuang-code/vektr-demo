"use client";
// 後台教練審核 + 預約檢視(client 動作)。
import { useState } from "react";
import type { AdminCoach, Booking } from "@/app/lib/coachesDb";

const STATUS_LABEL: Record<string, string> = { pending: "待審核", active: "已上架", rejected: "已退回" };

export default function CoachAdmin({ coaches, bookings }: { coaches: AdminCoach[]; bookings: Booking[] }) {
  const [rows, setRows] = useState(coaches);
  const [busy, setBusy] = useState<number | null>(null);

  async function setStatus(id: number, status: string) {
    setBusy(id);
    try {
      const r = await fetch(`/api/v1/admin/coaches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (r.ok) setRows((s) => s.map((c) => (c.id === id ? { ...c, status } : c)));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div style={{ fontFamily: "Inter, 'Noto Sans TC', sans-serif", color: "#0a1929" }}>
      <h2 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 10px" }}>教練申請與上架</h2>
      {rows.length === 0 ? (
        <Empty>目前沒有教練資料。</Empty>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {rows.map((c) => (
            <div key={c.id} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div>
                  <span style={{ fontWeight: 800 }}>{c.name}</span>
                  <span style={{ marginLeft: 8, fontSize: 12, padding: "2px 8px", borderRadius: 10, background: c.status === "active" ? "#dcfce7" : c.status === "pending" ? "#fef9c3" : "#fee2e2", color: "#334155" }}>
                    {STATUS_LABEL[c.status] ?? c.status}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {c.status !== "active" && (
                    <button disabled={busy === c.id} onClick={() => setStatus(c.id, "active")} style={btn("#16a34a")}>核准上架</button>
                  )}
                  {c.status !== "rejected" && (
                    <button disabled={busy === c.id} onClick={() => setStatus(c.id, "rejected")} style={btn("#dc2626")}>退回</button>
                  )}
                </div>
              </div>
              <div style={{ fontSize: 13, color: "#475569", marginTop: 6, lineHeight: 1.7 }}>
                {[c.city, c.district].filter(Boolean).join(" ")}{c.dupr_rating != null ? ` · DUPR ${c.dupr_rating}` : ""}{c.hourly_rate != null ? ` · NT$${c.hourly_rate}/hr` : ""}<br />
                專長:{c.specialties || "—"}<br />
                <span style={{ color: "#0a7" }}>聯絡:{c.contact}</span>
                {c.bio ? <><br />{c.bio}</> : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ fontSize: 16, fontWeight: 800, margin: "28px 0 10px" }}>學員預約需求</h2>
      {bookings.length === 0 ? (
        <Empty>目前沒有預約需求。</Empty>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {bookings.map((b) => (
            <div key={b.id} style={card}>
              <div style={{ fontWeight: 700 }}>
                {b.student_name} → 教練 {b.coach_name || `#${b.coach_id}`}
              </div>
              <div style={{ fontSize: 13, color: "#475569", marginTop: 4, lineHeight: 1.7 }}>
                聯絡:{b.student_contact}{b.preferred_time ? ` · 希望時段:${b.preferred_time}` : ""}<br />
                {b.message ? `「${b.message}」` : null}
                <br /><span style={{ color: "#94a3b8", fontSize: 12 }}>{new Date(b.created_at).toLocaleString("zh-TW")}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const card: React.CSSProperties = { border: "1px solid #e2e8f0", borderRadius: 10, padding: 14, background: "#fff" };
function btn(color: string): React.CSSProperties {
  return { background: color, color: "#fff", border: "none", padding: "7px 12px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" };
}
function Empty({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: 16, border: "1px solid #e2e8f0", background: "#f8fafc", borderRadius: 8, fontSize: 14, color: "#64748b" }}>{children}</div>;
}

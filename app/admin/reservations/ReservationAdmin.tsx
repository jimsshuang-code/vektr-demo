"use client";
// 後台球場預約接單(代球場端)。接受/婉拒。
import { useState } from "react";
import type { Reservation } from "@/app/lib/reservationsDb";

const LABEL: Record<string, string> = { pending: "待確認", confirmed: "已確認", declined: "已婉拒", cancelled: "已取消" };
const COLOR: Record<string, string> = { pending: "#fef9c3", confirmed: "#dcfce7", declined: "#fee2e2", cancelled: "#f1f5f9" };

export default function ReservationAdmin({ rows }: { rows: Reservation[] }) {
  const [list, setList] = useState(rows);
  const [busy, setBusy] = useState<number | null>(null);

  async function setStatus(id: number, status: string) {
    setBusy(id);
    try {
      const r = await fetch(`/api/v1/admin/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (r.ok) setList((s) => s.map((x) => (x.id === id ? { ...x, status } : x)));
    } finally {
      setBusy(null);
    }
  }

  if (list.length === 0) {
    return <div style={{ padding: 16, border: "1px solid #e2e8f0", background: "#f8fafc", borderRadius: 8, fontSize: 14, color: "#64748b" }}>目前沒有球場預約。</div>;
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {list.map((r) => (
        <div key={r.id} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 14, background: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div>
              <span style={{ fontWeight: 800 }}>{r.court_name || `球場 #${r.court_id}`}</span>
              <span style={{ marginLeft: 8, fontSize: 12, padding: "2px 8px", borderRadius: 10, background: COLOR[r.status] ?? "#f1f5f9", color: "#334155" }}>
                {LABEL[r.status] ?? r.status}
              </span>
            </div>
            {r.status === "pending" && (
              <div style={{ display: "flex", gap: 8 }}>
                <button disabled={busy === r.id} onClick={() => setStatus(r.id, "confirmed")} style={btn("#16a34a")}>接受</button>
                <button disabled={busy === r.id} onClick={() => setStatus(r.id, "declined")} style={btn("#dc2626")}>婉拒</button>
              </div>
            )}
          </div>
          <div style={{ fontSize: 13, color: "#475569", marginTop: 6, lineHeight: 1.7 }}>
            {r.reserve_date} · {r.time_slot}{r.party_size != null ? ` · ${r.party_size} 人` : ""}<br />
            預約人:{r.contact_name} · <span style={{ color: "#0a7" }}>{r.contact}</span>
            {r.note ? <><br />備註:{r.note}</> : null}
            <br /><span style={{ color: "#94a3b8", fontSize: 12 }}>{new Date(r.created_at).toLocaleString("zh-TW")}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function btn(color: string): React.CSSProperties {
  return { background: color, color: "#fff", border: "none", padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" };
}

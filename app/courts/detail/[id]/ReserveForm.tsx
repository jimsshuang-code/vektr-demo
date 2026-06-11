"use client";
// 球場線上預約表單(現場付款,平台記錄 + 後台確認)。
import { useState } from "react";

export default function ReserveForm({ courtId, courtName }: { courtId: number; courtName: string }) {
  const [f, setF] = useState({ contact_name: "", contact: "", reserve_date: "", time_slot: "", party_size: "", note: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const r = await fetch(`/api/v1/courts/${courtId}/reserve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const j = await r.json();
      if (!r.ok) setErr(j.error ?? "送出失敗");
      else setDone(true);
    } catch {
      setErr("送出失敗,請稍後再試");
    }
    setBusy(false);
  }

  const input: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14, boxSizing: "border-box" };

  if (done) {
    return (
      <div style={{ border: "1px solid #bef264", background: "#f7fee7", borderRadius: 12, padding: 16, fontSize: 14, color: "#0f172a" }}>
        已送出對「{courtName}」的預約需求,球場確認後會以你留的聯絡方式通知你。費用現場支付。
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <label style={{ fontSize: 13, fontWeight: 700 }}>日期 *<input type="date" style={input} value={f.reserve_date} onChange={set("reserve_date")} required /></label>
        <label style={{ fontSize: 13, fontWeight: 700 }}>時段 *<input style={input} placeholder="如 19:00-21:00" value={f.time_slot} onChange={set("time_slot")} required maxLength={100} /></label>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <label style={{ fontSize: 13, fontWeight: 700 }}>人數<input type="number" min="1" style={input} placeholder="如 4" value={f.party_size} onChange={set("party_size")} /></label>
        <label style={{ fontSize: 13, fontWeight: 700 }}>稱呼 *<input style={input} value={f.contact_name} onChange={set("contact_name")} required maxLength={100} /></label>
      </div>
      <label style={{ fontSize: 13, fontWeight: 700 }}>聯絡方式(LINE / 電話)*<input style={input} value={f.contact} onChange={set("contact")} required maxLength={200} /></label>
      <label style={{ fontSize: 13, fontWeight: 700 }}>備註<textarea style={input} rows={2} value={f.note} onChange={set("note")} maxLength={2000} placeholder="需求、租借球具等" /></label>
      {err && <p style={{ color: "#dc2626", fontSize: 13, margin: 0 }}>{err}</p>}
      <button type="submit" disabled={busy} style={{ background: "#1e3a8a", color: "#fff", border: "none", padding: "12px", borderRadius: 10, fontWeight: 800, fontSize: 15, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
        {busy ? "送出中…" : "送出預約需求"}
      </button>
      <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>平台僅做預約媒合,費用現場向球場支付;球場確認後預約才成立。</p>
    </form>
  );
}

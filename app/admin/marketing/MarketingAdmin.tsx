"use client";
// 後台行銷:公告/橫幅管理(建立、啟用切換、刪除)。
import { useState } from "react";
import type { Announcement } from "@/app/lib/marketingDb";

export default function MarketingAdmin({ rows }: { rows: Announcement[] }) {
  const [list, setList] = useState(rows);
  const [f, setF] = useState({ title: "", link_url: "", link_label: "", priority: "0", starts_at: "", ends_at: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/v1/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, priority: Number(f.priority) || 0 }),
      });
      const j = await r.json();
      if (!r.ok) setErr(j.error ?? "建立失敗");
      else {
        location.reload();
      }
    } catch {
      setErr("建立失敗");
    }
    setBusy(false);
  }

  async function toggle(id: number, active: boolean) {
    const r = await fetch(`/api/v1/admin/announcements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    if (r.ok) setList((s) => s.map((a) => (a.id === id ? { ...a, active } : a)));
  }

  async function remove(id: number) {
    if (!confirm("確定刪除這則公告?")) return;
    const r = await fetch(`/api/v1/admin/announcements/${id}`, { method: "DELETE" });
    if (r.ok) setList((s) => s.filter((a) => a.id !== id));
  }

  const input: React.CSSProperties = { width: "100%", padding: "9px 11px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14, boxSizing: "border-box" };

  return (
    <div style={{ fontFamily: "Inter, 'Noto Sans TC', sans-serif", color: "#0a1929" }}>
      {/* 新增公告 */}
      <form onSubmit={create} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, background: "#fff", display: "grid", gap: 10, marginBottom: 24 }}>
        <div style={{ fontWeight: 800 }}>新增公告</div>
        <label style={{ fontSize: 13, fontWeight: 700 }}>公告文字 *<input style={input} value={f.title} onChange={set("title")} required maxLength={200} placeholder="如:VEKTR 正式上線,揪球友打球趣!" /></label>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
          <label style={{ fontSize: 13, fontWeight: 700 }}>連結網址<input style={input} value={f.link_url} onChange={set("link_url")} placeholder="/match" maxLength={300} /></label>
          <label style={{ fontSize: 13, fontWeight: 700 }}>連結文字<input style={input} value={f.link_label} onChange={set("link_label")} placeholder="看詳情" maxLength={50} /></label>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <label style={{ fontSize: 13, fontWeight: 700 }}>優先序<input style={input} type="number" value={f.priority} onChange={set("priority")} /></label>
          <label style={{ fontSize: 13, fontWeight: 700 }}>開始(選填)<input style={input} type="datetime-local" value={f.starts_at} onChange={set("starts_at")} /></label>
          <label style={{ fontSize: 13, fontWeight: 700 }}>結束(選填)<input style={input} type="datetime-local" value={f.ends_at} onChange={set("ends_at")} /></label>
        </div>
        {err && <p style={{ color: "#dc2626", fontSize: 13, margin: 0 }}>{err}</p>}
        <button type="submit" disabled={busy} style={{ background: "#1e3a8a", color: "#fff", border: "none", padding: "10px", borderRadius: 8, fontWeight: 800, cursor: "pointer", justifySelf: "start", paddingInline: 20 }}>
          {busy ? "建立中…" : "建立公告"}
        </button>
      </form>

      {/* 公告列表 */}
      <div style={{ fontWeight: 800, marginBottom: 10 }}>所有公告</div>
      {list.length === 0 ? (
        <div style={{ padding: 16, border: "1px solid #e2e8f0", background: "#f8fafc", borderRadius: 8, fontSize: 14, color: "#64748b" }}>還沒有公告。上方建立第一則,會顯示在全站頂部橫幅。</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {list.map((a) => (
            <div key={a.id} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 14, background: "#fff", display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div>
                <span style={{ fontWeight: 700 }}>{a.title}</span>
                {a.link_url && <span style={{ color: "#64748b", fontSize: 13 }}> → {a.link_url}</span>}
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                  優先序 {a.priority}{a.starts_at ? ` · 起 ${a.starts_at.slice(0, 16).replace("T", " ")}` : ""}{a.ends_at ? ` · 迄 ${a.ends_at.slice(0, 16).replace("T", " ")}` : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => toggle(a.id, !a.active)} style={{ background: a.active ? "#dcfce7" : "#f1f5f9", color: a.active ? "#166534" : "#64748b", border: "none", padding: "7px 12px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  {a.active ? "啟用中" : "已停用"}
                </button>
                <button onClick={() => remove(a.id)} style={{ background: "#fff", color: "#dc2626", border: "1px solid #fecaca", padding: "7px 12px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>刪除</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

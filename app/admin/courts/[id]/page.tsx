"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Court = {
  id: string; name: string; address: string; city: string | null; district: string | null;
  type: string | null; numCourts: number | null; hourlyRate: number | null;
  phone: string | null; partnerStatus: string; commissionRate: string | number;
  dataSource: string; isVerified: boolean; status: string; googlePlaceId: string | null;
  rating: string | number | null; ratingCount: number;
};

export default function CourtEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [court, setCourt] = useState<Court | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // 可編輯欄位的本地狀態
  const [form, setForm] = useState({
    type: "", numCourts: "", hourlyRate: "", phone: "", partnerStatus: "",
  });

  async function load() {
    setLoading(true);
    const r = await fetch(`/api/admin/courts/${id}`);
    if (!r.ok) { setLoading(false); return; }
    const j = await r.json();
    const c = j.data as Court;
    setCourt(c);
    setForm({
      type: c.type ?? "",
      numCourts: c.numCourts?.toString() ?? "",
      hourlyRate: c.hourlyRate?.toString() ?? "",
      phone: c.phone ?? "",
      partnerStatus: c.partnerStatus ?? "basic",
    });
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  async function save() {
    setSaving(true);
    setMsg(null);
    const body: Record<string, unknown> = {
      type: form.type || null,
      numCourts: form.numCourts === "" ? null : Number(form.numCourts),
      hourlyRate: form.hourlyRate === "" ? null : Number(form.hourlyRate),
      phone: form.phone || null,
      partnerStatus: form.partnerStatus,
    };
    const r = await fetch(`/api/admin/courts/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (r.ok) { setMsg("已儲存 ✓"); load(); }
    else { const j = await r.json().catch(() => ({})); setMsg("儲存失敗：" + (j.message ?? r.status)); }
  }

  async function toggleVerify() {
    if (!court) return;
    await fetch(`/api/admin/courts/${id}/verify`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isVerified: !court.isVerified }),
    });
    load();
  }

  async function setStatus(next: string) {
    await fetch(`/api/admin/courts/${id}/status`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    load();
  }

  if (loading) return <div>載入中…</div>;
  if (!court) return <div>找不到這筆球場。<a href="/admin/courts" style={{ color: "#0d8a66" }}>返回列表</a></div>;

  return (
    <div style={{ maxWidth: 640 }}>
      <a href="/admin/courts" style={{ color: "#0d8a66", textDecoration: "none", fontSize: 13 }}>← 返回列表</a>
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: "12px 0 4px" }}>{court.name}</h1>
      <div style={{ color: "#7a8a9e", fontSize: 13, marginBottom: 20 }}>
        {court.address}　·　{court.city ?? ""} {court.district ?? ""}
      </div>

      {/* 唯讀資訊 */}
      <div style={card}>
        <Row label="資料來源" value={court.dataSource} />
        <Row label="Google Place ID" value={court.googlePlaceId ?? "—"} />
        <Row label="評分" value={`${court.rating ?? "—"}（${court.ratingCount} 則）`} />
        <Row label="目前狀態" value={court.status} />
        <Row label="認證" value={court.isVerified ? "已認證 ✓" : "未認證"} />
      </div>

      {/* 可編輯（BD 補欄） */}
      <h2 style={{ fontSize: 15, fontWeight: 600, margin: "24px 0 12px" }}>BD 補欄</h2>
      <div style={card}>
        <Field label="類型">
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={input}>
            <option value="">未分類</option>
            <option value="indoor">indoor 室內</option>
            <option value="outdoor">outdoor 室外</option>
            <option value="mixed">mixed 混合</option>
          </select>
        </Field>
        <Field label="球場面數">
          <input type="number" value={form.numCourts} onChange={(e) => setForm({ ...form, numCourts: e.target.value })} style={input} />
        </Field>
        <Field label="每小時收費">
          <input type="number" value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} style={input} />
        </Field>
        <Field label="電話">
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={input} />
        </Field>
        <Field label="合作狀態">
          <select value={form.partnerStatus} onChange={(e) => setForm({ ...form, partnerStatus: e.target.value })} style={input}>
            <option value="basic">basic 一般收錄</option>
            <option value="partner">partner 合作</option>
            <option value="flagship">flagship 旗艦</option>
          </select>
        </Field>

        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 16 }}>
          <button onClick={save} disabled={saving} style={btnPrimary}>{saving ? "儲存中…" : "儲存"}</button>
          {msg && <span style={{ fontSize: 13, color: msg.startsWith("已儲存") ? "#0d8a66" : "#dc2626" }}>{msg}</span>}
        </div>
      </div>

      {/* 狀態 / 認證操作 */}
      <h2 style={{ fontSize: 15, fontWeight: 600, margin: "24px 0 12px" }}>狀態操作</h2>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={toggleVerify} style={btnGhost}>{court.isVerified ? "取消認證" : "標記認證"}</button>
        {court.status !== "rejected"
          ? <button onClick={() => setStatus("rejected")} style={btnDanger}>標記剔除</button>
          : <button onClick={() => setStatus("active")} style={btnGhost}>恢復上架</button>}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", padding: "8px 0", borderBottom: "1px solid #eef2f7", fontSize: 14 }}>
      <div style={{ width: 160, color: "#7a8a9e" }}>{label}</div>
      <div style={{ color: "#0a1929" }}>{value}</div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "8px 0", fontSize: 14 }}>
      <div style={{ width: 160, color: "#7a8a9e" }}>{label}</div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

const card: React.CSSProperties = { background: "#fff", border: "1px solid #e1e8ef", borderRadius: 12, padding: "8px 20px" };
const input: React.CSSProperties = { width: "100%", height: 36, padding: "0 10px", border: "1px solid #e1e8ef", borderRadius: 8, fontSize: 14, color: "#0a1929", boxSizing: "border-box" };
const btnPrimary: React.CSSProperties = { height: 40, padding: "0 20px", background: "#14b88a", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" };
const btnGhost: React.CSSProperties = { height: 40, padding: "0 16px", border: "1px solid #e1e8ef", borderRadius: 8, background: "#fff", cursor: "pointer", color: "#4a5a6e", fontSize: 14 };
const btnDanger: React.CSSProperties = { height: 40, padding: "0 16px", border: "1px solid #f3c0c0", borderRadius: 8, background: "#fff", cursor: "pointer", color: "#dc2626", fontSize: 14 };

"use client";

import { useCallback, useEffect, useState } from "react";

type Court = {
  id: string; name: string; address: string; city: string | null;
  type: string | null; numCourts: number | null; hourlyRate: number | null;
  partnerStatus: string; dataSource: string; isVerified: boolean;
  status: string; googlePlaceId: string | null;
};
type ListResp = { data: Court[]; total: number; page: number; limit: number; totalPages: number };

export default function AdminCourtsPage() {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [status, setStatus] = useState("");
  const [needsCleanup, setNeedsCleanup] = useState(false);
  const [page, setPage] = useState(1);
  const [resp, setResp] = useState<ListResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/admin/courts/cities")
      .then((r) => r.json())
      .then((j) => setCities(j.cities ?? []))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (city) sp.set("city", city);
    if (status) sp.set("status", status);
    sp.set("page", String(page));
    sp.set("limit", "20");
    const r = await fetch(`/api/admin/courts?${sp.toString()}`);
    const j = (await r.json()) as ListResp;
    setResp(j);
    setLoading(false);
  }, [q, city, status, page]);

  useEffect(() => { load(); }, [load]);

  async function setCourtStatus(id: string, next: string) {
    await fetch(`/api/admin/courts/${id}/status`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    load();
  }
  async function toggleVerify(id: string, next: boolean) {
    await fetch(`/api/admin/courts/${id}/verify`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isVerified: next }),
    });
    load();
  }

  const rows = (resp?.data ?? []).filter((c) => (needsCleanup ? c.type === null : true));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>球場管理</h1>
        <a href="/admin/courts/claims" style={{ fontSize: 13, padding: "7px 14px", borderRadius: 7, background: "#1e3a8a", color: "#fff", textDecoration: "none", fontWeight: 700 }}>球場審核(認領/上架/檢舉)</a>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <input placeholder="搜尋名稱 / 地址" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} style={ctrl} />
        <select value={city} onChange={(e) => { setPage(1); setCity(e.target.value); }} style={ctrl}>
          <option value="">全部縣市</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} style={ctrl}>
          <option value="">全部狀態</option>
          <option value="active">上架中</option>
          <option value="hidden">已隱藏</option>
          <option value="rejected">已剔除</option>
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#4a5a6e" }}>
          <input type="checkbox" checked={needsCleanup} onChange={(e) => setNeedsCleanup(e.target.checked)} />
          待清雜訊（未分類 type）
        </label>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e1e8ef", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f1f4f8", textAlign: "left", color: "#4a5a6e" }}>
              <th style={th}>名稱</th><th style={th}>縣市</th><th style={th}>類型</th>
              <th style={th}>面數</th><th style={th}>收費</th><th style={th}>認證</th>
              <th style={th}>狀態</th><th style={th}>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td style={td} colSpan={8}>載入中…</td></tr>}
            {!loading && rows.length === 0 && <tr><td style={td} colSpan={8}>無資料</td></tr>}
            {!loading && rows.map((c) => (
              <tr key={c.id} style={{ borderTop: "1px solid #eef2f7" }}>
                <td style={td}><a href={`/admin/courts/${c.id}`} style={{ color: "#0d8a66", textDecoration: "none" }}>{c.name}</a></td>
                <td style={td}>{c.city ?? "—"}</td>
                <td style={td}>{c.type ?? <span style={{ color: "#b0bcca" }}>未分類</span>}</td>
                <td style={td}>{c.numCourts ?? "—"}</td>
                <td style={td}>{c.hourlyRate ?? "—"}</td>
                <td style={td}>{c.isVerified ? "✓" : "—"}</td>
                <td style={td}><StatusBadge status={c.status} /></td>
                <td style={td}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {c.status !== "rejected"
                      ? <button style={btnDanger} onClick={() => setCourtStatus(c.id, "rejected")}>剔除</button>
                      : <button style={btnGhost} onClick={() => setCourtStatus(c.id, "active")}>恢復</button>}
                    <button style={btnGhost} onClick={() => toggleVerify(c.id, !c.isVerified)}>{c.isVerified ? "取消認證" : "認證"}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {resp && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, fontSize: 13 }}>
          <button style={btnGhost} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>上一頁</button>
          <span>{resp.page} / {resp.totalPages}（共 {resp.total} 筆）</span>
          <button style={btnGhost} disabled={page >= resp.totalPages} onClick={() => setPage((p) => p + 1)}>下一頁</button>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    active: { bg: "#e6f7f1", fg: "#0d8a66", label: "上架中" },
    hidden: { bg: "#fdf6e3", fg: "#d4a017", label: "已隱藏" },
    rejected: { bg: "#fdecec", fg: "#dc2626", label: "已剔除" },
  };
  const s = map[status] ?? { bg: "#f1f4f8", fg: "#4a5a6e", label: status };
  return <span style={{ background: s.bg, color: s.fg, padding: "2px 8px", borderRadius: 999, fontSize: 12 }}>{s.label}</span>;
}

const ctrl: React.CSSProperties = { height: 36, padding: "0 10px", border: "1px solid #e1e8ef", borderRadius: 8, fontSize: 13, color: "#0a1929" };
const th: React.CSSProperties = { padding: "10px 12px", fontWeight: 600 };
const td: React.CSSProperties = { padding: "10px 12px", verticalAlign: "middle" };
const btnGhost: React.CSSProperties = { fontSize: 12, padding: "4px 10px", border: "1px solid #e1e8ef", borderRadius: 6, background: "#fff", cursor: "pointer", color: "#4a5a6e" };
const btnDanger: React.CSSProperties = { fontSize: 12, padding: "4px 10px", border: "1px solid #f3c0c0", borderRadius: 6, background: "#fff", cursor: "pointer", color: "#dc2626" };

"use client";
// 後台:場主認領審核 / 場主自建球場上架 / 被檢舉的球友媒體下架。
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Claim = { id: string; court_id: string; court_name: string; city: string | null; user_name: string | null; note: string | null; data_source: string };
type PendingCourt = { id: string; name: string; city: string | null; address: string; owner_name: string | null };
type Reported = { id: string; court_id: string; court_name: string; kind: string; url: string; report_count: number; status: string; uploader_name: string | null };

export default function CourtClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [pending, setPending] = useState<PendingCourt[]>([]);
  const [reported, setReported] = useState<Reported[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/v1/admin/court-claims");
    if (r.ok) { const j = await r.json(); setClaims(j.claims ?? []); setPending(j.pendingCourts ?? []); setReported(j.reportedMedia ?? []); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function decideClaim(id: string, action: "approve" | "reject") {
    await fetch(`/api/v1/admin/court-claims/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    load();
  }
  async function setCourtStatus(id: string, status: string) {
    await fetch(`/api/admin/courts/${id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    load();
  }
  async function media(id: string, action: "remove" | "restore") {
    await fetch(`/api/v1/admin/court-media/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    load();
  }

  return (
    <div style={{ fontFamily: "Inter,'Noto Sans TC',sans-serif", color: "#0a1929" }}>
      <Link href="/admin/courts" style={{ color: "#0d8a66", fontSize: 13, textDecoration: "none" }}>← 球場列表</Link>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: "10px 0 4px" }}>球場審核</h1>
      <p style={{ fontSize: 13, color: "#4a5a6e", margin: "0 0 20px" }}>場主認領 · 自建球場上架 · 球友媒體檢舉處理</p>
      {loading && <p>載入中…</p>}

      <H>場主認領申請（{claims.length}）</H>
      {claims.length === 0 ? <Empty /> : claims.map((c) => (
        <Card key={c.id}>
          <div style={{ flex: 1 }}>
            <b>{c.court_name}</b> <span style={muted}>{c.city ?? ""}</span><br />
            <span style={{ fontSize: 13 }}>申請人:{c.user_name ?? "—"}</span>
            {c.note && <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>備註:{c.note}</div>}
          </div>
          <button onClick={() => decideClaim(c.id, "approve")} style={ok}>核准</button>
          <button onClick={() => decideClaim(c.id, "reject")} style={no}>駁回</button>
        </Card>
      ))}

      <H>場主自建球場待上架（{pending.length}）</H>
      {pending.length === 0 ? <Empty /> : pending.map((c) => (
        <Card key={c.id}>
          <div style={{ flex: 1 }}>
            <b>{c.name}</b> <span style={muted}>{c.city ?? ""}</span><br />
            <span style={{ fontSize: 13, color: "#64748b" }}>{c.address}　·　場主:{c.owner_name ?? "—"}</span>
          </div>
          <Link href={`/admin/courts/${c.id}`} style={{ ...ghost, textDecoration: "none" }}>檢視</Link>
          <button onClick={() => setCourtStatus(c.id, "active")} style={ok}>上架</button>
          <button onClick={() => setCourtStatus(c.id, "rejected")} style={no}>剔除</button>
        </Card>
      ))}

      <H>被檢舉的球友媒體（{reported.length}）</H>
      {reported.length === 0 ? <Empty /> : reported.map((m) => (
        <Card key={m.id}>
          <a href={m.url} target="_blank" rel="noreferrer" style={{ width: 64, height: 64, borderRadius: 8, overflow: "hidden", background: "#000", flexShrink: 0 }}>
            {m.kind === "photo"
              ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={m.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ color: "#fff", fontSize: 11, padding: 6 }}>影片</div>}
          </a>
          <div style={{ flex: 1 }}>
            <b>{m.court_name}</b><br />
            <span style={{ fontSize: 13, color: "#dc2626" }}>被檢舉 {m.report_count} 次</span>
            <span style={{ fontSize: 13, color: "#64748b" }}>　· 上傳者:{m.uploader_name ?? "—"} · {m.status === "removed" ? "已下架" : "顯示中"}</span>
          </div>
          {m.status === "removed"
            ? <button onClick={() => media(m.id, "restore")} style={ghost}>復原</button>
            : <button onClick={() => media(m.id, "remove")} style={no}>下架</button>}
        </Card>
      ))}
    </div>
  );
}

function H({ children }: { children: React.ReactNode }) { return <h2 style={{ fontSize: 15, fontWeight: 700, margin: "26px 0 10px" }}>{children}</h2>; }
function Empty() { return <p style={{ color: "#94a3b8", fontSize: 14 }}>目前沒有。</p>; }
function Card({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 10, border: "1px solid #e1e8ef", borderRadius: 10, padding: 12, background: "#fff", marginBottom: 8 }}>{children}</div>;
}
const muted: React.CSSProperties = { color: "#94a3b8", fontSize: 13 };
const ok: React.CSSProperties = { padding: "7px 14px", border: "none", borderRadius: 7, background: "#14b88a", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" };
const no: React.CSSProperties = { padding: "7px 14px", border: "1px solid #f3c0c0", borderRadius: 7, background: "#fff", color: "#dc2626", fontWeight: 700, fontSize: 13, cursor: "pointer" };
const ghost: React.CSSProperties = { padding: "7px 14px", border: "1px solid #e1e8ef", borderRadius: 7, background: "#fff", color: "#4a5a6e", fontWeight: 700, fontSize: 13, cursor: "pointer" };

"use client";
// 場主專區:我的球場、認領現有球場、新增全新球場。
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type MyCourt = { id: string; name: string; city: string | null; status: string; owner_status: string; cover_image_url: string | null };
type Hit = { id: string; name: string; city: string | null };

export default function OwnerCourtsPage() {
  const [mine, setMine] = useState<MyCourt[]>([]);
  const [authed, setAuthed] = useState(true);
  const [tab, setTab] = useState<"mine" | "claim" | "new">("mine");

  const loadMine = useCallback(async () => {
    const r = await fetch("/api/v1/owner/courts");
    if (r.status === 401) { setAuthed(false); return; }
    if (r.ok) setMine((await r.json()).courts ?? []);
  }, []);
  useEffect(() => { loadMine(); }, [loadMine]);

  if (!authed) {
    return (
      <Shell>
        <p style={{ color: "#475569" }}>請先登入才能管理球場。</p>
        <Link href="/login?callbackUrl=/member/courts" style={linkBtn}>前往登入</Link>
      </Shell>
    );
  }

  return (
    <Shell>
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        <Tab on={tab === "mine"} onClick={() => setTab("mine")}>我的球場</Tab>
        <Tab on={tab === "claim"} onClick={() => setTab("claim")}>認領現有球場</Tab>
        <Tab on={tab === "new"} onClick={() => setTab("new")}>新增球場</Tab>
      </div>

      {tab === "mine" && <MineList mine={mine} reload={loadMine} />}
      {tab === "claim" && <ClaimPanel onDone={loadMine} />}
      {tab === "new" && <NewCourtPanel onDone={() => { setTab("mine"); loadMine(); }} />}
    </Shell>
  );
}

function MineList({ mine, reload }: { mine: MyCourt[]; reload: () => void }) {
  if (mine.length === 0) return <p style={{ color: "#94a3b8" }}>你還沒有管理的球場。可「認領現有球場」或「新增球場」。</p>;
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <button onClick={reload} style={{ ...linkBtn, alignSelf: "flex-start", background: "#fff", color: "#1e3a8a", border: "1px solid #1e3a8a" }}>重新整理</button>
      {mine.map((c) => (
        <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, background: "#fff" }}>
          <div style={{ width: 64, height: 48, borderRadius: 8, background: "#eef2f7", overflow: "hidden", flexShrink: 0 }}>
            {c.cover_image_url && /* eslint-disable-next-line @next/next/no-img-element */ <img src={c.cover_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700 }}>{c.name}</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>
              {c.city ?? ""} · {statusLabel(c.status, c.owner_status)}
            </div>
          </div>
          {c.owner_status === "approved" ? (
            <Link href={`/member/courts/${c.id}`} style={linkBtn}>管理</Link>
          ) : (
            <span style={{ fontSize: 13, color: "#d4a017" }}>審核中</span>
          )}
        </div>
      ))}
    </div>
  );
}

function statusLabel(courtStatus: string, ownerStatus: string) {
  if (ownerStatus === "pending") return "認領審核中";
  if (courtStatus === "pending") return "球場待管理員上架";
  if (courtStatus === "active") return "已上架";
  return courtStatus;
}

function ClaimPanel({ onDone }: { onDone: () => void }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [msg, setMsg] = useState("");
  async function search() {
    setMsg("");
    const r = await fetch(`/api/v1/courts?q=${encodeURIComponent(q)}&limit=20`);
    if (r.ok) { const j = await r.json(); setHits((j.courts ?? j.data ?? []).map((c: { id: string; name: string; city: string | null }) => ({ id: String(c.id), name: c.name, city: c.city }))); }
  }
  async function claim(id: string) {
    const r = await fetch(`/api/v1/courts/${id}/claim`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    setMsg(r.ok ? "已送出認領申請,待管理員核准" : (await r.json()).error ?? "申請失敗");
    if (r.ok) onDone();
  }
  return (
    <div>
      <p style={{ fontSize: 13, color: "#64748b" }}>搜尋你的球場,送出認領申請。核准後即可上傳封面、相片與影片。</p>
      <div style={{ display: "flex", gap: 8, margin: "8px 0 14px" }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} placeholder="球場名稱 / 城市" style={input} />
        <button onClick={search} style={linkBtn}>搜尋</button>
      </div>
      {msg && <p style={{ fontSize: 13, color: "#475569" }}>{msg}</p>}
      <div style={{ display: "grid", gap: 8 }}>
        {hits.map((h) => (
          <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 10, border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 12px", background: "#fff" }}>
            <div style={{ flex: 1 }}><b>{h.name}</b> <span style={{ color: "#94a3b8", fontSize: 13 }}>{h.city ?? ""}</span></div>
            <button onClick={() => claim(h.id)} style={linkBtn}>認領</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewCourtPanel({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({ name: "", address: "", city: "", district: "", phone: "", type: "", hourly_rate: "", num_courts: "" });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));
  async function submit() {
    setMsg(""); if (!f.name || !f.address) { setMsg("名稱與地址必填"); return; }
    setBusy(true);
    const r = await fetch("/api/v1/owner/courts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    setBusy(false);
    if (r.ok) { setMsg("已提交,待管理員審核上架"); onDone(); }
    else setMsg((await r.json()).error ?? "提交失敗");
  }
  return (
    <div style={{ display: "grid", gap: 10, maxWidth: 480 }}>
      <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>資料庫沒有你的球場?填表新增,審核通過後上架。</p>
      <L label="球場名稱 *"><input style={input} value={f.name} onChange={(e) => set("name", e.target.value)} /></L>
      <L label="地址 *"><input style={input} value={f.address} onChange={(e) => set("address", e.target.value)} /></L>
      <div style={{ display: "flex", gap: 10 }}>
        <L label="城市"><input style={input} value={f.city} onChange={(e) => set("city", e.target.value)} placeholder="台北市" /></L>
        <L label="行政區"><input style={input} value={f.district} onChange={(e) => set("district", e.target.value)} /></L>
      </div>
      <L label="電話"><input style={input} value={f.phone} onChange={(e) => set("phone", e.target.value)} /></L>
      <div style={{ display: "flex", gap: 10 }}>
        <L label="每小時收費"><input style={input} type="number" value={f.hourly_rate} onChange={(e) => set("hourly_rate", e.target.value)} /></L>
        <L label="球場面數"><input style={input} type="number" value={f.num_courts} onChange={(e) => set("num_courts", e.target.value)} /></L>
      </div>
      {msg && <p style={{ fontSize: 13, color: "#475569" }}>{msg}</p>}
      <button onClick={submit} disabled={busy} style={{ ...linkBtn, opacity: busy ? 0.5 : 1 }}>{busy ? "提交中…" : "提交新增"}</button>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 18px 80px", fontFamily: "-apple-system,'Noto Sans TC',sans-serif" }}>
      <Link href="/member" style={{ color: "#0a7", fontSize: 14 }}>← 會員中心</Link>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: "10px 0 16px" }}>場主專區</h1>
      {children}
    </div>
  );
}
function Tab({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} style={{ padding: "8px 14px", borderRadius: 999, fontSize: 14, fontWeight: 700, cursor: "pointer", border: `1.5px solid ${on ? "#1e3a8a" : "#cbd5e1"}`, background: on ? "#1e3a8a" : "#fff", color: on ? "#fff" : "#475569" }}>{children}</button>;
}
function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={{ flex: 1, display: "block" }}><div style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 4 }}>{label}</div>{children}</label>;
}
const input: React.CSSProperties = { width: "100%", padding: "9px 11px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14, boxSizing: "border-box" };
const linkBtn: React.CSSProperties = { display: "inline-block", padding: "8px 16px", borderRadius: 8, background: "#1e3a8a", color: "#fff", fontSize: 14, fontWeight: 700, textDecoration: "none", border: "none", cursor: "pointer" };

"use client";
// 場主編輯自己球場:封面 / 相簿 / 影片 + 基本資料。
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

function resize(file: File, maxDim = 1280): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image(); const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        const s = Math.min(1, maxDim / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        const ctx = c.getContext("2d"); if (!ctx) return reject(new Error("無法處理圖片"));
        ctx.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => reject(new Error("圖片讀取失敗")); img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("檔案讀取失敗")); reader.readAsDataURL(file);
  });
}
async function uploadImg(file: File): Promise<string> {
  const dataUrl = await resize(file);
  const r = await fetch("/api/v1/courts/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataUrl }) });
  const j = await r.json(); if (!r.ok) throw new Error(j.error ?? "上傳失敗"); return j.url;
}

export default function OwnerCourtEdit() {
  const { id } = useParams<{ id: string }>();
  const [name, setName] = useState("");
  const [cover, setCover] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [video, setVideo] = useState("");
  const [phone, setPhone] = useState("");
  const [rate, setRate] = useState("");
  const [num, setNum] = useState("");
  const [status, setStatus] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch(`/api/v1/owner/courts/${id}`);
    if (r.status === 403) { setErr("你不是這個球場的場主。"); return; }
    if (r.status === 401) { setErr("請先登入。"); return; }
    if (!r.ok) { setErr("載入失敗"); return; }
    const c = (await r.json()).court;
    setName(c.name); setCover(c.cover_image_url ?? null);
    setPhotos(Array.isArray(c.photos) ? c.photos.filter(Boolean) : []);
    setVideo(c.video_url ?? ""); setPhone(c.phone ?? "");
    setRate(c.hourly_rate?.toString() ?? ""); setNum(c.num_courts?.toString() ?? "");
    setStatus(c.status);
  }, [id]);
  useEffect(() => { load(); }, [load]);

  async function onCover(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; e.target.value = ""; if (!f) return;
    setBusy(true); setMsg(""); try { setCover(await uploadImg(f)); } catch (x) { setMsg(x instanceof Error ? x.message : "上傳失敗"); } setBusy(false);
  }
  async function onPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []); e.target.value = ""; if (!files.length) return;
    setBusy(true); setMsg("");
    try { const urls: string[] = []; for (const f of files.slice(0, 12)) urls.push(await uploadImg(f)); setPhotos((p) => [...p, ...urls].slice(0, 12)); }
    catch (x) { setMsg(x instanceof Error ? x.message : "上傳失敗"); }
    setBusy(false);
  }
  async function save() {
    setBusy(true); setMsg("");
    const r = await fetch(`/api/v1/owner/courts/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cover_image_url: cover, photos, video_url: video.trim() || null, phone, hourly_rate: rate, num_courts: num }),
    });
    setBusy(false);
    setMsg(r.ok ? "已儲存 ✓" : "儲存失敗");
  }

  if (err) return <Shell><p style={{ color: "#dc2626" }}>{err}</p><Link href="/member/courts" style={{ color: "#0a7" }}>← 返回場主專區</Link></Shell>;

  return (
    <Shell>
      <Link href="/member/courts" style={{ color: "#0a7", fontSize: 14 }}>← 場主專區</Link>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: "10px 0 4px" }}>{name}</h1>
      <p style={{ fontSize: 13, color: status === "active" ? "#0d8a66" : "#d4a017", marginTop: 0 }}>
        {status === "active" ? "已上架" : "待管理員審核上架"}
      </p>

      <Section title="封面圖(16:9)">
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div style={{ width: 200, aspectRatio: "16/9", borderRadius: 8, overflow: "hidden", background: "#eef2f7", flexShrink: 0 }}>
            {cover && /* eslint-disable-next-line @next/next/no-img-element */ <img src={cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={ghost}>{cover ? "更換封面" : "上傳封面"}<input type="file" accept="image/*" onChange={onCover} style={{ display: "none" }} /></label>
            {cover && <button onClick={() => setCover(null)} style={danger}>移除封面</button>}
          </div>
        </div>
      </Section>

      <Section title="場館照片(最多 12 張)">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px,1fr))", gap: 8 }}>
          {photos.map((p, i) => (
            <div key={i} style={{ position: "relative", aspectRatio: "1/1", borderRadius: 8, overflow: "hidden", background: "#eef2f7" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button onClick={() => setPhotos((a) => a.filter((_, j) => j !== i))} style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%", border: "none", background: "rgba(0,0,0,.6)", color: "#fff", cursor: "pointer" }}>×</button>
            </div>
          ))}
          {photos.length < 12 && <label style={{ aspectRatio: "1/1", borderRadius: 8, border: "1.5px dashed #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: 13, cursor: "pointer" }}>＋ 加照片<input type="file" accept="image/*" multiple onChange={onPhotos} style={{ display: "none" }} /></label>}
        </div>
      </Section>

      <Section title="介紹影片(YouTube 連結或 .mp4 網址)">
        <input value={video} onChange={(e) => setVideo(e.target.value)} placeholder="https://youtu.be/..." style={input} />
      </Section>

      <Section title="基本資料">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Field label="電話"><input style={input} value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
          <Field label="每小時收費"><input style={input} type="number" value={rate} onChange={(e) => setRate(e.target.value)} /></Field>
          <Field label="球場面數"><input style={input} type="number" value={num} onChange={(e) => setNum(e.target.value)} /></Field>
        </div>
      </Section>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 16 }}>
        <button onClick={save} disabled={busy} style={{ ...ghost, background: "#1e3a8a", color: "#fff", border: "none" }}>{busy ? "處理中…" : "儲存"}</button>
        {msg && <span style={{ fontSize: 13, color: msg.includes("✓") ? "#0d8a66" : "#dc2626" }}>{msg}</span>}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 18px 80px", fontFamily: "-apple-system,'Noto Sans TC',sans-serif" }}>{children}</div>;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div style={{ marginTop: 22 }}><h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 10px" }}>{title}</h2>{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={{ flex: 1, minWidth: 120 }}><div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>{label}</div>{children}</label>;
}
const input: React.CSSProperties = { width: "100%", padding: "9px 11px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14, boxSizing: "border-box" };
const ghost: React.CSSProperties = { display: "inline-block", textAlign: "center", padding: "9px 16px", borderRadius: 8, border: "1.5px solid #1e3a8a", background: "#fff", color: "#1e3a8a", fontSize: 14, fontWeight: 700, cursor: "pointer" };
const danger: React.CSSProperties = { padding: "9px 16px", borderRadius: 8, border: "1px solid #fecaca", background: "#fff", color: "#dc2626", fontSize: 14, fontWeight: 700, cursor: "pointer" };

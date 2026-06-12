"use client";
// 球友分享:登入球友可上傳照片/影片(先顯示、可檢舉),顯示在球場詳情頁。
import { useCallback, useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";

type Item = {
  id: string; kind: "photo" | "video"; url: string;
  user_id: string | null; uploader_name: string | null; mine: boolean;
};

function ytEmbed(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

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

export default function CommunityMedia({ courtId }: { courtId: number }) {
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [ytOpen, setYtOpen] = useState(false);
  const [yt, setYt] = useState("");
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const r = await fetch(`/api/v1/courts/${courtId}/media`);
    if (r.ok) setItems((await r.json()).media ?? []);
  }, [courtId]);
  useEffect(() => { load(); }, [load]);

  function need(e: unknown) {
    const m = e instanceof Error ? e.message : "操作失敗";
    if (/401|登入|unauth/i.test(m)) { setMsg("請先登入再上傳"); return; }
    setMsg(m);
  }
  async function addRecord(kind: "photo" | "video", url: string) {
    const r = await fetch(`/api/v1/courts/${courtId}/media`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, url }),
    });
    if (r.status === 401) { setMsg("請先登入再上傳"); return; }
    if (!r.ok) { setMsg((await r.json()).error ?? "上傳失敗"); return; }
    setMsg(""); load();
  }

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; e.target.value = ""; if (!f) return;
    setBusy(true); setMsg("");
    try {
      const dataUrl = await resize(f);
      const up = await fetch("/api/v1/courts/upload", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataUrl }),
      });
      if (up.status === 401) { setMsg("請先登入再上傳"); setBusy(false); return; }
      const j = await up.json(); if (!up.ok) { setMsg(j.error ?? "上傳失敗"); setBusy(false); return; }
      await addRecord("photo", j.url);
    } catch (err) { need(err); }
    setBusy(false);
  }

  async function onVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; e.target.value = ""; if (!f) return;
    if (f.size > 50 * 1024 * 1024) { setMsg("影片請小於 50MB(或改貼 YouTube 連結)"); return; }
    setBusy(true); setMsg("上傳影片中…");
    try {
      const blob = await upload(f.name, f, { access: "public", handleUploadUrl: "/api/v1/blob/upload" });
      await addRecord("video", blob.url);
    } catch (err) { need(err); }
    setBusy(false);
  }

  async function submitYt() {
    if (!yt.trim()) return;
    setBusy(true); await addRecord("video", yt.trim()); setYt(""); setYtOpen(false); setBusy(false);
  }

  async function report(id: string) {
    if (!confirm("檢舉這則分享給管理員?")) return;
    const r = await fetch(`/api/v1/courts/media/${id}/report`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    if (r.status === 401) { setMsg("請先登入再檢舉"); return; }
    setMsg(r.ok ? "已送出檢舉,謝謝" : "檢舉失敗"); load();
  }

  return (
    <div style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 18 }}>球友分享</h2>
      <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 12px" }}>
        實際打球的照片/影片由球友提供,內容由上傳者負責。不當內容請按「檢舉」。
      </p>

      {/* 上傳列 */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <button type="button" onClick={() => photoRef.current?.click()} disabled={busy} style={btn}>＋ 照片</button>
        <button type="button" onClick={() => videoRef.current?.click()} disabled={busy} style={btn}>＋ 影片檔</button>
        <button type="button" onClick={() => setYtOpen((v) => !v)} disabled={busy} style={btn}>＋ YouTube 連結</button>
        <input ref={photoRef} type="file" accept="image/*" onChange={onPhoto} style={{ display: "none" }} />
        <input ref={videoRef} type="file" accept="video/*" onChange={onVideo} style={{ display: "none" }} />
      </div>
      {ytOpen && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input value={yt} onChange={(e) => setYt(e.target.value)} placeholder="貼上 YouTube 連結" style={{ flex: 1, padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14 }} />
          <button onClick={submitYt} disabled={busy} style={{ ...btn, background: "#1e3a8a", color: "#fff", border: "none" }}>送出</button>
        </div>
      )}
      {msg && <p style={{ fontSize: 13, color: "#475569", margin: "0 0 10px" }}>{msg}</p>}

      {/* 內容 */}
      {items.length === 0 ? (
        <p style={{ fontSize: 14, color: "#94a3b8" }}>還沒有球友分享,當第一個吧!</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
          {items.map((it) => {
            const emb = it.kind === "video" ? ytEmbed(it.url) : null;
            return (
              <div key={it.id} style={{ position: "relative", borderRadius: 10, overflow: "hidden", background: "#000", aspectRatio: "1 / 1" }}>
                {it.kind === "photo" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.url} alt={it.uploader_name ?? "球友分享"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : emb ? (
                  <iframe src={emb} title="影片" style={{ width: "100%", height: "100%", border: 0 }} allowFullScreen />
                ) : (
                  <video src={it.url} controls style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
                {!it.mine && (
                  <button onClick={() => report(it.id)} title="檢舉"
                    style={{ position: "absolute", top: 6, right: 6, border: "none", background: "rgba(0,0,0,.55)", color: "#fff", borderRadius: 6, fontSize: 11, padding: "3px 7px", cursor: "pointer" }}>檢舉</button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const btn: React.CSSProperties = { padding: "8px 14px", borderRadius: 999, fontSize: 14, fontWeight: 600, cursor: "pointer", border: "1.5px solid #1e3a8a", background: "#fff", color: "#1e3a8a" };

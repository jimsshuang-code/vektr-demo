"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Court = {
  id: string; name: string; address: string; city: string | null; district: string | null;
  type: string | null; numCourts: number | null; hourlyRate: number | null;
  phone: string | null; partnerStatus: string; commissionRate: string | number;
  dataSource: string; isVerified: boolean; status: string; googlePlaceId: string | null;
  rating: string | number | null; ratingCount: number;
  coverImageUrl: string | null; videoUrl: string | null; photos: string[] | null;
};

// 前端壓縮圖片(最長邊 1280px、JPEG),回 dataURL。
function resizeToDataUrl(file: File, maxDim = 1280): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("無法處理圖片"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => reject(new Error("圖片讀取失敗"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("檔案讀取失敗"));
    reader.readAsDataURL(file);
  });
}

async function uploadCourtImage(file: File): Promise<string> {
  const dataUrl = await resizeToDataUrl(file);
  const r = await fetch("/api/v1/admin/courts/upload", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataUrl }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error ?? "上傳失敗");
  return j.url as string;
}

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

  // 媒體:封面 / 相簿 / 影片
  const [cover, setCover] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [mediaBusy, setMediaBusy] = useState(false);
  const [mediaMsg, setMediaMsg] = useState<string | null>(null);

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
    setCover(c.coverImageUrl ?? null);
    setPhotos(Array.isArray(c.photos) ? c.photos.filter(Boolean) : []);
    setVideoUrl(c.videoUrl ?? "");
    setLoading(false);
  }

  async function saveMedia() {
    setMediaBusy(true);
    setMediaMsg(null);
    const r = await fetch(`/api/admin/courts/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coverImageUrl: cover, photos, videoUrl: videoUrl.trim() || null }),
    });
    setMediaBusy(false);
    if (r.ok) { setMediaMsg("媒體已儲存 ✓"); load(); }
    else { const j = await r.json().catch(() => ({})); setMediaMsg("儲存失敗：" + (j.error ?? r.status)); }
  }

  async function onPickCover(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f) return;
    setMediaBusy(true); setMediaMsg(null);
    try { setCover(await uploadCourtImage(f)); } catch (err) { setMediaMsg(err instanceof Error ? err.message : "上傳失敗"); }
    setMediaBusy(false);
  }
  async function onPickPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []); e.target.value = "";
    if (files.length === 0) return;
    setMediaBusy(true); setMediaMsg(null);
    try {
      const urls: string[] = [];
      for (const f of files.slice(0, 12)) urls.push(await uploadCourtImage(f));
      setPhotos((p) => [...p, ...urls].slice(0, 12));
    } catch (err) { setMediaMsg(err instanceof Error ? err.message : "上傳失敗"); }
    setMediaBusy(false);
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

      {/* 媒體:封面 / 相簿 / 影片 */}
      <h2 style={{ fontSize: 15, fontWeight: 600, margin: "24px 0 12px" }}>封面 / 相簿 / 影片</h2>
      <div style={card}>
        {/* 封面 */}
        <div style={{ padding: "12px 0", borderBottom: "1px solid #eef2f7" }}>
          <div style={{ color: "#7a8a9e", fontSize: 13, marginBottom: 8 }}>封面圖(詳情頁頂部大圖,16:9)</div>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{ width: 200, aspectRatio: "16 / 9", borderRadius: 8, overflow: "hidden", background: "#eef2f7", flexShrink: 0 }}>
              {cover && /* eslint-disable-next-line @next/next/no-img-element */ <img src={cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ ...btnGhost, display: "inline-block", textAlign: "center" }}>
                {cover ? "更換封面" : "上傳封面"}
                <input type="file" accept="image/*" onChange={onPickCover} style={{ display: "none" }} />
              </label>
              {cover && <button onClick={() => setCover(null)} style={btnDanger}>移除封面</button>}
            </div>
          </div>
        </div>

        {/* 相簿 */}
        <div style={{ padding: "12px 0", borderBottom: "1px solid #eef2f7" }}>
          <div style={{ color: "#7a8a9e", fontSize: 13, marginBottom: 8 }}>場館照片(最多 12 張)</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 8 }}>
            {photos.map((p, i) => (
              <div key={i} style={{ position: "relative", aspectRatio: "1 / 1", borderRadius: 8, overflow: "hidden", background: "#eef2f7" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button onClick={() => setPhotos((arr) => arr.filter((_, j) => j !== i))}
                  style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%", border: "none", background: "rgba(0,0,0,.6)", color: "#fff", cursor: "pointer", fontSize: 13, lineHeight: "22px" }}>×</button>
              </div>
            ))}
            {photos.length < 12 && (
              <label style={{ aspectRatio: "1 / 1", borderRadius: 8, border: "1.5px dashed #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", color: "#7a8a9e", fontSize: 13, cursor: "pointer" }}>
                ＋ 加照片
                <input type="file" accept="image/*" multiple onChange={onPickPhotos} style={{ display: "none" }} />
              </label>
            )}
          </div>
        </div>

        {/* 影片 */}
        <div style={{ padding: "12px 0" }}>
          <div style={{ color: "#7a8a9e", fontSize: 13, marginBottom: 8 }}>介紹影片(YouTube 連結,或 .mp4 網址)</div>
          <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtu.be/..." style={input} />
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 12 }}>
          <button onClick={saveMedia} disabled={mediaBusy} style={btnPrimary}>{mediaBusy ? "處理中…" : "儲存媒體"}</button>
          {mediaMsg && <span style={{ fontSize: 13, color: mediaMsg.includes("✓") ? "#0d8a66" : "#dc2626" }}>{mediaMsg}</span>}
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

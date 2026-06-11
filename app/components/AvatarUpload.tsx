"use client";
// app/components/AvatarUpload.tsx — 頭像上傳元件。前端用 canvas 壓縮成小圖(<=400px, JPEG)
// 再 POST 到指定 endpoint,回傳 CDN 網址。可重用於教練申請與會員頭像。
import { useRef, useState } from "react";

const MAX_DIM = 400;

function resizeToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
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

export default function AvatarUpload({
  endpoint,
  initialUrl,
  onUploaded,
  label = "上傳照片",
}: {
  endpoint: string;
  initialUrl?: string | null;
  onUploaded?: (url: string) => void;
  label?: string;
}) {
  const [url, setUrl] = useState<string | null>(initialUrl ?? null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr("");
    try {
      const dataUrl = await resizeToDataUrl(file);
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      });
      const j = await r.json();
      if (!r.ok) setErr(j.error ?? "上傳失敗");
      else {
        setUrl(j.url);
        onUploaded?.(j.url);
      }
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "上傳失敗");
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: "#1e3a8a",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          fontSize: 24,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          "?"
        )}
      </div>
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          style={{
            background: "#fff",
            color: "#1e3a8a",
            border: "1.5px solid #1e3a8a",
            padding: "8px 14px",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {busy ? "上傳中…" : url ? "更換照片" : label}
        </button>
        <input ref={inputRef} type="file" accept="image/*" onChange={onPick} style={{ display: "none" }} />
        {err && <div style={{ color: "#dc2626", fontSize: 13, marginTop: 6 }}>{err}</div>}
      </div>
    </div>
  );
}

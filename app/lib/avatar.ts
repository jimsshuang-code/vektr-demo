// app/lib/avatar.ts — 頭像上傳(Vercel Blob)。前端已壓縮成小圖,這裡驗證 + 上傳,回 CDN 網址。
// 未設定 BLOB_READ_WRITE_TOKEN 時拋錯(讓 API 回 503),build-safe。
import { put } from "@vercel/blob";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 600 * 1024; // 600KB(前端應壓到更小)

export async function uploadAvatarDataUrl(dataUrl: string): Promise<string> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    const err = new Error("圖片儲存尚未啟用");
    (err as { status?: number }).status = 503;
    throw err;
  }
  const m = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(dataUrl ?? "");
  if (!m) {
    const err = new Error("不支援的圖片格式");
    (err as { status?: number }).status = 400;
    throw err;
  }
  const mime = m[1].toLowerCase();
  if (!ALLOWED.has(mime)) {
    const err = new Error("僅支援 JPG / PNG / WebP");
    (err as { status?: number }).status = 400;
    throw err;
  }
  const buf = Buffer.from(m[2], "base64");
  if (buf.byteLength > MAX_BYTES) {
    const err = new Error("圖片過大");
    (err as { status?: number }).status = 413;
    throw err;
  }
  const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
  const name = `avatars/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
  const blob = await put(name, buf, { access: "public", contentType: mime });
  return blob.url;
}

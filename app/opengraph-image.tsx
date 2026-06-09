// app/opengraph-image.tsx
// 全站預設 OG 分享卡(首頁及未自訂 OG 的頁面共用)。navy/lime 品牌卡。
// 中文以 Google Fonts(Noto Sans TC)子集載入,失敗時以英文優雅降級。
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "VEKTR — 台灣匹克球平台";

const NAVY = "#0f172a";
const NAVY2 = "#1e3a8a";
const LIME = "#bef264";
const MUTED = "#94a3b8";

async function loadCJKFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@700&text=${encodeURIComponent(
      text
    )}`;
    const css = await (
      await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_0) AppleWebKit/535.0",
        },
      })
    ).text();
    const m = css.match(/src:\s*url\((.+?)\)\s*format\(['"]?(?:truetype|opentype)['"]?\)/);
    if (!m) return null;
    const res = await fetch(m[1]);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

export default async function Image() {
  const subset = "台灣匹克球平台找球場揪球友一起來打球";
  const font = await loadCJKFont(subset);
  const fonts = font
    ? [{ name: "NotoTC", data: font, style: "normal" as const, weight: 700 as const }]
    : undefined;
  const ff = font ? "NotoTC" : "sans-serif";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY2} 100%)`,
          padding: "72px",
          fontFamily: ff,
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span style={{ fontSize: 110, fontWeight: 700, letterSpacing: 6, color: "#fff" }}>
            VE
          </span>
          <span style={{ fontSize: 110, fontWeight: 700, letterSpacing: 6, color: LIME }}>K</span>
          <span style={{ fontSize: 110, fontWeight: 700, letterSpacing: 6, color: "#fff" }}>
            TR
          </span>
        </div>
        <div style={{ display: "flex", fontSize: 40, color: "#fff", marginTop: 28, fontWeight: 700 }}>
          台灣匹克球平台
        </div>
        <div style={{ display: "flex", fontSize: 30, color: MUTED, marginTop: 12 }}>
          找球場 · 揪球友 · 一起來打球
        </div>
        <div style={{ display: "flex", marginTop: 40 }}>
          <span
            style={{
              fontSize: 22,
              letterSpacing: 6,
              color: NAVY,
              background: LIME,
              padding: "10px 22px",
              borderRadius: 20,
              fontWeight: 700,
            }}
          >
            COURTS · MATCH
          </span>
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}

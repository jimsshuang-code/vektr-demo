// app/match/[id]/opengraph-image.tsx
// 動態 OG 分享卡(1200x630)。分享 /match/[id] 到 LINE/社群時顯示:標題、時間、場地、
// 還缺幾人。全站 navy/lime。中文以 Google Fonts(Noto Sans TC)子集字型載入;
// 若字型載入失敗,仍以英文標籤 + 大數字保證可讀(graceful degradation)。
import { ImageResponse } from "next/og";
import { getPublicMatch, playersNeeded, formatWhen, GAME_LABEL } from "@/app/lib/matchPublic";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "VEKTR 約球邀請卡";

const NAVY = "#0f172a";
const NAVY2 = "#1e3a8a";
const LIME = "#bef264";
const INK = "#e2e8f0";
const MUTED = "#94a3b8";

// 取 Noto Sans TC 子集(只含本卡實際用到的字),體積小、適合 request-time 生成。
async function loadCJKFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@700&text=${encodeURIComponent(
      text
    )}`;
    const css = await (
      await fetch(url, {
        headers: {
          // 舊版 UA 讓 Google 回傳 truetype(satori 不支援 woff2)
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

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await getPublicMatch(Number(id));

  // 找不到 / 不可見 -> 通用品牌卡(永遠回傳一張圖,不丟錯)
  const title = match?.title?.trim() || (match ? `${GAME_LABEL[match.gameType] ?? "匹克球"}球局` : "VEKTR 約球");
  const when = match ? formatWhen(match.scheduledAt) : "";
  const court = match?.courtName || (match ? "自訂地點" : "");
  const need = match ? playersNeeded(match) : 0;
  const cancelled = match?.status === "cancelled";
  const full = match ? need === 0 : false;

  // 狀態膠囊文案
  let statusZh = "還缺";
  let statusEn = "PLAYERS NEEDED";
  let bigNum = String(need);
  if (cancelled) {
    statusZh = "已取消";
    statusEn = "CANCELLED";
    bigNum = "—";
  } else if (full) {
    statusZh = "已滿";
    statusEn = "ROOM FULL";
    bigNum = "✓";
  }

  // 字型子集需涵蓋的所有中文/字元
  const subset =
    title +
    court +
    when +
    "還缺已滿取消人約球揪人一起來打球場地時間VEKTR匹克單打雙混" +
    "0123456789/():";
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
          padding: "64px 72px",
          fontFamily: ff,
          color: INK,
          justifyContent: "space-between",
        }}
      >
        {/* 頂部品牌列 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span style={{ fontSize: 52, fontWeight: 700, letterSpacing: 4, color: "#fff" }}>
              VE
            </span>
            <span style={{ fontSize: 52, fontWeight: 700, letterSpacing: 4, color: LIME }}>K</span>
            <span style={{ fontSize: 52, fontWeight: 700, letterSpacing: 4, color: "#fff" }}>
              TR
            </span>
            <span style={{ fontSize: 22, color: MUTED, marginLeft: 18, letterSpacing: 2 }}>
              約球 MATCH
            </span>
          </div>
        </div>

        {/* 中段:標題 + 時間/場地 */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: title.length > 16 ? 56 : 72,
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1.15,
              display: "flex",
            }}
          >
            {title}
          </div>
          {match && (
            <div style={{ display: "flex", flexDirection: "column", marginTop: 24, gap: 8 }}>
              <span style={{ fontSize: 30, color: INK, display: "flex" }}>{when}</span>
              <span style={{ fontSize: 30, color: MUTED, display: "flex" }}>{court}</span>
            </div>
          )}
        </div>

        {/* 底部:缺人膠囊 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: cancelled ? "#7f1d1d" : full ? "#334155" : LIME,
              borderRadius: 28,
              padding: "20px 40px",
            }}
          >
            <span
              style={{
                fontSize: 88,
                fontWeight: 700,
                color: cancelled || full ? "#fff" : NAVY,
                lineHeight: 1,
              }}
            >
              {bigNum}
            </span>
            <div style={{ display: "flex", flexDirection: "column", marginLeft: 24 }}>
              <span
                style={{
                  fontSize: 38,
                  fontWeight: 700,
                  color: cancelled || full ? "#fff" : NAVY,
                  display: "flex",
                }}
              >
                {cancelled || full ? statusZh : `還缺 ${need} 人`}
              </span>
              <span
                style={{
                  fontSize: 18,
                  letterSpacing: 3,
                  color: cancelled || full ? MUTED : "#365314",
                  display: "flex",
                }}
              >
                {statusEn}
              </span>
            </div>
          </div>
          {match && (
            <span style={{ fontSize: 30, color: "#fff", fontWeight: 700, display: "flex" }}>
              {match.currentPlayers}/{match.maxPlayers}
            </span>
          )}
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}

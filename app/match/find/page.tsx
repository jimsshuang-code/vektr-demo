"use client";
// app/match/find/page.tsx
// 尋找球友 / Find Players — 依條件(城市、日期、DUPR 等級、是否只看未滿)搜尋開團中的球局,
// 直接點進去報名加入。接既有 GET /api/v1/matches(支援 city/date/dupr 篩選)。
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type Match = {
  id: number; title: string | null; scheduled_at: string; duration_min: number;
  max_players: number; current_players: number; dupr_min: number | null; dupr_max: number | null;
  game_type: string; level: string | null; court_name: string | null; city: string | null;
};
const C = { navy: "#1e3a8a", ink: "#0f172a", lime: "#65a30d", limeBg: "#f7fee7", txt2: "#64748b", line: "#e2e8f0", bg: "#f8fafc" };
const fmt = (iso: string) => { const d = new Date(iso); return `${d.getMonth() + 1}/${d.getDate()} (${"日一二三四五六"[d.getDay()]}) ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
const gameLabel: Record<string, string> = { singles: "單打", doubles: "雙打", mixed: "混雙" };

export default function FindPlayersPage() {
  const [list, setList] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const [dupr, setDupr] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (city.trim()) qs.set("city", city.trim());
    if (date) qs.set("date", date);
    if (dupr) qs.set("dupr", dupr);
    try {
      const r = await fetch(`/api/v1/matches?${qs}`);
      const j = await r.json();
      setList(j.matches ?? []);
    } catch {
      setList([]);
    }
    setLoading(false);
  }, [city, date, dupr]);

  useEffect(() => { load(); }, [load]);
  // 推薦碼歸因(與 /match 一致)
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) document.cookie = `vektr_ref=${ref};path=/;max-age=2592000`;
  }, []);

  const shown = onlyOpen ? list.filter((m) => m.current_players < m.max_players) : list;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "-apple-system,'Noto Sans TC',sans-serif" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px 80px" }}>
        <div style={{ marginBottom: 4 }}>
          <Link href="/match" style={{ color: C.txt2, fontSize: 14, textDecoration: "none" }}>← 約球總覽</Link>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: C.ink, margin: "8px 0 2px" }}>尋找球友</h1>
        <p style={{ fontSize: 14, color: C.txt2, margin: "0 0 18px" }}>
          依城市、日期、DUPR 等級篩選開團中的球局,找到適合的直接報名加入。
        </p>

        {/* 篩選器 */}
        <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: 14, marginBottom: 18, display: "grid", gap: 10 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <label style={{ flex: "1 1 160px", display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: C.txt2 }}>城市</span>
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="如 台北市"
                style={{ padding: "10px 12px", border: `1px solid ${C.line}`, borderRadius: 10, fontSize: 14 }} />
            </label>
            <label style={{ flex: "1 1 140px", display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: C.txt2 }}>日期</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                style={{ padding: "10px 12px", border: `1px solid ${C.line}`, borderRadius: 10, fontSize: 14 }} />
            </label>
            <label style={{ flex: "1 1 120px", display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: C.txt2 }}>我的 DUPR</span>
              <input type="number" step="0.1" min="2" max="8" value={dupr} onChange={(e) => setDupr(e.target.value)} placeholder="如 3.5"
                style={{ padding: "10px 12px", border: `1px solid ${C.line}`, borderRadius: 10, fontSize: 14 }} />
            </label>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, color: C.ink, cursor: "pointer" }}>
              <input type="checkbox" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} />
              只看還有空位的
            </label>
            {(city || date || dupr) && (
              <button onClick={() => { setCity(""); setDate(""); setDupr(""); }}
                style={{ background: "none", border: "none", color: C.txt2, fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>
                清除篩選
              </button>
            )}
          </div>
        </div>

        {/* 結果 */}
        {loading ? (
          <p style={{ color: C.txt2, textAlign: "center", padding: 40 }}>搜尋中…</p>
        ) : shown.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px", color: C.txt2 }}>
            <p style={{ marginBottom: 12 }}>找不到符合條件的球局</p>
            <Link href="/match/create" style={{ color: C.navy, fontWeight: 700 }}>自己開一場揪人 →</Link>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 13, color: C.txt2, margin: "0 0 10px" }}>找到 {shown.length} 場球局</p>
            <div style={{ display: "grid", gap: 12 }}>
              {shown.map((m) => {
                const full = m.current_players >= m.max_players;
                const need = Math.max(0, m.max_players - m.current_players);
                return (
                  <Link key={m.id} href={`/match/${m.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <div style={{ fontWeight: 800, color: C.ink, fontSize: 16 }}>{m.title || `${gameLabel[m.game_type] ?? m.game_type}球局`}</div>
                        <span style={{ fontSize: 12, fontWeight: 800, padding: "3px 9px", borderRadius: 14, whiteSpace: "nowrap", background: full ? "#fef2f2" : C.limeBg, color: full ? "#dc2626" : C.lime }}>
                          {full ? "已額滿" : `還缺 ${need} 人`}
                        </span>
                      </div>
                      <div style={{ color: C.txt2, fontSize: 13.5, marginTop: 6, lineHeight: 1.7 }}>
                        🕐 {fmt(m.scheduled_at)}<br />
                        📍 {m.court_name || "自訂地點"}{m.city ? ` · ${m.city}` : ""}<br />
                        🏓 {gameLabel[m.game_type] ?? m.game_type}{(m.dupr_min || m.dupr_max) ? ` · DUPR ${m.dupr_min ?? "?"}–${m.dupr_max ?? "?"}` : ""}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

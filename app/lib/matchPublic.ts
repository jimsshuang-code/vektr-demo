// app/lib/matchPublic.ts
// 球局「公開」資訊讀取(供 OG 分享卡與 generateMetadata 用)。
// 只取可公開顯示之欄位 + joined 人數;以 withUser(null) 走匿名 RLS 連線。
// 以 React cache 包裝,使同一請求中 opengraph-image 與 generateMetadata 共用同一查詢。
import { cache } from "react";
import { withUser } from "@/app/lib/matchDb";

export type PublicMatch = {
  id: number;
  title: string | null;
  scheduledAt: string;
  durationMin: number;
  maxPlayers: number;
  currentPlayers: number;
  gameType: string;
  status: string;
  courtName: string | null;
};

export const getPublicMatch = cache(async (id: number): Promise<PublicMatch | null> => {
  if (!Number.isFinite(id)) return null;
  try {
    return await withUser(null, async (c) => {
      const r = await c.query(
        `SELECT m.id, m.title, m.scheduled_at, m.duration_min, m.max_players,
                m.game_type, m.status, co.name AS court_name,
                (SELECT count(*)::int FROM match_participants mp
                  WHERE mp.match_id = m.id AND mp.status = 'joined') AS current_players
           FROM match_rooms m
           LEFT JOIN courts co ON co.id = m.court_id
          WHERE m.id = $1`,
        [id]
      );
      if (r.rowCount === 0) return null;
      const m = r.rows[0];
      return {
        id: Number(m.id),
        title: m.title ?? null,
        scheduledAt: new Date(m.scheduled_at).toISOString(),
        durationMin: Number(m.duration_min),
        maxPlayers: Number(m.max_players),
        currentPlayers: Number(m.current_players),
        gameType: m.game_type,
        status: m.status,
        courtName: m.court_name ?? null,
      };
    });
  } catch {
    return null;
  }
});

// 共用顯示 helper -----------------------------------------------------------
export const GAME_LABEL: Record<string, string> = {
  singles: "單打",
  doubles: "雙打",
  mixed: "混雙",
};

export function playersNeeded(m: PublicMatch): number {
  return Math.max(0, m.maxPlayers - m.currentPlayers);
}

export type UpcomingMatch = {
  id: number;
  title: string | null;
  scheduledAt: string;
  gameType: string;
  maxPlayers: number;
  currentPlayers: number;
  courtName: string | null;
  city: string | null;
};

// 首頁「即時熱門揪球」用:即將到來、仍開放的球局。匿名 RLS 連線。
export const listUpcomingMatches = cache(async (limit = 4): Promise<UpcomingMatch[]> => {
  try {
    return await withUser(null, async (c) => {
      const r = await c.query(
        `SELECT m.id, m.title, m.scheduled_at, m.game_type, m.max_players,
                co.name AS court_name, co.city,
                (SELECT count(*)::int FROM match_participants mp
                  WHERE mp.match_id = m.id AND mp.status = 'joined') AS current_players
           FROM match_rooms m
           LEFT JOIN courts co ON co.id = m.court_id
          WHERE m.status = 'open' AND m.scheduled_at >= now()
          ORDER BY m.scheduled_at ASC
          LIMIT $1`,
        [limit]
      );
      return r.rows.map((m) => ({
        id: Number(m.id),
        title: m.title ?? null,
        scheduledAt: new Date(m.scheduled_at).toISOString(),
        gameType: m.game_type,
        maxPlayers: Number(m.max_players),
        currentPlayers: Number(m.current_players),
        courtName: m.court_name ?? null,
        city: m.city ?? null,
      }));
    });
  } catch {
    return [];
  }
});

export function formatWhen(iso: string): string {
  const d = new Date(iso);
  const wd = "日一二三四五六"[d.getDay()];
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} (${wd}) ${hh}:${mm}`;
}

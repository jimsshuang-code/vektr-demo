// app/lib/memberDb.ts
// 會員中心資料層。自身基本資料以 withUser(me.id) 讀;歷史/球友走 SECURITY DEFINER(010)。
import { pool } from "@/app/lib/db";
import { withUser } from "@/app/lib/matchDb";

export type MyProfile = {
  id: number;
  name: string | null;
  avatar_url: string | null;
  dupr_rating: number | null;
  tier: string | null;
  referral_code: string | null;
  created_at: string | null;
};

export type HistoryRow = {
  match_id: number;
  title: string | null;
  scheduled_at: string;
  duration_min: number;
  status: string;
  court_name: string | null;
  my_rating: number | null;
  my_status: string;
};

export type PartnerRow = {
  user_id: number;
  name: string | null;
  avatar_url: string | null;
  dupr_rating: number | null;
  games: number;
};

export async function getMyProfile(userId: number): Promise<MyProfile | null> {
  try {
    return await withUser(userId, async (c) => {
      const r = await c.query(
        "SELECT id, name, avatar_url, dupr_rating, tier, referral_code, created_at FROM users WHERE id = $1",
        [userId]
      );
      if (r.rowCount === 0) return null;
      const u = r.rows[0];
      return {
        id: Number(u.id),
        name: u.name ?? null,
        avatar_url: u.avatar_url ?? null,
        dupr_rating: u.dupr_rating != null ? Number(u.dupr_rating) : null,
        tier: u.tier ?? null,
        referral_code: u.referral_code ?? null,
        created_at: u.created_at ? new Date(u.created_at).toISOString() : null,
      };
    });
  } catch {
    return null;
  }
}

export async function myMatchHistory(userId: number): Promise<HistoryRow[]> {
  const { rows } = await pool.query("SELECT * FROM my_match_history($1)", [userId]);
  return rows.map((r) => ({
    match_id: Number(r.match_id),
    title: r.title ?? null,
    scheduled_at: new Date(r.scheduled_at).toISOString(),
    duration_min: Number(r.duration_min),
    status: r.status,
    court_name: r.court_name ?? null,
    my_rating: r.my_rating != null ? Number(r.my_rating) : null,
    my_status: r.my_status,
  }));
}

export async function myPlayPartners(userId: number): Promise<PartnerRow[]> {
  const { rows } = await pool.query("SELECT * FROM my_play_partners($1)", [userId]);
  return rows.map((r) => ({
    user_id: Number(r.user_id),
    name: r.name ?? null,
    avatar_url: r.avatar_url ?? null,
    dupr_rating: r.dupr_rating != null ? Number(r.dupr_rating) : null,
    games: Number(r.games),
  }));
}

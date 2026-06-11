// app/lib/stats.ts — 平台真實成長數據(首頁用)。匿名讀,失敗回 0。
import { cache } from "react";
import { pool } from "@/app/lib/db";

export type PlatformStats = {
  courts: number;
  cities: number;
  users: number;
  matches: number;
};

export const getPlatformStats = cache(async (): Promise<PlatformStats> => {
  try {
    const r = await pool.query(`
      SELECT
        (SELECT count(*) FROM courts WHERE status = 'active')::int AS courts,
        (SELECT count(DISTINCT city) FROM courts WHERE status = 'active' AND city IS NOT NULL AND city <> '')::int AS cities,
        (SELECT count(*) FROM users)::int AS users,
        (SELECT count(*) FROM match_rooms)::int AS matches
    `);
    const row = r.rows[0] ?? {};
    return {
      courts: Number(row.courts ?? 0),
      cities: Number(row.cities ?? 0),
      users: Number(row.users ?? 0),
      matches: Number(row.matches ?? 0),
    };
  } catch {
    return { courts: 0, cities: 0, users: 0, matches: 0 };
  }
});

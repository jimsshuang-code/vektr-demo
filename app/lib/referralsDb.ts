// app/lib/referralsDb.ts
// 後台推薦成長報表資料層。走 SECURITY DEFINER 函式(傳 admin_users.id),
// 與 reportsDb 的 admin 函式同模式。依賴 008_referral_admin.sql。
import { pool } from "@/app/lib/db";

export type ReferralRow = {
  referrer_id: number;
  referrer_name: string | null;
  referral_code: string | null;
  invited: number;
};

export type ReferralSummary = {
  total_invited: number;
  total_referrers: number;
};

export async function adminReferralStats(adminId: number): Promise<ReferralRow[]> {
  const { rows } = await pool.query("SELECT * FROM admin_referral_stats($1)", [adminId]);
  return rows.map((r) => ({
    referrer_id: Number(r.referrer_id),
    referrer_name: r.referrer_name ?? null,
    referral_code: r.referral_code ?? null,
    invited: Number(r.invited),
  }));
}

export async function adminReferralSummary(adminId: number): Promise<ReferralSummary> {
  const { rows } = await pool.query("SELECT * FROM admin_referral_summary($1)", [adminId]);
  const r = rows[0] ?? {};
  return {
    total_invited: Number(r.total_invited ?? 0),
    total_referrers: Number(r.total_referrers ?? 0),
  };
}

// app/lib/reportsDb.ts
// A2 -- 檢舉 + 停權 資料存取層。
// 球友寫入走 withUser(RLS 交易); admin 走 pool + SECURITY DEFINER 函式(傳 admin_users.id)。

import { pool } from "@/app/lib/db";
import { withUser } from "@/app/lib/matchDb";

export const REPORT_CATEGORIES = [
  "harassment",
  "no_show",
  "unsafe",
  "fake_profile",
  "spam",
  "other",
] as const;
export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

export type CreateReportInput = {
  reportedUserId: number;
  matchId: number | null;
  category: ReportCategory;
  detail?: string | null;
};

// write-time 停權守衛(user_is_suspended 為 SECURITY DEFINER, 直接走 pool 即可)
export async function isSuspended(userId: number): Promise<boolean> {
  const { rows } = await pool.query("SELECT user_is_suspended($1) AS s", [userId]);
  return rows[0]?.s === true;
}

// 建立檢舉。reporter_id 由呼叫端帶入登入者 id(App 層信任邊界)。
export async function createReport(
  reporterId: number,
  input: CreateReportInput
): Promise<{ id: number }> {
  return withUser(reporterId, async (c) => {
    const r = await c.query(
      `INSERT INTO match_reports (reporter_id, reported_user_id, match_id, category, detail)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [reporterId, input.reportedUserId, input.matchId, input.category, input.detail ?? null]
    );
    return { id: Number(r.rows[0].id) };
  });
}

// ---- Admin (傳 admin_users.id; 函式內 assert_admin 再次把關) -------------------

export type AdminReportRow = {
  id: number;
  reporter_id: number;
  reporter_name: string | null;
  reported_user_id: number;
  reported_name: string | null;
  reported_suspended: boolean;
  match_id: number | null;
  match_title: string | null;
  category: string;
  detail: string | null;
  status: string;
  resolution: string | null;
  resolved_by: number | null;
  resolved_at: string | null;
  created_at: string;
};

export async function adminListReports(
  adminId: number,
  status: string | null = null
): Promise<AdminReportRow[]> {
  const { rows } = await pool.query("SELECT * FROM admin_list_reports($1, $2)", [adminId, status]);
  return rows.map((r) => ({
    ...r,
    id: Number(r.id),
    reporter_id: Number(r.reporter_id),
    reported_user_id: Number(r.reported_user_id),
    match_id: r.match_id == null ? null : Number(r.match_id),
    resolved_by: r.resolved_by == null ? null : Number(r.resolved_by),
  })) as AdminReportRow[];
}

export async function adminResolveReport(
  adminId: number,
  reportId: number,
  status: "pending" | "reviewing" | "resolved" | "dismissed",
  resolution?: string | null
): Promise<void> {
  await pool.query("SELECT admin_resolve_report($1, $2, $3, $4)", [
    adminId,
    reportId,
    status,
    resolution ?? null,
  ]);
}

export async function adminSuspendUser(
  adminId: number,
  userId: number,
  reason: string,
  until: string | null = null
): Promise<void> {
  await pool.query("SELECT admin_suspend_user($1, $2, $3, $4)", [adminId, userId, reason, until]);
}

export async function adminUnsuspendUser(adminId: number, userId: number): Promise<void> {
  await pool.query("SELECT admin_unsuspend_user($1, $2)", [adminId, userId]);
}

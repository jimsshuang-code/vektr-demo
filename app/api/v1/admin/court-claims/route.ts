import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/rbac";
import { pool } from "@/app/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/admin/court-claims — 待審:場主認領申請 + 場主自建待上架球場 + 被檢舉的球友媒體。
export async function GET() {
  const guard = await requireAdmin("courts");
  if (!guard.ok) return NextResponse.json({ error: "forbidden" }, { status: guard.status });
  try {
    const claims = await pool.query(
      `SELECT o.id, o.court_id, o.note, o.created_at,
              c.name AS court_name, c.city, c.status AS court_status, c.data_source,
              u.name AS user_name, u.id AS user_id
       FROM court_owners o
       JOIN courts c ON c.id = o.court_id
       LEFT JOIN users u ON u.id = o.user_id
       WHERE o.status = 'pending'
       ORDER BY o.created_at`
    );
    const pendingCourts = await pool.query(
      `SELECT c.id, c.name, c.city, c.address, c.created_at,
              u.name AS owner_name
       FROM courts c
       LEFT JOIN court_owners o ON o.court_id = c.id AND o.status = 'approved'
       LEFT JOIN users u ON u.id = o.user_id
       WHERE c.status = 'pending'
       ORDER BY c.created_at`
    );
    const reported = await pool.query(
      `SELECT m.id, m.court_id, m.kind, m.url, m.report_count, m.status,
              c.name AS court_name, u.name AS uploader_name
       FROM court_media m
       JOIN courts c ON c.id = m.court_id
       LEFT JOIN users u ON u.id = m.user_id
       WHERE m.report_count > 0
       ORDER BY m.report_count DESC, m.created_at DESC
       LIMIT 100`
    );
    return NextResponse.json({
      claims: claims.rows,
      pendingCourts: pendingCourts.rows,
      reportedMedia: reported.rows,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}

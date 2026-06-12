import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/app/lib/db";
import { requireUser } from "@/app/lib/currentUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/v1/courts/[id]/claim — 登入球友提出「認領這個球場」申請(待管理員核准)。
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await requireUser();
    const { id } = await params;
    const b = await req.json().catch(() => ({}));
    const note = String(b.note ?? "").slice(0, 500);

    const exists = await pool.query("SELECT id FROM courts WHERE id=$1 AND status IN ('active','pending')", [id]);
    if (exists.rowCount === 0) return NextResponse.json({ error: "球場不存在" }, { status: 404 });

    await pool.query(
      `INSERT INTO court_owners (court_id, user_id, status, note)
       VALUES ($1, $2, 'pending', $3)
       ON CONFLICT (court_id, user_id)
       DO UPDATE SET status = CASE WHEN court_owners.status = 'rejected' THEN 'pending' ELSE court_owners.status END,
                     note = EXCLUDED.note`,
      [id, me.id, note || null]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    const status = (e as { status?: number })?.status ?? 500;
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status });
  }
}

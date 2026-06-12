import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/rbac";
import { pool } from "@/app/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PATCH /api/v1/admin/court-claims/[id] — 核准/駁回一筆場主認領申請。
// body: { action: 'approve' | 'reject' }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin("courts", { write: true });
  if (!guard.ok) return NextResponse.json({ error: "forbidden" }, { status: guard.status });
  try {
    const { id } = await params;
    const { action } = await req.json();
    const next = action === "approve" ? "approved" : action === "reject" ? "rejected" : null;
    if (!next) return NextResponse.json({ error: "action 不正確" }, { status: 400 });
    const { rowCount } = await pool.query(
      "UPDATE court_owners SET status=$1, reviewed_at=now() WHERE id=$2 AND status='pending'",
      [next, id]
    );
    if (rowCount === 0) return NextResponse.json({ error: "申請不存在或已處理" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}

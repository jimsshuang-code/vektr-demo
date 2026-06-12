import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/rbac";
import { pool } from "@/app/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PATCH /api/v1/admin/court-media/[id] — 下架/復原一則球友媒體。
// body: { action: 'remove' | 'restore' }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin("courts", { write: true });
  if (!guard.ok) return NextResponse.json({ error: "forbidden" }, { status: guard.status });
  try {
    const { id } = await params;
    const { action } = await req.json();
    const next = action === "remove" ? "removed" : action === "restore" ? "visible" : null;
    if (!next) return NextResponse.json({ error: "action 不正確" }, { status: 400 });
    await pool.query("UPDATE court_media SET status=$1 WHERE id=$2", [next, id]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}

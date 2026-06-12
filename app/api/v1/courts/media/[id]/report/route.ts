import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/app/lib/db";
import { requireUser } from "@/app/lib/currentUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/v1/courts/media/[id]/report — 檢舉一則球友分享(達門檻自動隱藏待審)。
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await requireUser();
    const { id } = await params;
    const b = await req.json().catch(() => ({}));
    const reason = String(b.reason ?? "").slice(0, 200);
    const { rows } = await pool.query(
      "SELECT report_court_media($1, $2, $3) AS n",
      [id, me.id, reason]
    );
    return NextResponse.json({ ok: true, reports: rows[0]?.n ?? 0 });
  } catch (e) {
    const status = (e as { status?: number })?.status ?? 500;
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status });
  }
}

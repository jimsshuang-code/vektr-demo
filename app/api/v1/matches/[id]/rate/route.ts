import { NextRequest, NextResponse } from "next/server";
import { withUser } from "@/app/lib/matchDb";
import { requireUser } from "@/app/lib/currentUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const matchId = Number(id);
    const me = await requireUser();
    const { rating } = await req.json();
    if (!Number.isInteger(rating) || rating < 1 || rating > 5)
      return NextResponse.json({ error: "rating 需為 1–5 整數" }, { status: 400 });

    const result = await withUser(me.id, async (c) => {
      const m = await c.query("SELECT scheduled_at, duration_min, status FROM match_rooms WHERE id=$1", [matchId]);
      if (m.rowCount === 0) return { code: 404, body: { error: "房間不存在" } };
      const room = m.rows[0];
      const ended = new Date(room.scheduled_at).getTime() + room.duration_min * 60000 < Date.now();
      if (!(ended || room.status === "completed"))
        return { code: 409, body: { error: "球局尚未結束,無法評分" } };

      const p = await c.query(
        "SELECT id FROM match_participants WHERE match_id=$1 AND user_id=$2 AND status='joined'", [matchId, me.id]);
      if (p.rowCount === 0) return { code: 403, body: { error: "你未參加此球局" } };
      await c.query("UPDATE match_participants SET rating=$2 WHERE id=$1", [p.rows[0].id, rating]);
      return { code: 200, body: { ok: true, rating } };
    });

    return NextResponse.json(result.body, { status: result.code });
  } catch (e) {
    const status = (e as any)?.status ?? 500;
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { withUser } from "@/app/lib/matchDb";
import { requireUser } from "@/app/lib/currentUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const matchId = Number(id);
    const me = await requireUser();

    const result = await withUser(me.id, async (c) => {
      await c.query("SELECT pg_advisory_xact_lock($1)", [matchId]);
      const m = await c.query("SELECT id, host_id, status FROM match_rooms WHERE id=$1", [matchId]);
      if (m.rowCount === 0) return { code: 404, body: { error: "房間不存在" } };
      const room = m.rows[0];

      if (Number(room.host_id) === me.id) {
        if (room.status === "cancelled") return { code: 409, body: { error: "球局已取消" } };
        await c.query("UPDATE match_rooms SET status='cancelled' WHERE id=$1", [matchId]);
        return { code: 200, body: { ok: true, cancelled: true } };
      }

      const p = await c.query(
        "SELECT id, status FROM match_participants WHERE match_id=$1 AND user_id=$2", [matchId, me.id]);
      if (p.rowCount === 0 || p.rows[0].status !== "joined")
        return { code: 409, body: { error: "你不在此球局中" } };
      await c.query("UPDATE match_participants SET status='left', left_at=now() WHERE id=$1", [p.rows[0].id]);
      return { code: 200, body: { ok: true } };
    });

    return NextResponse.json(result.body, { status: result.code });
  } catch (e) {
    const status = (e as any)?.status ?? 500;
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { withUser } from "@/app/lib/matchDb";
import { requireUser } from "@/app/lib/currentUser";
import { isSuspended } from "@/app/lib/reportsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const matchId = Number(id);
    const me = await requireUser();
    if (await isSuspended(me.id)) {
      return NextResponse.json({ error: "account_suspended" }, { status: 403 });
    }

    const result = await withUser(me.id, async (c) => {
      await c.query("SELECT pg_advisory_xact_lock($1)", [matchId]);

      const m = await c.query("SELECT id, status, max_players FROM match_rooms WHERE id=$1", [matchId]);
      if (m.rowCount === 0) return { code: 404, body: { error: "房間不存在或無法加入" } };
      const room = m.rows[0];
      if (room.status !== "open") return { code: 409, body: { error: "此球局目前無法加入" } };

      const cnt = await c.query(
        "SELECT count(*)::int AS n FROM match_participants WHERE match_id=$1 AND status='joined'", [matchId]);
      if (cnt.rows[0].n >= room.max_players) return { code: 409, body: { error: "球局已額滿" } };

      const exist = await c.query(
        "SELECT id, status FROM match_participants WHERE match_id=$1 AND user_id=$2", [matchId, me.id]);
      if (exist.rowCount && exist.rows[0].status === "joined")
        return { code: 409, body: { error: "你已在此球局中" } };

      if (exist.rowCount) {
        await c.query("UPDATE match_participants SET status='joined', left_at=NULL, joined_at=now() WHERE id=$1", [exist.rows[0].id]);
      } else {
        await c.query("INSERT INTO match_participants (match_id, user_id) VALUES ($1,$2)", [matchId, me.id]);
      }
      const n = cnt.rows[0].n + 1;
      return { code: 200, body: { ok: true, current_players: n, full: n >= room.max_players } };
    });

    return NextResponse.json(result.body, { status: result.code });
  } catch (e) {
    const status = (e as any)?.status ?? 500;
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { withUser } from "@/app/lib/matchDb";
import { getCurrentUser } from "@/app/lib/currentUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const matchId = Number(id);
    if (!Number.isFinite(matchId)) {
      return NextResponse.json({ error: "bad id" }, { status: 400 });
    }
    const me = await getCurrentUser();

    const data = await withUser(me?.id ?? null, async (c) => {
      const m = await c.query(
        `SELECT m.id, m.host_id, m.title, m.description, m.scheduled_at, m.duration_min,
                m.max_players, m.dupr_min, m.dupr_max, m.game_type, m.level, m.status, m.share_code,
                co.id AS court_id, co.name AS court_name, co.address, co.city, co.lat, co.lng
         FROM match_rooms m
         LEFT JOIN courts co ON co.id = m.court_id
         WHERE m.id = $1`,
        [matchId]
      );
      if (m.rowCount === 0) return null;
      const room = m.rows[0];

      const ps = await c.query(
        `SELECT mp.user_id, mp.status, mp.rating, mp.joined_at,
                u.name, u.avatar_url, u.dupr_rating, u.tier,
                (mp.user_id = $2) AS host
         FROM match_participants mp
         JOIN users u ON u.id = mp.user_id
         WHERE mp.match_id = $1 AND mp.status = 'joined'
         ORDER BY mp.joined_at ASC`,
        [matchId, room.host_id]
      );

      const currentPlayers = ps.rowCount ?? 0;
      const isParticipant = me ? ps.rows.some((p) => Number(p.user_id) === me.id) : false;
      const isHost = me ? Number(room.host_id) === me.id : false;
      const ended =
        new Date(room.scheduled_at).getTime() + room.duration_min * 60000 < Date.now();

      let referralCode: string | null = null;
      if (me) {
        const u = await c.query("SELECT referral_code FROM users WHERE id = $1", [me.id]);
        referralCode = u.rows[0]?.referral_code ?? null;
      }

      return {
        match: { ...room, current_players: currentPlayers },
        participants: ps.rows,
        viewer: {
          authenticated: !!me,
          isHost,
          isParticipant,
          canJoin: !!me && !isParticipant && room.status === "open" && currentPlayers < room.max_players,
          canLeave: !!me && isParticipant,
          canRate: !!me && isParticipant && (ended || room.status === "completed"),
          referralCode,
        },
      };
    });

    if (!data) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

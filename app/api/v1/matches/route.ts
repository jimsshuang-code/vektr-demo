import { NextRequest, NextResponse } from "next/server";
import { withUser } from "@/app/lib/matchDb";
import { getCurrentUser, requireUser } from "@/app/lib/currentUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/matches?city=&date=YYYY-MM-DD&dupr=&lat=&lng=&radius=
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const city = sp.get("city");
    const date = sp.get("date");
    const dupr = sp.get("dupr") ? Number(sp.get("dupr")) : null;
    const lat = sp.get("lat") ? Number(sp.get("lat")) : null;
    const lng = sp.get("lng") ? Number(sp.get("lng")) : null;
    const radius = sp.get("radius") ? Number(sp.get("radius")) : 8000;
    const me = await getCurrentUser();

    const rows = await withUser(me?.id ?? null, async (c) => {
      const r = await c.query(
        `SELECT m.id, m.title, m.scheduled_at, m.duration_min, m.max_players,
                m.dupr_min, m.dupr_max, m.game_type, m.level, m.status, m.share_code,
                co.id AS court_id, co.name AS court_name, co.city, co.lat, co.lng,
                (SELECT count(*) FROM match_participants p
                   WHERE p.match_id = m.id AND p.status='joined')::int AS current_players
         FROM match_rooms m
         LEFT JOIN courts co ON co.id = m.court_id
         WHERE m.status = 'open'
           AND m.scheduled_at >= now()
           AND ($1::text IS NULL OR co.city = $1)
           AND ($2::date IS NULL OR m.scheduled_at::date = $2::date)
           AND ($3::numeric IS NULL OR (
                (m.dupr_min IS NULL OR m.dupr_min <= $3) AND
                (m.dupr_max IS NULL OR m.dupr_max >= $3)))
           AND ($4::float8 IS NULL OR $5::float8 IS NULL OR co.geog IS NULL OR
                ST_DWithin(co.geog, ST_SetSRID(ST_MakePoint($5,$4),4326)::geography, $6))
         ORDER BY m.scheduled_at ASC
         LIMIT 200`,
        [city, date, dupr, lat, lng, radius]
      );
      return r.rows;
    });

    return NextResponse.json({ count: rows.length, matches: rows });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/v1/matches  開房(需球友身分)
export async function POST(req: NextRequest) {
  try {
    const me = await requireUser();
    const b = await req.json();
    if (!b.scheduled_at) {
      return NextResponse.json({ error: "scheduled_at required" }, { status: 400 });
    }
    const shareCode = Math.random().toString(36).slice(2, 9).toUpperCase();

    const created = await withUser(me.id, async (c) => {
      const r = await c.query(
        `INSERT INTO match_rooms
           (host_id, court_id, title, description, scheduled_at, duration_min,
            max_players, dupr_min, dupr_max, game_type, level, share_code, current_players)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,1)
         RETURNING id, share_code`,
        [
          me.id, b.court_id ?? null, b.title ?? null, b.description ?? null,
          b.scheduled_at, b.duration_min ?? 90, b.max_players ?? 4,
          b.dupr_min ?? null, b.dupr_max ?? null,
          b.game_type ?? "doubles", b.level ?? null, shareCode,
        ]
      );
      const id = r.rows[0].id;
      await c.query(
        "INSERT INTO match_participants (match_id, user_id) VALUES ($1,$2)",
        [id, me.id]
      );
      return r.rows[0];
    });

    return NextResponse.json({ match: created }, { status: 201 });
  } catch (e) {
    const status = (e as any)?.status ?? 500;
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status });
  }
}

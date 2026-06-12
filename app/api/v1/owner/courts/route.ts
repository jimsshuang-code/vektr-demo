import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/app/lib/db";
import { requireUser } from "@/app/lib/currentUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/owner/courts — 我的球場(已核准場主 + 我提交/認領中的)。
export async function GET() {
  try {
    const me = await requireUser();
    const { rows } = await pool.query(
      `SELECT c.id, c.name, c.city, c.district, c.status, c.cover_image_url,
              o.status AS owner_status
       FROM court_owners o
       JOIN courts c ON c.id = o.court_id
       WHERE o.user_id = $1
       ORDER BY (o.status <> 'approved'), c.name`,
      [me.id]
    );
    return NextResponse.json({ courts: rows });
  } catch (e) {
    const status = (e as { status?: number })?.status ?? 500;
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status });
  }
}

// POST /api/v1/owner/courts — 場主自行新增全新球場(進待審,核准後上架)。
// body: { name, address, city?, district?, phone?, type?, hourly_rate?, num_courts? }
export async function POST(req: NextRequest) {
  try {
    const me = await requireUser();
    const b = await req.json();
    const name = String(b.name ?? "").trim();
    const address = String(b.address ?? "").trim();
    if (!name) return NextResponse.json({ error: "球場名稱必填" }, { status: 400 });
    if (!address) return NextResponse.json({ error: "地址必填" }, { status: 400 });

    const created = await pool.query(
      `INSERT INTO courts (name, address, city, district, phone, type, hourly_rate, num_courts,
                           data_source, is_verified, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'owner', false, 'pending')
       RETURNING id`,
      [
        name.slice(0, 200), address.slice(0, 300),
        b.city ? String(b.city).slice(0, 50) : null,
        b.district ? String(b.district).slice(0, 50) : null,
        b.phone ? String(b.phone).slice(0, 20) : null,
        b.type ? String(b.type).slice(0, 20) : null,
        b.hourly_rate != null && b.hourly_rate !== "" ? Number(b.hourly_rate) : null,
        b.num_courts != null && b.num_courts !== "" ? Number(b.num_courts) : null,
      ]
    );
    const courtId = created.rows[0].id;
    // 提交者即該球場場主(已核准),但球場本身待管理員審核才公開。
    await pool.query(
      "INSERT INTO court_owners (court_id, user_id, status, reviewed_at) VALUES ($1,$2,'approved', now())",
      [courtId, me.id]
    );
    return NextResponse.json({ ok: true, id: String(courtId) }, { status: 201 });
  } catch (e) {
    const status = (e as { status?: number })?.status ?? 500;
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status });
  }
}

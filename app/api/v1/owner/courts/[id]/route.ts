import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/app/lib/db";
import { requireUser } from "@/app/lib/currentUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function assertOwner(courtId: string, userId: number): Promise<boolean> {
  const { rows } = await pool.query("SELECT is_court_owner($1,$2) AS ok", [courtId, userId]);
  return rows[0]?.ok === true;
}

// GET /api/v1/owner/courts/[id] — 場主讀取自己球場(含媒體 + 基本資料,可編輯)。
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await requireUser();
    const { id } = await params;
    if (!(await assertOwner(id, me.id))) return NextResponse.json({ error: "非此球場場主" }, { status: 403 });
    const { rows } = await pool.query(
      `SELECT id, name, city, district, address, phone, type, hourly_rate, num_courts,
              status, cover_image_url, video_url, photos
       FROM courts WHERE id = $1`,
      [id]
    );
    if (rows.length === 0) return NextResponse.json({ error: "球場不存在" }, { status: 404 });
    return NextResponse.json({ court: rows[0] });
  } catch (e) {
    const status = (e as { status?: number })?.status ?? 500;
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status });
  }
}

// PATCH /api/v1/owner/courts/[id] — 場主更新自己球場的封面/相簿/影片 + 基本資料。
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await requireUser();
    const { id } = await params;
    if (!(await assertOwner(id, me.id))) return NextResponse.json({ error: "非此球場場主" }, { status: 403 });
    const b = await req.json();

    const cover = b.cover_image_url ? String(b.cover_image_url).slice(0, 500) : null;
    const video = b.video_url ? String(b.video_url).trim().slice(0, 500) : null;
    const photos: string[] = Array.isArray(b.photos)
      ? b.photos.filter((p: unknown) => typeof p === "string").slice(0, 12).map((p: string) => p.slice(0, 500))
      : [];
    const phone = b.phone != null ? String(b.phone).slice(0, 20) : null;
    const type = b.type != null && b.type !== "" ? String(b.type).slice(0, 20) : null;
    const hourly = b.hourly_rate != null && b.hourly_rate !== "" ? Number(b.hourly_rate) : null;
    const numCourts = b.num_courts != null && b.num_courts !== "" ? Number(b.num_courts) : null;

    await pool.query(
      `UPDATE courts SET cover_image_url=$1, video_url=$2, photos=$3,
                         phone=$4, type=$5, hourly_rate=$6, num_courts=$7, updated_at=now()
       WHERE id=$8`,
      [cover, video, photos, phone, type, hourly, numCourts, id]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    const status = (e as { status?: number })?.status ?? 500;
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status });
  }
}

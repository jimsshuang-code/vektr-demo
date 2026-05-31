import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../../lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const courtRes = await pool.query(
      `SELECT id, name, address, city, district, lat, lng,
              type, num_courts, hourly_rate, amenities, photos, phone,
              rating, rating_count, is_verified, partner_status
       FROM courts WHERE id = $1 AND status = 'active'`,
      [id]
    );
    if (courtRes.rows.length === 0) {
      return NextResponse.json({ error: 'not found' }, { status: 404 });
    }
    const hoursRes = await pool.query(
      `SELECT day_of_week, open_time, close_time
       FROM court_hours WHERE court_id = $1 ORDER BY day_of_week`,
      [id]
    );
    return NextResponse.json({ court: courtRes.rows[0], hours: hoursRes.rows });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

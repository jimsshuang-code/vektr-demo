import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../lib/db';

export const runtime = 'nodejs';      // pg 需要 Node runtime
export const dynamic = 'force-dynamic';

// 開發期讓 file:// 的測試地圖能跨來源呼叫;地圖之後變成 Next 頁面就同源,可移除
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
};

function buildQuery(sp: URLSearchParams) {
  const where: string[] = [`status = 'active'`];
  const params: unknown[] = [];
  let p = 0;

  const lat = sp.get('lat') ? Number(sp.get('lat')) : null;
  const lng = sp.get('lng') ? Number(sp.get('lng')) : null;
  const radius = sp.get('radius') ? Number(sp.get('radius')) : null;
  const hasGeo = lat != null && lng != null;

  let distanceExpr = 'NULL::float8';
  if (hasGeo) {
    params.push(lng, lat); // $1=lng, $2=lat
    distanceExpr = `ST_Distance(geog, ST_SetSRID(ST_MakePoint($1::float8, $2::float8), 4326)::geography)`;
    p = 2;
    if (radius != null) {
      params.push(radius);
      where.push(`ST_DWithin(geog, ST_SetSRID(ST_MakePoint($1::float8, $2::float8), 4326)::geography, $${++p})`);
    }
  }

  const city = sp.get('city');
  const type = sp.get('type');
  const maxRate = sp.get('max_rate');
  if (city) { params.push(city); where.push(`city = $${++p}`); }
  if (type) { params.push(type); where.push(`type = $${++p}`); }
  if (maxRate) {
    params.push(Number(maxRate));
    where.push(`(hourly_rate IS NOT NULL AND hourly_rate <= $${++p})`);
  }

  const orderBy = hasGeo
    ? `${distanceExpr} ASC NULLS LAST, rating DESC NULLS LAST`
    : `rating DESC NULLS LAST, rating_count DESC`;

  const sql = `
    SELECT id, name, address, city, district, lat, lng,
           type, num_courts, hourly_rate, amenities, photos, phone,
           rating, rating_count, is_verified,
           ROUND(${distanceExpr})::int AS distance_m
    FROM courts
    WHERE ${where.join(' AND ')}
    ORDER BY ${orderBy}
    LIMIT 1000;
  `;
  return { sql, params };
}

export async function GET(req: NextRequest) {
  try {
    const { sql, params } = buildQuery(req.nextUrl.searchParams);
    const { rows } = await pool.query(sql, params);
    return NextResponse.json({ count: rows.length, courts: rows }, { headers: cors });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown error';
    return NextResponse.json({ error: msg }, { status: 500, headers: cors });
  }
}

export function OPTIONS() {
  return new NextResponse(null, { headers: cors });
}

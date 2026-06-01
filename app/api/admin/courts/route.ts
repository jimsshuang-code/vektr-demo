// app/api/admin/courts/route.ts
// 球場管理列表 API。供 /admin/courts/page.tsx 使用。
// 讀取走 Prisma $queryRaw（courts 含 PostGIS geog 的 Unsupported 欄位，不走 typed client）。
// 全部欄位以 alias 對齊前端 camelCase；id 以 ::text 回避 BigInt 序列化。

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/rbac";

type CourtRow = {
  id: string;
  name: string;
  address: string;
  city: string | null;
  type: string | null;
  numCourts: number | null;
  hourlyRate: number | null;
  partnerStatus: string;
  dataSource: string;
  isVerified: boolean;
  status: string;
  googlePlaceId: string | null;
};

export async function GET(req: Request) {
  const guard = await requireAdmin("courts");
  if (!guard.ok) {
    return NextResponse.json({ error: "forbidden" }, { status: guard.status });
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const city = (url.searchParams.get("city") ?? "").trim();
  const status = (url.searchParams.get("status") ?? "").trim();

  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const rawLimit = parseInt(url.searchParams.get("limit") ?? "20", 10) || 20;
  const limit = Math.min(100, Math.max(1, rawLimit));
  const offset = (page - 1) * limit;

  const conds: Prisma.Sql[] = [];
  if (q) {
    const like = `%${q}%`;
    conds.push(Prisma.sql`(name ILIKE ${like} OR address ILIKE ${like})`);
  }
  if (city) conds.push(Prisma.sql`city = ${city}`);
  if (status) conds.push(Prisma.sql`status = ${status}`);
  const where = conds.length
    ? Prisma.sql`WHERE ${Prisma.join(conds, " AND ")}`
    : Prisma.empty;

  const totalRows = await prisma.$queryRaw<{ count: bigint }[]>(
    Prisma.sql`SELECT count(*)::bigint AS count FROM courts ${where}`
  );
  const total = totalRows[0] ? Number(totalRows[0].count) : 0;

  const data = await prisma.$queryRaw<CourtRow[]>(
    Prisma.sql`
      SELECT id::text         AS id,
             name,
             address,
             city,
             type,
             num_courts       AS "numCourts",
             hourly_rate      AS "hourlyRate",
             partner_status   AS "partnerStatus",
             data_source      AS "dataSource",
             is_verified      AS "isVerified",
             status,
             google_place_id  AS "googlePlaceId"
      FROM courts
      ${where}
      ORDER BY (type IS NULL) DESC, id
      LIMIT ${limit} OFFSET ${offset}
    `
  );

  return NextResponse.json({
    data,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
}

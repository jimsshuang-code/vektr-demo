export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/rbac";
import { auditLog, clientIp } from "@/app/lib/audit";

function serialize(obj: unknown) {
  return JSON.parse(
    JSON.stringify(obj, (_k, v) => (typeof v === "bigint" ? v.toString() : v))
  );
}

const EDITABLE = [
  "name", "address", "city", "district", "lat", "lng", "type",
  "numCourts", "hourlyRate", "amenities", "photos", "phone",
  "partnerStatus", "commissionRate",
] as const;

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin("courts");
  if (!guard.ok) return NextResponse.json({ error: "unauthorized" }, { status: guard.status });

  const { id } = await ctx.params;
  let courtId: bigint;
  try { courtId = BigInt(id); } catch { return NextResponse.json({ error: "bad id" }, { status: 400 }); }

  const court = await prisma.court.findUnique({
    where: { id: courtId },
    include: { hours: { orderBy: { dayOfWeek: "asc" } } },
  });
  if (!court) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json({ data: serialize(court) });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin("courts", { write: true });
  if (!guard.ok) return NextResponse.json({ error: "forbidden" }, { status: guard.status });

  const { id } = await ctx.params;
  let courtId: bigint;
  try { courtId = BigInt(id); } catch { return NextResponse.json({ error: "bad id" }, { status: 400 }); }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "bad body" }, { status: 400 });

  const data: Record<string, unknown> = {};
  for (const key of EDITABLE) { if (key in body) data[key] = body[key]; }
  if (Object.keys(data).length === 0) return NextResponse.json({ error: "no editable fields" }, { status: 400 });
  data.updatedAt = new Date();

  const before = await prisma.court.findUnique({ where: { id: courtId } });
  if (!before) return NextResponse.json({ error: "not found" }, { status: 404 });

  const after = await prisma.court.update({ where: { id: courtId }, data });

  await auditLog({
    adminId: guard.adminId, action: "court.update", targetType: "court",
    targetId: courtId, before, after, ip: clientIp(req),
  });

  return NextResponse.json({ data: serialize(after) });
}

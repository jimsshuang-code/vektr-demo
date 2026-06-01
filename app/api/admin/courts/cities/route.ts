export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/rbac";

export async function GET() {
  const guard = await requireAdmin("courts");
  if (!guard.ok) return NextResponse.json({ error: "unauthorized" }, { status: guard.status });

  const rows = await prisma.court.findMany({
    where: { city: { not: null } },
    distinct: ["city"],
    select: { city: true },
    orderBy: { city: "asc" },
  });

  const cities = rows.map((r) => r.city).filter(Boolean) as string[];
  return NextResponse.json({ cities });
}

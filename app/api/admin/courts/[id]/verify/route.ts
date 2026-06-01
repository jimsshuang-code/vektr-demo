// app/api/admin/courts/[id]/verify/route.ts
// 切換球場「認證」狀態（is_verified）。場主認領流程上線後也會走這支。
// 寫入操作 → requireAdmin write 守門 + auditLog 留痕。

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/rbac";
import { auditLog, clientIp } from "@/app/lib/audit";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin("courts", { write: true });
  if (!guard.ok) {
    return NextResponse.json({ error: "forbidden" }, { status: guard.status });
  }

  const { id: idStr } = await ctx.params;
  let id: bigint;
  try {
    id = BigInt(idStr);
  } catch {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const body = (await req.json().catch(() => null)) as { isVerified?: boolean } | null;
  if (typeof body?.isVerified !== "boolean") {
    return NextResponse.json(
      { error: "isVerified (boolean) required" },
      { status: 400 }
    );
  }
  const isVerified = body.isVerified;

  const before = await prisma.$queryRaw<{ id: string; isVerified: boolean }[]>`
    SELECT id::text AS id, is_verified AS "isVerified" FROM courts WHERE id = ${id}
  `;
  if (before.length === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (before[0].isVerified === isVerified) {
    return NextResponse.json({ ok: true, id: idStr, isVerified, changed: false });
  }

  await prisma.$executeRaw`
    UPDATE courts SET is_verified = ${isVerified}, updated_at = now() WHERE id = ${id}
  `;

  await auditLog({
    adminId: guard.adminId,
    action: isVerified ? "court.verify" : "court.unverify",
    targetType: "court",
    targetId: id,
    before: before[0],
    after: { isVerified },
    ip: clientIp(req),
  });

  return NextResponse.json({ ok: true, id: idStr, isVerified, changed: true });
}

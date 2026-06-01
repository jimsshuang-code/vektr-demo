// app/api/admin/courts/[id]/status/route.ts
// 變更球場上架狀態：active（上架中）/ hidden（隱藏）/ rejected（剔除雜訊）。
// 寫入操作 → requireAdmin write 守門 + auditLog 留痕。

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/rbac";
import { auditLog, clientIp } from "@/app/lib/audit";

const ALLOWED = ["active", "hidden", "rejected"] as const;
type Status = (typeof ALLOWED)[number];

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

  const body = (await req.json().catch(() => null)) as { status?: string } | null;
  const status = body?.status as Status | undefined;
  if (!status || !ALLOWED.includes(status)) {
    return NextResponse.json(
      { error: `status must be one of ${ALLOWED.join(" / ")}` },
      { status: 400 }
    );
  }

  const before = await prisma.$queryRaw<{ id: string; status: string }[]>`
    SELECT id::text AS id, status FROM courts WHERE id = ${id}
  `;
  if (before.length === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (before[0].status === status) {
    return NextResponse.json({ ok: true, id: idStr, status, changed: false });
  }

  await prisma.$executeRaw`
    UPDATE courts SET status = ${status}, updated_at = now() WHERE id = ${id}
  `;

  await auditLog({
    adminId: guard.adminId,
    action: `court.status.${status}`,
    targetType: "court",
    targetId: id,
    before: before[0],
    after: { status },
    ip: clientIp(req),
  });

  return NextResponse.json({ ok: true, id: idStr, status, changed: true });
}

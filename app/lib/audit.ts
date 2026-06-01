import { prisma } from "@/app/lib/prisma";
import { Prisma } from "@prisma/client";

export async function auditLog(params: {
  adminId: bigint;
  action: string;
  targetType: string;
  targetId?: bigint | number | null;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      adminId: params.adminId,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId == null ? null : BigInt(params.targetId),
      before: params.before === undefined ? Prisma.JsonNull : toJson(params.before),
      after: params.after === undefined ? Prisma.JsonNull : toJson(params.after),
      ipAddress: params.ip ?? null,
    },
  });
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(
    JSON.stringify(value, (_key, v) =>
      typeof v === "bigint" ? v.toString() : v
    )
  ) as Prisma.InputJsonValue;
}

export function clientIp(req: Request): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}

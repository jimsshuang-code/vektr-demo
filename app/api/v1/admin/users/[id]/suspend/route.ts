import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/rbac";
import { auditLog, clientIp } from "@/app/lib/audit";
import { adminSuspendUser, adminUnsuspendUser } from "@/app/lib/reportsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseUserId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// POST /api/v1/admin/users/:id/suspend  停權  body: { reason, until? }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin("members", { write: true });
  if (!guard.ok) return NextResponse.json({ error: "forbidden" }, { status: guard.status });

  const { id } = await params;
  const userId = parseUserId(id);
  if (userId === null) return NextResponse.json({ error: "invalid_id" }, { status: 400 });

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    /* reason validated below */
  }

  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : "";
  if (!reason) return NextResponse.json({ error: "reason_required" }, { status: 400 });

  let until: string | null = null;
  if (body.until != null) {
    const d = new Date(String(body.until));
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: "invalid_until" }, { status: 400 });
    }
    until = d.toISOString();
  }

  try {
    await adminSuspendUser(Number(guard.adminId), userId, reason, until);
    await auditLog({
      adminId: guard.adminId,
      action: "user.suspend",
      targetType: "user",
      targetId: userId,
      after: { reason, until },
      ip: clientIp(req),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/not found/.test(msg)) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (/admin required/.test(msg)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    console.error("[admin/suspend] failed:", msg);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// DELETE /api/v1/admin/users/:id/suspend  解除停權
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin("members", { write: true });
  if (!guard.ok) return NextResponse.json({ error: "forbidden" }, { status: guard.status });

  const { id } = await params;
  const userId = parseUserId(id);
  if (userId === null) return NextResponse.json({ error: "invalid_id" }, { status: 400 });

  try {
    await adminUnsuspendUser(Number(guard.adminId), userId);
    await auditLog({
      adminId: guard.adminId,
      action: "user.unsuspend",
      targetType: "user",
      targetId: userId,
      ip: clientIp(req),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/not found/.test(msg)) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (/admin required/.test(msg)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    console.error("[admin/unsuspend] failed:", msg);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

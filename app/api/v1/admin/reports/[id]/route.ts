import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/rbac";
import { auditLog, clientIp } from "@/app/lib/audit";
import { adminResolveReport } from "@/app/lib/reportsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID = ["pending", "reviewing", "resolved", "dismissed"] as const;
type Status = (typeof VALID)[number];

// PATCH /api/v1/admin/reports/:id  結案 / 改狀態
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin("members", { write: true });
  if (!guard.ok) return NextResponse.json({ error: "forbidden" }, { status: guard.status });

  const { id } = await params;
  const reportId = Number(id);
  if (!Number.isInteger(reportId) || reportId <= 0) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const status = String(body.status ?? "") as Status;
  if (!VALID.includes(status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }
  const resolution = typeof body.resolution === "string" ? body.resolution.slice(0, 2000) : null;

  try {
    await adminResolveReport(Number(guard.adminId), reportId, status, resolution);
    await auditLog({
      adminId: guard.adminId,
      action: "match_report.resolve",
      targetType: "match_report",
      targetId: reportId,
      after: { status, resolution },
      ip: clientIp(req),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/not found/.test(msg)) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (/admin required/.test(msg)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    console.error("[admin/reports] resolve failed:", msg);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

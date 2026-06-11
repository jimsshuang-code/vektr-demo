import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/rbac";
import { adminSetCoachStatus } from "@/app/lib/coachesDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PATCH /api/v1/admin/coaches/[id] — 後台審核教練(核准/退回);需 admin/super_admin
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin("coaches", { write: true });
  if (!guard.ok) {
    return NextResponse.json({ error: "forbidden" }, { status: guard.status });
  }
  try {
    const { id } = await params;
    const coachId = Number(id);
    const b = await req.json();
    const status = String(b.status ?? "");
    if (!["active", "rejected", "pending"].includes(status)) {
      return NextResponse.json({ error: "invalid status" }, { status: 400 });
    }
    const ok = await adminSetCoachStatus(coachId, status as "active" | "rejected" | "pending");
    if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

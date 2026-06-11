import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/rbac";
import { adminSetReservationStatus } from "@/app/lib/reservationsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PATCH /api/v1/admin/reservations/[id] — 後台(代球場端)接受/婉拒預約。需 courts 寫入權。
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin("courts", { write: true });
  if (!guard.ok) return NextResponse.json({ error: "forbidden" }, { status: guard.status });
  try {
    const { id } = await params;
    const b = await req.json();
    const status = String(b.status ?? "");
    if (!["confirmed", "declined", "pending", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "invalid status" }, { status: 400 });
    }
    const ok = await adminSetReservationStatus(Number(id), status as "confirmed" | "declined" | "pending" | "cancelled");
    if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

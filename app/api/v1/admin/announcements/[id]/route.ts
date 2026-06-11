import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/rbac";
import { setAnnouncementActive, deleteAnnouncement } from "@/app/lib/marketingDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PATCH /api/v1/admin/announcements/[id] — 切換啟用
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin("content", { write: true });
  if (!guard.ok) return NextResponse.json({ error: "forbidden" }, { status: guard.status });
  try {
    const { id } = await params;
    const b = await req.json();
    const ok = await setAnnouncementActive(Number(id), !!b.active);
    if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/v1/admin/announcements/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin("content", { write: true });
  if (!guard.ok) return NextResponse.json({ error: "forbidden" }, { status: guard.status });
  try {
    const { id } = await params;
    const ok = await deleteAnnouncement(Number(id));
    if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

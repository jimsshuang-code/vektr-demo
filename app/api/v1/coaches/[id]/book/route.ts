import { NextRequest, NextResponse } from "next/server";
import { createBooking } from "@/app/lib/coachesDb";
import { getCurrentUser } from "@/app/lib/currentUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/v1/coaches/[id]/book — 學員送出預約需求(平台記錄,後台/教練再聯繫;無付款)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const coachId = Number(id);
    if (!Number.isFinite(coachId)) {
      return NextResponse.json({ error: "bad id" }, { status: 400 });
    }
    const b = await req.json();
    const student_name = String(b.student_name ?? "").trim();
    const student_contact = String(b.student_contact ?? "").trim();
    if (!student_name || !student_contact) {
      return NextResponse.json({ error: "姓名與聯絡方式為必填" }, { status: 400 });
    }
    const me = await getCurrentUser();
    const r = await createBooking(coachId, {
      student_user_id: me?.id ?? null,
      student_name: student_name.slice(0, 100),
      student_contact: student_contact.slice(0, 200),
      preferred_time: b.preferred_time ? String(b.preferred_time).slice(0, 200) : null,
      message: b.message ? String(b.message).slice(0, 2000) : null,
    });
    if (!r.ok) {
      return NextResponse.json({ error: "這位教練目前無法預約" }, { status: 409 });
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

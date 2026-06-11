import { NextRequest, NextResponse } from "next/server";
import { createReservation } from "@/app/lib/reservationsDb";
import { getCurrentUser } from "@/app/lib/currentUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/v1/courts/[id]/reserve — 送出球場預約(現場付款,平台只記錄+後台確認)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const courtId = Number(id);
    if (!Number.isFinite(courtId)) return NextResponse.json({ error: "bad id" }, { status: 400 });

    const b = await req.json();
    const contact_name = String(b.contact_name ?? "").trim();
    const contact = String(b.contact ?? "").trim();
    const reserve_date = String(b.reserve_date ?? "").trim();
    const time_slot = String(b.time_slot ?? "").trim();
    if (!contact_name || !contact || !reserve_date || !time_slot) {
      return NextResponse.json({ error: "稱呼、聯絡方式、日期、時段為必填" }, { status: 400 });
    }
    const me = await getCurrentUser();
    const party = b.party_size != null && b.party_size !== "" ? Number(b.party_size) : null;
    const r = await createReservation(courtId, {
      user_id: me?.id ?? null,
      contact_name: contact_name.slice(0, 100),
      contact: contact.slice(0, 200),
      reserve_date,
      time_slot: time_slot.slice(0, 100),
      party_size: Number.isFinite(party as number) ? party : null,
      note: b.note ? String(b.note).slice(0, 2000) : null,
    });
    if (!r.ok) return NextResponse.json({ error: "這個球場目前無法預約" }, { status: 409 });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createCoachApplication } from "@/app/lib/coachesDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/v1/coaches/apply — 公開:送出教練申請(status=pending,待後台審核)
export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const name = String(b.name ?? "").trim();
    const contact = String(b.contact ?? "").trim();
    if (!name || !contact) {
      return NextResponse.json({ error: "姓名與聯絡方式為必填" }, { status: 400 });
    }
    const dupr = b.dupr_rating != null && b.dupr_rating !== "" ? Number(b.dupr_rating) : null;
    const rate = b.hourly_rate != null && b.hourly_rate !== "" ? Number(b.hourly_rate) : null;
    const id = await createCoachApplication({
      name: name.slice(0, 100),
      contact: contact.slice(0, 200),
      bio: b.bio ? String(b.bio).slice(0, 2000) : null,
      city: b.city ? String(b.city).slice(0, 50) : null,
      district: b.district ? String(b.district).slice(0, 50) : null,
      specialties: b.specialties ? String(b.specialties).slice(0, 500) : null,
      dupr_rating: Number.isFinite(dupr as number) ? dupr : null,
      hourly_rate: Number.isFinite(rate as number) ? rate : null,
    });
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

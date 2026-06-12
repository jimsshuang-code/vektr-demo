import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/app/lib/currentUser";
import { withUser } from "@/app/lib/matchDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/v1/member/profile — 更新個人資料(目前:顯示名稱)。需登入。
export async function POST(req: NextRequest) {
  try {
    const me = await requireUser();
    const b = await req.json();
    const name = String(b.name ?? "").trim();
    if (!name) return NextResponse.json({ error: "暱稱不可為空" }, { status: 400 });
    if (name.length > 30) return NextResponse.json({ error: "暱稱最多 30 字" }, { status: 400 });
    await withUser(me.id, async (c) => {
      await c.query("UPDATE users SET name = $1 WHERE id = $2", [name, me.id]);
    });
    return NextResponse.json({ ok: true, name });
  } catch (e) {
    const status = (e as { status?: number })?.status ?? 500;
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status });
  }
}

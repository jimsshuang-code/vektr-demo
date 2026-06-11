import { NextResponse } from "next/server";
import { pool } from "@/app/lib/db";
import { requireUser } from "@/app/lib/currentUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/v1/member/delete — 球友刪除自己的帳號(Apple App Store 硬性要求)。
// 刪除本人與其關聯資料(SECURITY DEFINER 函式)。前端成功後應呼叫 signOut。
export async function POST() {
  try {
    const me = await requireUser();
    await pool.query("SELECT delete_user_account($1)", [me.id]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const status = (e as { status?: number })?.status ?? 500;
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status });
  }
}

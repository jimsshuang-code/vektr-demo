import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/app/lib/db";
import { getCurrentUser } from "@/app/lib/currentUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/push/register — App(vektr-native.js)註冊推播裝置 token。
// 以 token 為唯一鍵 upsert,綁定目前登入球友(未登入則先存 user_id=null)。
export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const token = String(b.token ?? "").trim();
    const platform = b.platform ? String(b.platform).slice(0, 20) : null;
    if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });

    const me = await getCurrentUser();
    await pool.query(
      `INSERT INTO device_tokens (user_id, token, platform)
       VALUES ($1,$2,$3)
       ON CONFLICT (token) DO UPDATE SET
         user_id = COALESCE(EXCLUDED.user_id, device_tokens.user_id),
         platform = EXCLUDED.platform,
         updated_at = now()`,
      [me?.id ?? null, token, platform]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

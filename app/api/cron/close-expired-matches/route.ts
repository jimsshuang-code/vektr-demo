// app/api/cron/close-expired-matches/route.ts
// 排程任務:關閉已過結束時間的開放球局(呼叫 SQL 函式 match_close_expired)。
// 由 Vercel Cron 觸發(見 vercel.json)。Vercel 會自動帶 Authorization: Bearer $CRON_SECRET。
// 安全:必須設定 CRON_SECRET 環境變數;未帶正確 bearer 一律 401。
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/app/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // 未設定一律拒絕,避免裸奔
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

async function run(req: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const r = await pool.query("SELECT match_close_expired() AS closed");
    const closed = Number(r.rows[0]?.closed ?? 0);
    return NextResponse.json({ ok: true, closed, at: new Date().toISOString() });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Vercel Cron 以 GET 觸發;保留 POST 供手動/其他排程器使用。
export async function GET(req: NextRequest) {
  return run(req);
}
export async function POST(req: NextRequest) {
  return run(req);
}

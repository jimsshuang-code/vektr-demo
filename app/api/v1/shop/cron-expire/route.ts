// POST /api/v1/shop/cron-expire — 逾期未付訂單取消+回補庫存
// 掛進既有 cron 排程(與過期房 cron 同一機制),Authorization: Bearer ${CRON_SECRET}
import { NextResponse } from "next/server";
import { expireOrders } from "@/app/lib/orderDb";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const cancelled = await expireOrders();
  return NextResponse.json({ ok: true, cancelled });
}

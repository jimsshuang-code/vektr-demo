import { NextRequest, NextResponse } from "next/server";
import { ecpayConfig, buildAioParams } from "@/app/lib/payment/ecpay";
import { createOrder, genRef } from "@/app/lib/payment/orders";
import { getCurrentUser } from "@/app/lib/currentUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://vektr.com.tw";

// POST /api/v1/pay/create — 建立付款訂單並回傳綠界 AioCheckOut 表單參數。
// 預留:未啟用(PAYMENTS_ENABLED!=1 或缺 ECPAY 設定)時回 503,不影響其他功能。
export async function POST(req: NextRequest) {
  const cfg = ecpayConfig();
  if (!cfg.enabled) {
    return NextResponse.json({ error: "線上付款尚未啟用" }, { status: 503 });
  }
  try {
    const b = await req.json();
    const amount = Number(b.amount);
    const kind = String(b.kind ?? "generic");
    if (!Number.isInteger(amount) || amount <= 0) {
      return NextResponse.json({ error: "金額不正確" }, { status: 400 });
    }
    const me = await getCurrentUser();
    const ref = genRef();
    await createOrder({
      ref,
      user_id: me?.id ?? null,
      kind,
      related_id: b.related_id != null ? Number(b.related_id) : null,
      amount,
      description: b.description ? String(b.description).slice(0, 200) : null,
    });
    const params = buildAioParams({
      merchantTradeNo: ref,
      amount,
      itemName: String(b.item_name ?? "VEKTR 訂單").slice(0, 200),
      tradeDesc: String(b.description ?? "VEKTR").slice(0, 200),
      returnUrl: `${SITE}/api/v1/pay/ecpay/callback`,
      clientBackUrl: `${SITE}${b.back_path ?? "/member"}`,
    });
    // 前端用這些參數 auto-submit 一個 form 到 action
    return NextResponse.json({ action: cfg.aioUrl, params });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

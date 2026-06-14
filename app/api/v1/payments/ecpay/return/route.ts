// ============================================================================
// POST /api/v1/payments/ecpay/return — 綠界付款結果(server-to-server)
// 驗 CheckMacValue;RtnCode=1 → 訂單轉 paid。必須回純文字 "1|OK",
// 否則綠界會重送(重送間隔遞增,最多數次)→ markPaid 已做冪等。
// ============================================================================
import { parseFormBody, verifyPaymentCallback } from "@/app/lib/ecpay";
import { markPaid } from "@/app/lib/orderDb";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const params = await parseFormBody(req);

  if (!verifyPaymentCallback(params)) {
    console.error("[ecpay/return] bad CheckMacValue", params.MerchantTradeNo);
    return new Response("0|CheckMacValue Error", { status: 400 });
  }

  const orderNo = params.MerchantTradeNo ?? "";
  if (params.RtnCode === "1") {
    const ok = await markPaid(
      orderNo,
      params.TradeNo ?? "",
      params.PaymentType ?? "Credit",
      params
    );
    if (!ok) console.error("[ecpay/return] order not found/paid-able:", orderNo);
  } else {
    // 付款失敗:留在 pending/awaiting_payment,由 cron 逾期回收
    console.warn("[ecpay/return] RtnCode!=1:", orderNo, params.RtnCode, params.RtnMsg);
  }

  return new Response("1|OK");
}

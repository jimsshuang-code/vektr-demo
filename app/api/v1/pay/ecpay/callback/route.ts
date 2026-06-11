import { NextRequest, NextResponse } from "next/server";
import { ecpayConfig, verifyCallback } from "@/app/lib/payment/ecpay";
import { markOrderPaid, markOrderFailed } from "@/app/lib/payment/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/v1/pay/ecpay/callback — 綠界 server-to-server 付款結果通知(ReturnURL)。
// 預留:未啟用時回 503。啟用後驗證 CheckMacValue,RtnCode==1 標記付款成功。
// 綠界要求回應純文字「1|OK」表示已正確接收。
export async function POST(req: NextRequest) {
  const cfg = ecpayConfig();
  if (!cfg.enabled) {
    return NextResponse.json({ error: "disabled" }, { status: 503 });
  }
  try {
    const form = await req.formData();
    const body: Record<string, string> = {};
    form.forEach((v, k) => (body[k] = String(v)));

    if (!verifyCallback(body)) {
      return new NextResponse("0|CheckMacValue Error", { status: 400 });
    }
    const ref = body.MerchantTradeNo;
    if (body.RtnCode === "1") {
      await markOrderPaid(ref, body.TradeNo ?? "");
      // TODO(啟用時):依 payment_orders.kind 觸發後續(確認預約 / 開通服務)
    } else {
      await markOrderFailed(ref);
    }
    return new NextResponse("1|OK", { status: 200 });
  } catch {
    return new NextResponse("0|Error", { status: 500 });
  }
}

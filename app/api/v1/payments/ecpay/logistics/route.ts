// ============================================================================
// POST /api/v1/payments/ecpay/logistics — 綠界物流狀態回傳
// 驗 MD5 CheckMacValue;關鍵節點更新 shipped / completed。需回 "1|OK"。
// ============================================================================
import {
  parseFormBody,
  verifyLogisticsCallback,
  logisticsStatusToOrderStatus,
} from "@/app/lib/ecpay";
import { updateLogisticsStatus } from "@/app/lib/orderDb";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const params = await parseFormBody(req);

  if (!verifyLogisticsCallback(params)) {
    console.error("[ecpay/logistics] bad CheckMacValue", params.MerchantTradeNo);
    return new Response("0|CheckMacValue Error", { status: 400 });
  }

  const orderNo = params.MerchantTradeNo ?? "";
  const next = logisticsStatusToOrderStatus(
    params.RtnCode ?? "",
    params.LogisticsSubType ?? ""
  );
  if (next) {
    await updateLogisticsStatus(orderNo, next, params);
  }
  // 其他中繼狀態僅記錄(綠界會多次回傳)
  return new Response("1|OK");
}

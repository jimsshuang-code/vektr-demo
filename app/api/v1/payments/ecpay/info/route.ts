// ============================================================================
// POST /api/v1/payments/ecpay/info — ATM 虛擬帳號 / 超商代碼「取號結果」
// (非同步付款第一步;用戶之後實際繳費才會打 /return)。需回 "1|OK"。
// ============================================================================
import { parseFormBody, verifyPaymentCallback } from "@/app/lib/ecpay";
import { savePaymentInfo } from "@/app/lib/orderDb";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const params = await parseFormBody(req);

  if (!verifyPaymentCallback(params)) {
    console.error("[ecpay/info] bad CheckMacValue", params.MerchantTradeNo);
    return new Response("0|CheckMacValue Error", { status: 400 });
  }

  // RtnCode:ATM 取號成功=2,CVS 取號成功=10100073
  const okCodes = new Set(["2", "10100073"]);
  if (okCodes.has(params.RtnCode ?? "")) {
    await savePaymentInfo(
      params.MerchantTradeNo ?? "",
      {
        paymentType: params.PaymentType ?? "",
        bankCode: params.BankCode,
        vAccount: params.vAccount,
        paymentNo: params.PaymentNo,
        expireDate: params.ExpireDate,
      },
      params
    );
  } else {
    console.warn("[ecpay/info] 取號失敗:", params.MerchantTradeNo, params.RtnCode);
  }

  return new Response("1|OK");
}

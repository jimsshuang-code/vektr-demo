// ============================================================================
// POST /api/v1/payments/ecpay/result — OrderResultURL(用戶瀏覽器被綠界 POST 導回)
// page route 收不到 POST,故由此驗章後 302 到 /shop/checkout/result 顯示。
// 注意:實際入帳以 /return(server-to-server)為準,此處僅作前端顯示。
// ============================================================================
import { parseFormBody, verifyPaymentCallback } from "@/app/lib/ecpay";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const params = await parseFormBody(req);
  const orderNo = encodeURIComponent(params.MerchantTradeNo ?? "");
  const verified = verifyPaymentCallback(params);
  const ok = verified && params.RtnCode === "1" ? "1" : "0";
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.vektr.com.tw").replace(/\/$/, "");
  return Response.redirect(`${site}/shop/checkout/result?orderNo=${orderNo}&ok=${ok}`, 302);
}

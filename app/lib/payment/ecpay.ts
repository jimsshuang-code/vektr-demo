// app/lib/payment/ecpay.ts
// 綠界 ECPay AIO 串接「預留」骨架。尚未啟用(由 PAYMENTS_ENABLED 控制)。
// 之後決定收費模式 + 用沙盒測通後再啟用。實際串接前務必用綠界測試環境驗證 CheckMacValue。
import crypto from "node:crypto";

export const ecpayConfig = () => ({
  enabled: process.env.PAYMENTS_ENABLED === "1" && !!process.env.ECPAY_MERCHANT_ID,
  merchantId: process.env.ECPAY_MERCHANT_ID ?? "",
  hashKey: process.env.ECPAY_HASH_KEY ?? "",
  hashIV: process.env.ECPAY_HASH_IV ?? "",
  // 沙盒:https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5
  // 正式:https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5
  aioUrl:
    process.env.ECPAY_ENV === "production"
      ? "https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5"
      : "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5",
});

// 綠界 .NET 風格 URL encode(供 CheckMacValue 計算)
function dotNetUrlEncode(s: string): string {
  return encodeURIComponent(s)
    .toLowerCase()
    .replace(/%20/g, "+")
    .replace(/%21/g, "!")
    .replace(/%2a/g, "*")
    .replace(/%28/g, "(")
    .replace(/%29/g, ")")
    .replace(/%2d/g, "-")
    .replace(/%5f/g, "_")
    .replace(/%2e/g, ".");
}

// 計算 CheckMacValue(SHA256)。params 不含 CheckMacValue 本身。
export function checkMacValue(params: Record<string, string>): string {
  const { hashKey, hashIV } = ecpayConfig();
  const sorted = Object.keys(params)
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  const raw = `HashKey=${hashKey}&${sorted}&HashIV=${hashIV}`;
  const encoded = dotNetUrlEncode(raw);
  return crypto.createHash("sha256").update(encoded).digest("hex").toUpperCase();
}

// 組出送往綠界 AioCheckOut 的表單參數(含 CheckMacValue)。
export function buildAioParams(input: {
  merchantTradeNo: string;
  amount: number;
  itemName: string;
  tradeDesc: string;
  returnUrl: string; // server-to-server 付款結果通知
  clientBackUrl: string; // 付款完成導回前台
}): Record<string, string> {
  const { merchantId } = ecpayConfig();
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const merchantTradeDate = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const params: Record<string, string> = {
    MerchantID: merchantId,
    MerchantTradeNo: input.merchantTradeNo,
    MerchantTradeDate: merchantTradeDate,
    PaymentType: "aio",
    TotalAmount: String(input.amount),
    TradeDesc: input.tradeDesc,
    ItemName: input.itemName,
    ReturnURL: input.returnUrl,
    ClientBackURL: input.clientBackUrl,
    ChoosePayment: "ALL",
    EncryptType: "1",
  };
  params.CheckMacValue = checkMacValue(params);
  return params;
}

// 驗證綠界回傳的 CheckMacValue 是否相符
export function verifyCallback(body: Record<string, string>): boolean {
  const received = body.CheckMacValue;
  if (!received) return false;
  const rest: Record<string, string> = {};
  for (const [k, v] of Object.entries(body)) if (k !== "CheckMacValue") rest[k] = v;
  return checkMacValue(rest) === received;
}

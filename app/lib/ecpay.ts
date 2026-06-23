// ============================================================================
// app/lib/ecpay.ts — 綠界(ECPay)金流 + 物流串接。零外部依賴(node:crypto)。
// ----------------------------------------------------------------------------
// 金流:AIO 全方位收銀台 V5(EncryptType=1, SHA256)
// 物流:超商取貨 C2C(UNIMARTC2C / FAMIC2C)+ 宅配 TCAT(CheckMacValue 用 MD5)
//
// 環境變數:
//   ECPAY_ENV=stage|production
//   ECPAY_MERCHANT_ID / ECPAY_HASH_KEY / ECPAY_HASH_IV                 (金流)
//   ECPAY_LOGISTICS_MERCHANT_ID / ECPAY_LOGISTICS_HASH_KEY / _HASH_IV  (物流)
//   ECPAY_SENDER_NAME / ECPAY_SENDER_PHONE                             (寄件人)
//   NEXT_PUBLIC_SITE_URL=https://www.vektr.com.tw
//
// 綠界 stage 公用測試值見 README(2000132 / 5294y06JbISpM5x9 / v77hoKGq4kWxNNIS)。
// ============================================================================

import { createHash } from "node:crypto";

const ENV = process.env.ECPAY_ENV === "production" ? "production" : "stage";

export const ECPAY_URLS = {
  aioCheckout:
    ENV === "production"
      ? "https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5"
      : "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5",
  logisticsMap:
    ENV === "production"
      ? "https://logistics.ecpay.com.tw/Express/map"
      : "https://logistics-stage.ecpay.com.tw/Express/map",
  logisticsCreate:
    ENV === "production"
      ? "https://logistics.ecpay.com.tw/Express/Create"
      : "https://logistics-stage.ecpay.com.tw/Express/Create",
};

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`missing env: ${name}`);
  return v;
}

const siteUrl = () =>
  (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.vektr.com.tw").replace(/\/$/, "");

// ----------------------------------------------------------------------------
// CheckMacValue
// 規則:參數依 key 排序 → HashKey 前綴 + HashIV 後綴 → URL encode → 轉小寫
//       → .NET 式字元修正 → hash → 轉大寫。金流 SHA256、物流 MD5。
// ----------------------------------------------------------------------------

/** encodeURIComponent → .NET HttpUtility.UrlEncode 對齊 */
function dotNetUrlEncode(s: string): string {
  return encodeURIComponent(s)
    .replace(/%20/g, "+")
    .replace(/'/g, "%27")
    .replace(/~/g, "%7E")
    .replace(/!/g, "%21") // 與 .NET 舊版一致;綠界規格將 %21 還原為 !
    .replace(/%21/g, "!")
    .replace(/\(/g, "(")
    .replace(/\)/g, ")");
}

export function buildCheckMacValue(
  params: Record<string, string | number>,
  hashKey: string,
  hashIV: string,
  algo: "sha256" | "md5" = "sha256"
): string {
  const sorted = Object.keys(params)
    .filter((k) => k !== "CheckMacValue")
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase(), "en"))
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  const raw = `HashKey=${hashKey}&${sorted}&HashIV=${hashIV}`;
  const encoded = dotNetUrlEncode(raw).toLowerCase();
  return createHash(algo).update(encoded).digest("hex").toUpperCase();
}

export function verifyCheckMacValue(
  params: Record<string, string>,
  hashKey: string,
  hashIV: string,
  algo: "sha256" | "md5" = "sha256"
): boolean {
  const given = params.CheckMacValue;
  if (!given) return false;
  return buildCheckMacValue(params, hashKey, hashIV, algo) === given.toUpperCase();
}

/** 綠界日期格式 yyyy/MM/dd HH:mm:ss(台北時間) */
export function ecpayTradeDate(d: Date = new Date()): string {
  const t = new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const g = (type: string) => t.find((p) => p.type === type)?.value ?? "00";
  return `${g("year")}/${g("month")}/${g("day")} ${g("hour")}:${g("minute")}:${g("second")}`;
}

// ----------------------------------------------------------------------------
// 金流:AIO 結帳表單參數(前端自動 POST 跳轉)
// ----------------------------------------------------------------------------

export type AioPayment = "Credit" | "CVS" | "ATM";

export function buildAioCheckout(opts: {
  orderNo: string;          // = MerchantTradeNo(<=20 字)
  totalTwd: number;         // 整數新台幣
  itemName: string;         // 商品名以 # 分隔,<=400 字
  payment: AioPayment;
  tradeDesc?: string;
}): { action: string; fields: Record<string, string> } {
  const merchantId = env("ECPAY_MERCHANT_ID");
  const base: Record<string, string | number> = {
    MerchantID: merchantId,
    MerchantTradeNo: opts.orderNo,
    MerchantTradeDate: ecpayTradeDate(),
    PaymentType: "aio",
    TotalAmount: Math.round(opts.totalTwd),
    TradeDesc: opts.tradeDesc ?? "VEKTR SHOP",
    ItemName: opts.itemName.slice(0, 400),
    ReturnURL: `${siteUrl()}/api/v1/payments/ecpay/return`,
    OrderResultURL: `${siteUrl()}/api/v1/payments/ecpay/result`,
    ClientBackURL: `${siteUrl()}/shop/orders`,
    ChoosePayment: opts.payment,
    EncryptType: 1,
    NeedExtraPaidInfo: "N",
  };
  if (opts.payment === "ATM") {
    base.ExpireDate = 3; // 取號後 3 天繳費期限
    base.PaymentInfoURL = `${siteUrl()}/api/v1/payments/ecpay/info`;
  }
  if (opts.payment === "CVS") {
    base.StoreExpireDate = 4320; // 分鐘 = 3 天
    base.PaymentInfoURL = `${siteUrl()}/api/v1/payments/ecpay/info`;
  }
  const mac = buildCheckMacValue(base, env("ECPAY_HASH_KEY"), env("ECPAY_HASH_IV"), "sha256");
  const fields: Record<string, string> = {};
  for (const [k, v] of Object.entries(base)) fields[k] = String(v);
  fields.CheckMacValue = mac;
  return { action: ECPAY_URLS.aioCheckout, fields };
}

export function verifyPaymentCallback(params: Record<string, string>): boolean {
  return verifyCheckMacValue(params, env("ECPAY_HASH_KEY"), env("ECPAY_HASH_IV"), "sha256");
}

// ----------------------------------------------------------------------------
// 物流:電子地圖(選超商門市)+ 建立託運單 + callback 驗證
// ----------------------------------------------------------------------------

export type CvsSubType = "UNIMARTC2C" | "FAMIC2C";

export function shippingSubType(method: string): CvsSubType | "TCAT" {
  if (method === "cvs_711") return "UNIMARTC2C";
  if (method === "cvs_family") return "FAMIC2C";
  return "TCAT";
}

/** 電子地圖表單(用戶瀏覽器 POST 開啟,選完門市綠界回 POST ServerReplyURL) */
export function buildCvsMapForm(opts: {
  subType: CvsSubType;
  /** 自訂回傳識別,夾帶暫存 key(ExtraData) */
  extraData?: string;
}): { action: string; fields: Record<string, string> } {
  const fields: Record<string, string> = {
    MerchantID: env("ECPAY_LOGISTICS_MERCHANT_ID"),
    LogisticsType: "CVS",
    LogisticsSubType: opts.subType,
    IsCollection: "N", // 不代收貨款(已線上付款)
    ServerReplyURL: `${siteUrl()}/api/v1/payments/ecpay/cvs-store`,
    ExtraData: opts.extraData ?? "",
    Device: "0",
  };
  // 綠界電子地圖需帶 CheckMacValue(物流金鑰、MD5),否則回「找不到加密金鑰」。
  fields.CheckMacValue = buildCheckMacValue(
    fields,
    env("ECPAY_LOGISTICS_HASH_KEY"),
    env("ECPAY_LOGISTICS_HASH_IV"),
    "md5",
  );
  return { action: ECPAY_URLS.logisticsMap, fields };
}

/** 建立物流託運單(後台出貨時呼叫;server-to-server) */
export async function createLogisticsOrder(opts: {
  orderNo: string;
  totalTwd: number;
  itemName: string;
  receiverName: string;
  receiverPhone: string;
  subType: CvsSubType | "TCAT";
  cvsStoreId?: string;     // 超商取貨必填
  homeAddress?: string;    // 宅配必填
}): Promise<{ ok: true; logisticsId: string; trackingNo: string } | { ok: false; error: string }> {
  const isCvs = opts.subType !== "TCAT";
  const params: Record<string, string | number> = {
    MerchantID: env("ECPAY_LOGISTICS_MERCHANT_ID"),
    MerchantTradeNo: opts.orderNo,
    MerchantTradeDate: ecpayTradeDate(),
    LogisticsType: isCvs ? "CVS" : "HOME",
    LogisticsSubType: opts.subType,
    GoodsAmount: Math.round(opts.totalTwd),
    GoodsName: opts.itemName.slice(0, 50),
    SenderName: env("ECPAY_SENDER_NAME"),
    SenderCellPhone: env("ECPAY_SENDER_PHONE"),
    ReceiverName: opts.receiverName.slice(0, 10),
    ReceiverCellPhone: opts.receiverPhone,
    ServerReplyURL: `${siteUrl()}/api/v1/payments/ecpay/logistics`,
  };
  if (isCvs) {
    params.IsCollection = "N";
    params.ReceiverStoreID = opts.cvsStoreId ?? "";
  } else {
    params.SenderAddress = process.env.ECPAY_SENDER_ADDRESS ?? "";
    params.ReceiverAddress = opts.homeAddress ?? "";
    params.Temperature = "0001"; // 常溫
    params.Distance = "00";      // 同縣市;綠界依地址計價,此欄常允許預設
    params.Specification = "0001";
  }
  params.CheckMacValue = buildCheckMacValue(
    params, env("ECPAY_LOGISTICS_HASH_KEY"), env("ECPAY_LOGISTICS_HASH_IV"), "md5"
  );

  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) body.set(k, String(v));

  const res = await fetch(ECPAY_URLS.logisticsCreate, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const text = await res.text();

  // 成功格式:1|AllPayLogisticsID=xxx&...&CVSPaymentNo=xxx&...
  const [code, payload] = text.split("|", 2);
  if (code !== "1" || !payload) return { ok: false, error: text.slice(0, 300) };
  const kv = new URLSearchParams(payload);
  return {
    ok: true,
    logisticsId: kv.get("AllPayLogisticsID") ?? "",
    trackingNo:
      (kv.get("CVSPaymentNo") ?? "") +
      (kv.get("CVSValidationNo") ? `-${kv.get("CVSValidationNo")}` : "") ||
      (kv.get("BookingNote") ?? ""),
  };
}

export function verifyLogisticsCallback(params: Record<string, string>): boolean {
  return verifyCheckMacValue(
    params, env("ECPAY_LOGISTICS_HASH_KEY"), env("ECPAY_LOGISTICS_HASH_IV"), "md5"
  );
}

/** 物流狀態碼 → 訂單狀態(僅取關鍵節點) */
export function logisticsStatusToOrderStatus(rtnCode: string, subType: string): "shipped" | "completed" | null {
  // 出貨節點:C2C 賣家寄件完成 / 宅配已集貨
  const shippedCodes = new Set(["300", "2030", "3024", "3032"]);
  // 完成節點:買家取貨完成 / 宅配送達
  const completedCodes = new Set(["2067", "3022", "3018"]);
  if (completedCodes.has(rtnCode)) return "completed";
  if (shippedCodes.has(rtnCode)) return "shipped";
  void subType;
  return null;
}

// ----------------------------------------------------------------------------
// 工具:解析 callback(application/x-www-form-urlencoded)
// ----------------------------------------------------------------------------
export async function parseFormBody(req: Request): Promise<Record<string, string>> {
  const text = await req.text();
  const out: Record<string, string> = {};
  for (const [k, v] of new URLSearchParams(text)) out[k] = v;
  return out;
}

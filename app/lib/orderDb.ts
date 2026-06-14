// ============================================================================
// app/lib/orderDb.ts — SHOP 訂單資料存取
// ----------------------------------------------------------------------------
// 整合假設(同 A2 reportsDb):
//   - app/lib/matchDb.ts 匯出 withUser(userId, fn) — 交易內 SET LOCAL app.user_id。
//   - app/lib/db.ts 匯出 query(text, params) — 一般 pool 查詢(callback/cron 用,
//     呼叫 SECURITY DEFINER 函式或以服務身分查詢)。
// ============================================================================

import { withUser } from "@/app/lib/matchDb";
import { query } from "@/app/lib/db";

export type CartItem = { variantId: number; qty: number };
export type ShippingMethod = "cvs_711" | "cvs_family" | "home";

export const SHIPPING_FEE_CENTS: Record<ShippingMethod, number> = {
  cvs_711: 6000,    // NT$60
  cvs_family: 6000, // NT$60
  home: 12000,      // NT$120
};
/** 免運門檻 NT$1,500 */
export const FREE_SHIPPING_THRESHOLD_CENTS = 150000;

export type CreateOrderInput = {
  items: CartItem[];
  shippingMethod: ShippingMethod;
  receiverName: string;
  receiverPhone: string;
  cvsStoreId?: string;
  cvsStoreName?: string;
  cvsStoreAddress?: string;
  homeAddress?: string;
};

export type OrderSummary = {
  id: number;
  orderNo: string;
  status: string;
  totalCents: number;
  createdAt: string;
  itemCount: number;
  firstItemName: string | null;
};

export type OrderDetail = OrderSummary & {
  subtotalCents: number;
  shippingCents: number;
  receiverName: string;
  receiverPhone: string;
  shippingMethod: string;
  cvsStoreName: string | null;
  cvsStoreAddress: string | null;
  homeAddress: string | null;
  paymentMethod: string | null;
  atmBankCode: string | null;
  atmVAccount: string | null;
  cvsPaymentNo: string | null;
  paymentExpireAt: string | null;
  trackingNo: string | null;
  items: {
    productName: string;
    variantName: string;
    sku: string;
    unitCents: number;
    qty: number;
    imageUrl: string | null;
  }[];
};

// ---------------------------------------------------------------------------
// 下單(在 withUser 交易內呼叫 SECURITY DEFINER 函式;鎖庫存+扣減+建單)
// 失敗丟 Error,message 為 'insufficient_stock:<id>' 等,API 層轉 409/400。
// ---------------------------------------------------------------------------
export async function createOrder(
  userId: number,
  input: CreateOrderInput
): Promise<{ orderId: number; orderNo: string; subtotalCents: number; totalCents: number }> {
  return withUser(userId, async (client) => {
    const r = await client.query(
      `SELECT * FROM shop_create_order($1, $2::jsonb, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        userId,
        JSON.stringify(input.items.map((i) => ({ variant_id: i.variantId, qty: i.qty }))),
        input.shippingMethod,
        input.receiverName,
        input.receiverPhone,
        await computeShippingCents(input),
        input.cvsStoreId ?? null,
        input.cvsStoreName ?? null,
        input.cvsStoreAddress ?? null,
        input.homeAddress ?? null,
      ]
    );
    const row = r.rows[0];
    const t = await client.query(
      `SELECT subtotal_cents, total_cents FROM shop_orders WHERE id = $1`,
      [row.out_order_id]
    );
    return {
      orderId: Number(row.out_order_id),
      orderNo: String(row.out_order_no),
      subtotalCents: Number(t.rows[0].subtotal_cents),
      totalCents: Number(t.rows[0].total_cents),
    };
  });
}

async function computeShippingCents(input: CreateOrderInput): Promise<number> {
  // 滿額免運;否則依配送方式。小計用現價計算(與 DB 內快照一致性由交易保證)。
  const ids = input.items.map((i) => i.variantId);
  const r = await query(
    `SELECT id, price_cents FROM product_variants WHERE id = ANY($1::int[])`,
    [ids]
  );
  const priceMap = new Map<number, number>(
    r.rows.map((x: Record<string, unknown>) => [Number(x.id), Number(x.price_cents)])
  );
  const subtotal = input.items.reduce(
    (s, i) => s + (priceMap.get(i.variantId) ?? 0) * i.qty, 0
  );
  if (subtotal >= FREE_SHIPPING_THRESHOLD_CENTS) return 0;
  return SHIPPING_FEE_CENTS[input.shippingMethod];
}

// ---------------------------------------------------------------------------
// 查詢(本人)
// ---------------------------------------------------------------------------
export async function listMyOrders(userId: number): Promise<OrderSummary[]> {
  return withUser(userId, async (client) => {
    const r = await client.query(
      `SELECT o.id, o.order_no, o.status, o.total_cents, o.created_at,
              COUNT(i.id) AS item_count, MIN(i.product_name) AS first_item
         FROM shop_orders o
         LEFT JOIN shop_order_items i ON i.order_id = o.id
        WHERE o.user_id = $1
        GROUP BY o.id
        ORDER BY o.created_at DESC
        LIMIT 50`,
      [userId]
    );
    return r.rows.map((x: Record<string, unknown>) => ({
      id: Number(x.id),
      orderNo: String(x.order_no),
      status: String(x.status),
      totalCents: Number(x.total_cents),
      createdAt: String(x.created_at),
      itemCount: Number(x.item_count),
      firstItemName: (x.first_item as string) ?? null,
    }));
  });
}

export async function getMyOrder(userId: number, orderNo: string): Promise<OrderDetail | null> {
  return withUser(userId, async (client) => {
    const r = await client.query(
      `SELECT * FROM shop_orders WHERE order_no = $1 AND user_id = $2`,
      [orderNo, userId]
    );
    if (r.rows.length === 0) return null;
    const o = r.rows[0];
    const items = await client.query(
      `SELECT product_name, variant_name, sku, unit_cents, qty, image_url
         FROM shop_order_items WHERE order_id = $1 ORDER BY id`,
      [o.id]
    );
    return mapOrderDetail(o, items.rows);
  });
}

function mapOrderDetail(o: Record<string, unknown>, items: Record<string, unknown>[]): OrderDetail {
  return {
    id: Number(o.id),
    orderNo: String(o.order_no),
    status: String(o.status),
    totalCents: Number(o.total_cents),
    createdAt: String(o.created_at),
    itemCount: items.length,
    firstItemName: items[0] ? String(items[0].product_name) : null,
    subtotalCents: Number(o.subtotal_cents),
    shippingCents: Number(o.shipping_cents),
    receiverName: String(o.receiver_name),
    receiverPhone: String(o.receiver_phone),
    shippingMethod: String(o.shipping_method),
    cvsStoreName: (o.cvs_store_name as string) ?? null,
    cvsStoreAddress: (o.cvs_store_address as string) ?? null,
    homeAddress: (o.home_address as string) ?? null,
    paymentMethod: (o.payment_method as string) ?? null,
    atmBankCode: (o.atm_bank_code as string) ?? null,
    atmVAccount: (o.atm_v_account as string) ?? null,
    cvsPaymentNo: (o.cvs_payment_no as string) ?? null,
    paymentExpireAt: o.payment_expire_at ? String(o.payment_expire_at) : null,
    trackingNo: (o.tracking_no as string) ?? null,
    items: items.map((x) => ({
      productName: String(x.product_name),
      variantName: String(x.variant_name),
      sku: String(x.sku),
      unitCents: Number(x.unit_cents),
      qty: Number(x.qty),
      imageUrl: (x.image_url as string) ?? null,
    })),
  };
}

// ---------------------------------------------------------------------------
// 金流 callback 寫入(server-to-server,無使用者 session → 走 pool query;
// shop_orders UPDATE 由 SECURITY DEFINER 函式或 service role 執行)
// ---------------------------------------------------------------------------

/** 付款成功(ReturnURL RtnCode=1)。冪等:已 paid 直接回 true。 */
export async function markPaid(
  orderNo: string,
  ecpayTradeNo: string,
  paymentMethod: string,
  raw: Record<string, string>
): Promise<boolean> {
  const r = await query(
    `UPDATE shop_orders
        SET status = 'paid', ecpay_trade_no = $2, paid_at = now(),
            payment_method = COALESCE(payment_method, $3)
      WHERE order_no = $1 AND status IN ('pending','awaiting_payment','paid')
      RETURNING id, (paid_at IS NOT NULL) AS already`,
    [orderNo, ecpayTradeNo, normalizePaymentType(paymentMethod)]
  );
  if (r.rows.length === 0) return false;
  await query(
    `INSERT INTO shop_order_events (order_id, event, detail, actor)
     VALUES ($1, 'paid', $2::jsonb, 'ecpay')`,
    [r.rows[0].id, JSON.stringify(raw)]
  );
  return true;
}

/** ATM/CVS 取號(PaymentInfoURL)→ awaiting_payment + 顯示繳費資訊 */
export async function savePaymentInfo(
  orderNo: string,
  info: {
    paymentType: string;
    bankCode?: string;
    vAccount?: string;
    paymentNo?: string;
    expireDate?: string; // 綠界 yyyy/MM/dd(ATM)或 yyyy/MM/dd HH:mm:ss(CVS)
  },
  raw: Record<string, string>
): Promise<boolean> {
  const expire = info.expireDate
    ? new Date(info.expireDate.replace(/\//g, "-") + (info.expireDate.length <= 10 ? "T23:59:59+08:00" : "+08:00"))
    : null;
  const r = await query(
    `UPDATE shop_orders
        SET status = 'awaiting_payment',
            payment_method = $2,
            atm_bank_code = $3, atm_v_account = $4, cvs_payment_no = $5,
            payment_expire_at = $6
      WHERE order_no = $1 AND status = 'pending'
      RETURNING id`,
    [
      orderNo,
      normalizePaymentType(info.paymentType),
      info.bankCode ?? null,
      info.vAccount ?? null,
      info.paymentNo ?? null,
      expire ? expire.toISOString() : null,
    ]
  );
  if (r.rows.length === 0) return false;
  await query(
    `INSERT INTO shop_order_events (order_id, event, detail, actor)
     VALUES ($1, 'payment_info', $2::jsonb, 'ecpay')`,
    [r.rows[0].id, JSON.stringify(raw)]
  );
  return true;
}

/** 綠界 PaymentType(如 Credit_CreditCard / ATM_LAND / CVS_CVS)→ 標準化 */
export function normalizePaymentType(pt: string): "Credit" | "ATM" | "CVS" {
  if (pt.startsWith("ATM")) return "ATM";
  if (pt.startsWith("CVS")) return "CVS";
  return "Credit";
}

/** 物流狀態 callback → shipped/completed */
export async function updateLogisticsStatus(
  orderNo: string,
  newStatus: "shipped" | "completed",
  raw: Record<string, string>
): Promise<boolean> {
  const r = await query(
    newStatus === "shipped"
      ? `UPDATE shop_orders SET status='shipped', shipped_at=COALESCE(shipped_at, now())
          WHERE order_no=$1 AND status IN ('paid','shipped') RETURNING id`
      : `UPDATE shop_orders SET status='completed', completed_at=COALESCE(completed_at, now())
          WHERE order_no=$1 AND status IN ('paid','shipped','completed') RETURNING id`,
    [orderNo]
  );
  if (r.rows.length === 0) return false;
  await query(
    `INSERT INTO shop_order_events (order_id, event, detail, actor)
     VALUES ($1, $2, $3::jsonb, 'ecpay')`,
    [r.rows[0].id, "logistics_" + newStatus, JSON.stringify(raw)]
  );
  return true;
}

/** cron:逾期取消(回補庫存) */
export async function expireOrders(): Promise<number> {
  const r = await query(`SELECT shop_expire_orders() AS n`);
  return Number(r.rows[0]?.n ?? 0);
}

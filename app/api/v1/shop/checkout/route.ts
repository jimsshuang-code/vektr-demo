// ============================================================================
// POST /api/v1/shop/checkout — 扣庫存建單,回綠界 AIO 表單參數(前端自動 POST)
// 守衛:登入 + 未停權(同 A2 write-time 模式)
// body: { items:[{variantId,qty}], payment:'Credit'|'CVS'|'ATM',
//         shippingMethod:'cvs_711'|'cvs_family'|'home',
//         receiverName, receiverPhone,
//         cvsStoreId?, cvsStoreName?, cvsStoreAddress?, homeAddress? }
// 回:{ orderNo, ecpay:{action, fields} } → 前端建 form submit 跳轉收銀台
// ============================================================================
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/currentUser";
import { isSuspended } from "@/app/lib/reportsDb";
import { createOrder, type CartItem, type ShippingMethod } from "@/app/lib/orderDb";
import { buildAioCheckout, type AioPayment } from "@/app/lib/ecpay";
import { query } from "@/app/lib/db";

export const dynamic = "force-dynamic";

const PAYMENTS: AioPayment[] = ["Credit", "CVS", "ATM"];
const SHIPPING: ShippingMethod[] = ["cvs_711", "cvs_family", "home"];

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (await isSuspended(me.id)) {
    return NextResponse.json({ error: "account_suspended" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const payment = String(body.payment ?? "") as AioPayment;
  const shippingMethod = String(body.shippingMethod ?? "") as ShippingMethod;
  const receiverName = String(body.receiverName ?? "").trim();
  const receiverPhone = String(body.receiverPhone ?? "").trim();
  const itemsRaw = Array.isArray(body.items) ? body.items : [];

  if (!PAYMENTS.includes(payment)) {
    return NextResponse.json({ error: "invalid_payment" }, { status: 400 });
  }
  if (!SHIPPING.includes(shippingMethod)) {
    return NextResponse.json({ error: "invalid_shipping" }, { status: 400 });
  }
  if (!receiverName || receiverName.length > 20) {
    return NextResponse.json({ error: "invalid_receiver_name" }, { status: 400 });
  }
  if (!/^09\d{8}$/.test(receiverPhone)) {
    return NextResponse.json({ error: "invalid_receiver_phone" }, { status: 400 });
  }

  const items: CartItem[] = itemsRaw
    .map((x) => ({
      variantId: Number((x as Record<string, unknown>).variantId),
      qty: Number((x as Record<string, unknown>).qty),
    }))
    .filter((x) => Number.isInteger(x.variantId) && Number.isInteger(x.qty) && x.qty > 0);
  if (items.length === 0 || items.length > 20) {
    return NextResponse.json({ error: "invalid_items" }, { status: 400 });
  }

  const isCvs = shippingMethod !== "home";
  const cvsStoreId = String(body.cvsStoreId ?? "").trim();
  const homeAddress = String(body.homeAddress ?? "").trim();
  if (isCvs && !cvsStoreId) {
    return NextResponse.json({ error: "missing_cvs_store" }, { status: 400 });
  }
  if (!isCvs && homeAddress.length < 8) {
    return NextResponse.json({ error: "invalid_address" }, { status: 400 });
  }

  let order: Awaited<ReturnType<typeof createOrder>>;
  try {
    order = await createOrder(me.id, {
      items,
      shippingMethod,
      receiverName,
      receiverPhone,
      cvsStoreId: isCvs ? cvsStoreId : undefined,
      cvsStoreName: isCvs ? String(body.cvsStoreName ?? "") : undefined,
      cvsStoreAddress: isCvs ? String(body.cvsStoreAddress ?? "") : undefined,
      homeAddress: isCvs ? undefined : homeAddress,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("insufficient_stock")) {
      return NextResponse.json(
        { error: "insufficient_stock", detail: msg },
        { status: 409 }
      );
    }
    if (msg.includes("variant_not_found") || msg.includes("invalid_qty") || msg.includes("empty_cart")) {
      return NextResponse.json({ error: "invalid_items", detail: msg }, { status: 400 });
    }
    throw e;
  }

  // 綠界 ItemName:以 # 串接各品項
  const names = await query(
    `SELECT product_name || CASE WHEN variant_name <> 'default' THEN '(' || variant_name || ')' ELSE '' END
            || ' x' || qty AS line
       FROM shop_order_items WHERE order_id = $1 ORDER BY id`,
    [order.orderId]
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const itemName = names.rows.map((r: any) => String(r.line)).join("#");

  const ecpay = buildAioCheckout({
    orderNo: order.orderNo,
    totalTwd: Math.round(order.totalCents / 100),
    itemName,
    payment,
  });

  return NextResponse.json({ orderNo: order.orderNo, ecpay });
}

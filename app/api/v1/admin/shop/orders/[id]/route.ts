// ============================================================================
// PATCH /api/v1/admin/shop/orders/[id] — 後台訂單操作
// body: { action:'ship', trackingNo? }  超商取貨自動呼叫綠界建託運單;宅配填單號
//       { action:'cancel' }             取消(paid 亦可;退款請至綠界後台退刷)
// ============================================================================
import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/rbac";
import {
  adminGetOrder, adminMarkShipped, adminCancelOrder,
} from "@/app/lib/adminShopDb";
import { createLogisticsOrder, shippingSubType } from "@/app/lib/ecpay";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin("products", { write: true });
  if (!admin.ok) return NextResponse.json({ error: "forbidden" }, { status: admin.status });
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  let body: { action?: string; trackingNo?: string };
  try {
    body = (await req.json()) as { action?: string; trackingNo?: string };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const adminId = Number(admin.adminId);

  if (body.action === "cancel") {
    const ok = await adminCancelOrder(adminId, orderId);
    if (!ok) return NextResponse.json({ error: "cannot_cancel" }, { status: 409 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "ship") {
    const order = await adminGetOrder(adminId, orderId);
    if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (order.status !== "paid") {
      return NextResponse.json({ error: "not_paid" }, { status: 409 });
    }

    const isCvs = order.shipping_method !== "home";
    if (isCvs) {
      // 綠界 C2C 建立託運單 → 取得寄貨編號
      const result = await createLogisticsOrder({
        orderNo: String(order.order_no),
        totalTwd: Math.round(Number(order.total_cents) / 100),
        itemName: "VEKTR 皮克球裝備",
        receiverName: String(order.receiver_name),
        receiverPhone: String(order.receiver_phone),
        subType: shippingSubType(String(order.shipping_method)),
        cvsStoreId: String(order.cvs_store_id ?? ""),
      });
      if (!result.ok) {
        return NextResponse.json({ error: "ecpay_logistics_failed", detail: result.error }, { status: 502 });
      }
      await adminMarkShipped(adminId, orderId, {
        logisticsId: result.logisticsId,
        trackingNo: result.trackingNo,
      });
      return NextResponse.json({ ok: true, trackingNo: result.trackingNo });
    }

    // 宅配:人工填單號(或留空之後補)
    const ok = await adminMarkShipped(adminId, orderId, {
      trackingNo: body.trackingNo?.trim() || undefined,
    });
    if (!ok) return NextResponse.json({ error: "cannot_ship" }, { status: 409 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "invalid_action" }, { status: 400 });
}

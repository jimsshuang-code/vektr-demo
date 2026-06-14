// GET /api/v1/admin/shop/orders?status=paid — 後台訂單列表
import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/rbac";
import { adminListOrders } from "@/app/lib/adminShopDb";

export const dynamic = "force-dynamic";

const STATUSES = new Set([
  "pending", "awaiting_payment", "paid", "shipped", "completed", "cancelled", "refunded",
]);

export async function GET(req: Request) {
  const admin = await requireAdmin("products");
  if (!admin.ok) return NextResponse.json({ error: "forbidden" }, { status: admin.status });
  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? undefined;
  if (status && !STATUSES.has(status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }
  const orders = await adminListOrders(Number(admin.adminId), status);
  return NextResponse.json({ orders });
}

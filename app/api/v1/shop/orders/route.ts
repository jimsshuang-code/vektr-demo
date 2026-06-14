// GET /api/v1/shop/orders — 我的訂單列表
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/currentUser";
import { listMyOrders } from "@/app/lib/orderDb";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const orders = await listMyOrders(me.id);
  return NextResponse.json({ orders });
}

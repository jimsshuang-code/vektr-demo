// GET /api/v1/shop/orders/[orderNo] — 我的訂單詳情(僅本人)
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/currentUser";
import { getMyOrder } from "@/app/lib/orderDb";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderNo: string }> }
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { orderNo } = await params;
  const order = await getMyOrder(me.id, orderNo);
  if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ order });
}

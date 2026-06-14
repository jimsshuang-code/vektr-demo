// GET /api/v1/shop/products/[slug] — 公開商品詳情
import { NextResponse } from "next/server";
import { getProduct } from "@/app/lib/shopDb";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ product });
}

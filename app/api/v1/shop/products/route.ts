// GET /api/v1/shop/products?category=paddles — 公開商品列表
import { NextResponse } from "next/server";
import { listProducts, listCategories } from "@/app/lib/shopDb";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category") ?? undefined;
  const [products, categories] = await Promise.all([
    listProducts(category),
    listCategories(),
  ]);
  return NextResponse.json({ products, categories });
}

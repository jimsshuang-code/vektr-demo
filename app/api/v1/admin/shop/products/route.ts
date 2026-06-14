// GET/POST /api/v1/admin/shop/products — 後台商品列表/新增
import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/rbac";
import {
  adminListProducts, adminCreateProduct, type AdminProductInput,
} from "@/app/lib/adminShopDb";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin("products");
  if (!admin.ok) return NextResponse.json({ error: "forbidden" }, { status: admin.status });
  const products = await adminListProducts(Number(admin.adminId));
  return NextResponse.json({ products });
}

export async function POST(req: Request) {
  const admin = await requireAdmin("products", { write: true });
  if (!admin.ok) return NextResponse.json({ error: "forbidden" }, { status: admin.status });

  let body: AdminProductInput;
  try {
    body = (await req.json()) as AdminProductInput;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.slug || !body.name || !Array.isArray(body.variants) || body.variants.length === 0) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  for (const v of body.variants) {
    if (!v.sku || !Number.isInteger(v.priceCents) || v.priceCents < 0 || v.stock < 0) {
      return NextResponse.json({ error: "invalid_variant" }, { status: 400 });
    }
  }
  try {
    const id = await adminCreateProduct(Number(admin.adminId), body);
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("duplicate key")) {
      return NextResponse.json({ error: "slug_or_sku_exists" }, { status: 409 });
    }
    throw e;
  }
}

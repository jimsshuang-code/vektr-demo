// PATCH/DELETE /api/v1/admin/shop/products/[id] — 編輯/下架(archive)
import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/rbac";
import {
  adminUpdateProduct, adminArchiveProduct, type AdminProductInput,
} from "@/app/lib/adminShopDb";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin("products", { write: true });
  if (!admin.ok) return NextResponse.json({ error: "forbidden" }, { status: admin.status });
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  let body: Partial<AdminProductInput>;
  try {
    body = (await req.json()) as Partial<AdminProductInput>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const ok = await adminUpdateProduct(Number(admin.adminId), productId, body);
  if (!ok) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin("products", { write: true });
  if (!admin.ok) return NextResponse.json({ error: "forbidden" }, { status: admin.status });
  const { id } = await params;
  const ok = await adminArchiveProduct(Number(admin.adminId), Number(id));
  if (!ok) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

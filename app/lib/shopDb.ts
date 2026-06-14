// ============================================================================
// app/lib/shopDb.ts — SHOP 商品目錄資料存取(公開讀)
// ----------------------------------------------------------------------------
// 整合假設(對照主專案,若不符只改這裡):
//   - app/lib/db.ts 匯出 query(text, params) => Promise<{ rows:any[] }>
//     (一般 pool 查詢;catalog 為公開讀,不需 withUser)。
//   - 005 的 assert_admin() 為「回傳 boolean」函式(非 raise),
//     RLS 對匿名讀 products(status='active')才能通過。
// ============================================================================

import { query } from "@/app/lib/db";

export type ProductVariant = {
  id: number;
  name: string;
  sku: string;
  priceCents: number;
  compareAtCents: number | null;
  stock: number;
};

export type ProductListItem = {
  id: number;
  slug: string;
  name: string;
  subtitle: string | null;
  image: string | null;
  categorySlug: string | null;
  minPriceCents: number;
  inStock: boolean;
};

export type ProductDetail = ProductListItem & {
  description: string;
  images: string[];
  variants: ProductVariant[];
};

export async function listCategories(): Promise<{ slug: string; name: string }[]> {
  const r = await query(
    `SELECT slug, name FROM product_categories ORDER BY sort, id`
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return r.rows as any[];
}

export async function listProducts(categorySlug?: string): Promise<ProductListItem[]> {
  const r = await query(
    `SELECT p.id, p.slug, p.name, p.subtitle, p.images->>0 AS image,
            c.slug AS category_slug,
            MIN(v.price_cents) AS min_price_cents,
            COALESCE(SUM(v.stock), 0) > 0 AS in_stock
       FROM products p
       LEFT JOIN product_categories c ON c.id = p.category_id
       JOIN product_variants v ON v.product_id = p.id AND v.is_active
      WHERE p.status = 'active'
        AND ($1::text IS NULL OR c.slug = $1)
      GROUP BY p.id, c.slug
      ORDER BY p.sort, p.id DESC`,
    [categorySlug ?? null]
  );
  return r.rows.map((x: Record<string, unknown>) => ({
    id: Number(x.id),
    slug: String(x.slug),
    name: String(x.name),
    subtitle: (x.subtitle as string) ?? null,
    image: (x.image as string) ?? null,
    categorySlug: (x.category_slug as string) ?? null,
    minPriceCents: Number(x.min_price_cents),
    inStock: Boolean(x.in_stock),
  }));
}

export async function getProduct(slug: string): Promise<ProductDetail | null> {
  const p = await query(
    `SELECT p.id, p.slug, p.name, p.subtitle, p.description, p.images,
            c.slug AS category_slug
       FROM products p
       LEFT JOIN product_categories c ON c.id = p.category_id
      WHERE p.slug = $1 AND p.status = 'active'`,
    [slug]
  );
  if (p.rows.length === 0) return null;
  const row = p.rows[0];

  const v = await query(
    `SELECT id, name, sku, price_cents, compare_at_cents, stock
       FROM product_variants
      WHERE product_id = $1 AND is_active
      ORDER BY id`,
    [row.id]
  );

  const images: string[] = Array.isArray(row.images) ? row.images : [];
  const variants: ProductVariant[] = v.rows.map((x: Record<string, unknown>) => ({
    id: Number(x.id),
    name: String(x.name),
    sku: String(x.sku),
    priceCents: Number(x.price_cents),
    compareAtCents: x.compare_at_cents === null ? null : Number(x.compare_at_cents),
    stock: Number(x.stock),
  }));

  return {
    id: Number(row.id),
    slug: String(row.slug),
    name: String(row.name),
    subtitle: (row.subtitle as string | null) ?? null,
    image: (images[0] as string) ?? null,
    categorySlug: (row.category_slug as string | null) ?? null,
    minPriceCents: variants.length ? Math.min(...variants.map((x) => x.priceCents)) : 0,
    inStock: variants.some((x) => x.stock > 0),
    description: String(row.description ?? ""),
    images,
    variants,
  };
}

/** 台幣顯示:cents → "NT$1,234" */
export function twd(cents: number): string {
  return "NT$" + Math.round(cents / 100).toLocaleString("en-US");
}

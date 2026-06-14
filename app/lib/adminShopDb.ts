// ============================================================================
// app/lib/adminShopDb.ts — 後台商品/訂單資料存取(admin)
// 整合假設:withUser(adminId, fn) 設定 app.user_id;RLS 以 assert_admin() 放行。
// ============================================================================

import { withUser } from "@/app/lib/matchDb";

export type AdminVariantInput = {
  id?: number;            // 有 id = 更新;無 = 新增
  name: string;
  sku: string;
  priceCents: number;
  compareAtCents?: number | null;
  stock: number;
  weightG?: number;
  isActive?: boolean;
};

export type AdminProductInput = {
  slug: string;
  name: string;
  subtitle?: string | null;
  description?: string;
  categoryId?: number | null;
  images?: string[];
  status?: "draft" | "active" | "archived";
  sort?: number;
  variants: AdminVariantInput[];
};

export async function adminListProducts(adminId: number) {
  return withUser(adminId, async (client) => {
    const r = await client.query(
      `SELECT p.id, p.slug, p.name, p.status, p.images->>0 AS image,
              c.name AS category_name,
              COALESCE(json_agg(json_build_object(
                'id', v.id, 'name', v.name, 'sku', v.sku,
                'priceCents', v.price_cents, 'stock', v.stock,
                'isActive', v.is_active
              ) ORDER BY v.id) FILTER (WHERE v.id IS NOT NULL), '[]') AS variants
         FROM products p
         LEFT JOIN product_categories c ON c.id = p.category_id
         LEFT JOIN product_variants v ON v.product_id = p.id
        GROUP BY p.id, c.name
        ORDER BY p.sort, p.id DESC`
    );
    return r.rows;
  });
}

export async function adminCreateProduct(adminId: number, input: AdminProductInput): Promise<number> {
  return withUser(adminId, async (client) => {
    const p = await client.query(
      `INSERT INTO products (slug, name, subtitle, description, category_id, images, status, sort)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8) RETURNING id`,
      [
        input.slug, input.name, input.subtitle ?? null, input.description ?? "",
        input.categoryId ?? null, JSON.stringify(input.images ?? []),
        input.status ?? "draft", input.sort ?? 0,
      ]
    );
    const productId = Number(p.rows[0].id);
    for (const v of input.variants) {
      await client.query(
        `INSERT INTO product_variants (product_id, name, sku, price_cents, compare_at_cents, stock, weight_g, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [productId, v.name, v.sku, v.priceCents, v.compareAtCents ?? null,
         v.stock, v.weightG ?? 0, v.isActive ?? true]
      );
    }
    return productId;
  });
}

export async function adminUpdateProduct(
  adminId: number, productId: number, input: Partial<AdminProductInput>
): Promise<boolean> {
  return withUser(adminId, async (client) => {
    const r = await client.query(
      `UPDATE products SET
         slug = COALESCE($2, slug), name = COALESCE($3, name),
         subtitle = COALESCE($4, subtitle), description = COALESCE($5, description),
         category_id = COALESCE($6, category_id),
         images = COALESCE($7::jsonb, images),
         status = COALESCE($8, status), sort = COALESCE($9, sort)
       WHERE id = $1 RETURNING id`,
      [
        productId, input.slug ?? null, input.name ?? null, input.subtitle ?? null,
        input.description ?? null, input.categoryId ?? null,
        input.images ? JSON.stringify(input.images) : null,
        input.status ?? null, input.sort ?? null,
      ]
    );
    if (r.rows.length === 0) return false;

    for (const v of input.variants ?? []) {
      if (v.id) {
        await client.query(
          `UPDATE product_variants SET
             name=$2, sku=$3, price_cents=$4, compare_at_cents=$5,
             stock=$6, weight_g=COALESCE($7, weight_g), is_active=$8
           WHERE id=$1 AND product_id=$9`,
          [v.id, v.name, v.sku, v.priceCents, v.compareAtCents ?? null,
           v.stock, v.weightG ?? null, v.isActive ?? true, productId]
        );
      } else {
        await client.query(
          `INSERT INTO product_variants (product_id, name, sku, price_cents, compare_at_cents, stock, weight_g, is_active)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [productId, v.name, v.sku, v.priceCents, v.compareAtCents ?? null,
           v.stock, v.weightG ?? 0, v.isActive ?? true]
        );
      }
    }
    return true;
  });
}

export async function adminArchiveProduct(adminId: number, productId: number): Promise<boolean> {
  return withUser(adminId, async (client) => {
    const r = await client.query(
      `UPDATE products SET status='archived' WHERE id=$1 RETURNING id`, [productId]
    );
    return r.rows.length > 0;
  });
}

// ---------------------------------------------------------------------------
// 訂單
// ---------------------------------------------------------------------------
export async function adminListOrders(adminId: number, status?: string) {
  return withUser(adminId, async (client) => {
    const r = await client.query(
      `SELECT o.*, u.display_name AS user_name,
              COALESCE(json_agg(json_build_object(
                'productName', i.product_name, 'variantName', i.variant_name,
                'sku', i.sku, 'qty', i.qty, 'unitCents', i.unit_cents
              ) ORDER BY i.id) FILTER (WHERE i.id IS NOT NULL), '[]') AS items
         FROM shop_orders o
         LEFT JOIN users u ON u.id = o.user_id
         LEFT JOIN shop_order_items i ON i.order_id = o.id
        WHERE ($1::text IS NULL OR o.status = $1)
        GROUP BY o.id, u.display_name
        ORDER BY o.created_at DESC
        LIMIT 200`,
      [status ?? null]
    );
    return r.rows;
  });
}

export async function adminGetOrder(adminId: number, orderId: number) {
  return withUser(adminId, async (client) => {
    const r = await client.query(`SELECT * FROM shop_orders WHERE id=$1`, [orderId]);
    return r.rows[0] ?? null;
  });
}

/** 出貨:寫入物流編號/宅配單號 + 轉 shipped */
export async function adminMarkShipped(
  adminId: number, orderId: number,
  info: { logisticsId?: string; trackingNo?: string }
): Promise<boolean> {
  return withUser(adminId, async (client) => {
    const r = await client.query(
      `UPDATE shop_orders SET
         status='shipped', shipped_at=now(),
         logistics_id=COALESCE($2, logistics_id),
         tracking_no=COALESCE($3, tracking_no)
       WHERE id=$1 AND status='paid' RETURNING id`,
      [orderId, info.logisticsId ?? null, info.trackingNo ?? null]
    );
    if (r.rows.length === 0) return false;
    await client.query(
      `INSERT INTO shop_order_events (order_id, event, detail, actor)
       VALUES ($1, 'shipped', $2::jsonb, $3)`,
      [orderId, JSON.stringify(info), `admin:${adminId}`]
    );
    return true;
  });
}

export async function adminCancelOrder(adminId: number, orderId: number): Promise<boolean> {
  return withUser(adminId, async (client) => {
    const r = await client.query(
      `SELECT shop_cancel_order($1, $2, true) AS ok`,
      [orderId, `admin:${adminId}`]
    );
    return Boolean(r.rows[0]?.ok);
  });
}

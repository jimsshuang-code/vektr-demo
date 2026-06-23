// 寫入一筆上架測試商品(測試球拍 NT$1 / 庫存10)。可重複執行(upsert)。
// 用法:node scripts/seed-shop-demo.mjs
// 連線優先 DIRECT_URL(直連),否則 DATABASE_URL,讀 .env.local。
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      process.env[m[1]] = v;
    }
  }
}

const conn = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!conn) { console.error("找不到 DIRECT_URL / DATABASE_URL"); process.exit(1); }

const client = new pg.Client({ connectionString: conn });
try {
  await client.connect();

  // 取 paddles 類別 id(021 已預建)
  const cat = await client.query(`SELECT id FROM product_categories WHERE slug='paddles' LIMIT 1`);
  const categoryId = cat.rows[0]?.id ?? null;

  // upsert 商品(以 slug 唯一),設為 active 上架
  const prod = await client.query(
    `INSERT INTO products (slug, name, subtitle, description, category_id, images, status, sort)
     VALUES ($1,$2,$3,$4,$5,'[]'::jsonb,'active',0)
     ON CONFLICT (slug) DO UPDATE
       SET name=EXCLUDED.name, subtitle=EXCLUDED.subtitle, description=EXCLUDED.description,
           category_id=EXCLUDED.category_id, status='active'
     RETURNING id`,
    ["test-paddle-01", "測試球拍", "上架測試", "此為上架流程測試商品,可刪除。", categoryId]
  );
  const productId = prod.rows[0].id;

  // upsert 規格(以 sku 唯一):NT$1 = 100 分,庫存 10
  await client.query(
    `INSERT INTO product_variants (product_id, name, sku, price_cents, stock, is_active)
     VALUES ($1,'default',$2,$3,$4,true)
     ON CONFLICT (sku) DO UPDATE
       SET price_cents=EXCLUDED.price_cents, stock=EXCLUDED.stock, is_active=true, product_id=EXCLUDED.product_id`,
    [productId, "TESTPADDLE01", 100, 10]
  );

  console.log(`✔ 已上架:測試球拍(product id=${productId},NT$1,庫存10)→ /shop/test-paddle-01`);
} catch (e) {
  console.error("✘ 失敗:", e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}

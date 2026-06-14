-- ============================================================================
-- 021_shop_catalog.sql — SHOP 商品目錄(類別/商品/規格)
-- 整合假設:
--   - 005 已建立 app_current_user_id() 與 assert_admin()(A2 模式)。
--     若函式名不同,僅需改本檔 RLS policy 內呼叫。
--   - 價格一律整數「分」(cents);台幣顯示 /100。
-- ============================================================================

BEGIN;

-- ---------- 類別 ----------
CREATE TABLE IF NOT EXISTS product_categories (
  id          serial PRIMARY KEY,
  slug        text NOT NULL UNIQUE,
  name        text NOT NULL,
  sort        int  NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------- 商品主檔 ----------
CREATE TABLE IF NOT EXISTS products (
  id           serial PRIMARY KEY,
  slug         text NOT NULL UNIQUE,
  name         text NOT NULL,
  subtitle     text,
  description  text NOT NULL DEFAULT '',
  category_id  int REFERENCES product_categories(id),
  -- ["https://.../1.jpg", ...] 第一張為主圖
  images       jsonb NOT NULL DEFAULT '[]'::jsonb,
  status       text NOT NULL DEFAULT 'draft'
               CHECK (status IN ('draft','active','archived')),
  sort         int NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_status_cat
  ON products (status, category_id, sort);

-- ---------- 規格 / SKU ----------
-- 單規格商品也建一筆 name='default',前後台邏輯統一。
CREATE TABLE IF NOT EXISTS product_variants (
  id                serial PRIMARY KEY,
  product_id        int NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name              text NOT NULL DEFAULT 'default',
  sku               text NOT NULL UNIQUE,
  price_cents       int  NOT NULL CHECK (price_cents >= 0),
  compare_at_cents  int  CHECK (compare_at_cents IS NULL OR compare_at_cents >= price_cents),
  stock             int  NOT NULL DEFAULT 0 CHECK (stock >= 0),
  weight_g          int  NOT NULL DEFAULT 0,
  is_active         boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, name)
);

CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants (product_id);

-- ---------- updated_at 觸發 ----------
CREATE OR REPLACE FUNCTION shop_touch_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_touch ON products;
CREATE TRIGGER trg_products_touch BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION shop_touch_updated_at();

DROP TRIGGER IF EXISTS trg_variants_touch ON product_variants;
CREATE TRIGGER trg_variants_touch BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION shop_touch_updated_at();

-- ---------- RLS:公開讀 active,寫入僅 admin ----------
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products           ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cat_read  ON product_categories;
CREATE POLICY cat_read  ON product_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS cat_admin ON product_categories;
CREATE POLICY cat_admin ON product_categories FOR ALL
  USING (assert_admin()) WITH CHECK (assert_admin());

DROP POLICY IF EXISTS prod_read ON products;
CREATE POLICY prod_read ON products FOR SELECT
  USING (status = 'active' OR assert_admin());
DROP POLICY IF EXISTS prod_admin ON products;
CREATE POLICY prod_admin ON products FOR ALL
  USING (assert_admin()) WITH CHECK (assert_admin());

DROP POLICY IF EXISTS var_read ON product_variants;
CREATE POLICY var_read ON product_variants FOR SELECT
  USING (
    is_active OR assert_admin()
  );
DROP POLICY IF EXISTS var_admin ON product_variants;
CREATE POLICY var_admin ON product_variants FOR ALL
  USING (assert_admin()) WITH CHECK (assert_admin());

-- ---------- 起手類別 ----------
INSERT INTO product_categories (slug, name, sort) VALUES
  ('paddles',     '球拍',   1),
  ('balls',       '皮克球', 2),
  ('apparel',     '服飾',   3),
  ('accessories', '配件',   4)
ON CONFLICT (slug) DO NOTHING;

COMMIT;

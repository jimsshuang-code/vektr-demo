-- ============================================================================
-- 022_shop_orders.sql — SHOP 訂單/明細/事件軌跡
-- 整合假設:
--   - users(id) 為球友主鍵;app_current_user_id() / shop_is_admin() 已存在(005)。
--   - 既有 payment_orders(013)留給球場預約訂金;商城獨立 shop_orders。
-- 狀態機:
--   pending → paid → shipped → completed
--   pending → awaiting_payment(ATM/CVS 取號)→ paid / cancelled(逾期)
--   pending|awaiting_payment → cancelled;paid+ → refunded(人工)
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS shop_orders (
  id                serial PRIMARY KEY,
  order_no          text NOT NULL UNIQUE,          -- SHP260612xxxxxx(=綠界 MerchantTradeNo,<=20 字)
  user_id           int  NOT NULL REFERENCES users(id),
  status            text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','awaiting_payment','paid',
                                      'shipped','completed','cancelled','refunded')),
  -- 金額(分)
  subtotal_cents    int NOT NULL CHECK (subtotal_cents >= 0),
  shipping_cents    int NOT NULL DEFAULT 0 CHECK (shipping_cents >= 0),
  total_cents       int NOT NULL CHECK (total_cents = subtotal_cents + shipping_cents),

  -- 收件
  receiver_name     text NOT NULL,
  receiver_phone    text NOT NULL,
  shipping_method   text NOT NULL CHECK (shipping_method IN ('cvs_711','cvs_family','home')),
  cvs_store_id      text,                          -- 超商取貨:門市代號
  cvs_store_name    text,
  cvs_store_address text,
  home_address      text,                          -- 宅配地址

  -- 金流(綠界)
  payment_method    text CHECK (payment_method IN ('Credit','CVS','ATM')),
  ecpay_trade_no    text,                          -- 綠界交易編號
  paid_at           timestamptz,
  -- ATM 取號 / 超商代碼(awaiting_payment 顯示給用戶)
  atm_bank_code     text,
  atm_v_account     text,
  cvs_payment_no    text,
  payment_expire_at timestamptz,                   -- 取號繳費期限;逾期 cron 取消

  -- 物流
  logistics_id      text,                          -- 綠界物流交易編號(AllPayLogisticsID)
  tracking_no       text,                          -- 宅配單號 / 超商寄貨編號(CVSPaymentNo)
  shipped_at        timestamptz,
  completed_at      timestamptz,

  note              text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shop_orders_user    ON shop_orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shop_orders_status  ON shop_orders (status, created_at DESC);

-- 明細:下單當下快照,商品改價/改名不影響歷史訂單
CREATE TABLE IF NOT EXISTS shop_order_items (
  id           serial PRIMARY KEY,
  order_id     int NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE,
  variant_id   int NOT NULL REFERENCES product_variants(id),
  product_name text NOT NULL,
  variant_name text NOT NULL,
  sku          text NOT NULL,
  unit_cents   int NOT NULL CHECK (unit_cents >= 0),
  qty          int NOT NULL CHECK (qty > 0),
  image_url    text
);

CREATE INDEX IF NOT EXISTS idx_shop_order_items_order ON shop_order_items (order_id);

-- 狀態軌跡:稽核+客服
CREATE TABLE IF NOT EXISTS shop_order_events (
  id          serial PRIMARY KEY,
  order_id    int NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE,
  event       text NOT NULL,                        -- created / payment_info / paid / shipped / ...
  detail      jsonb NOT NULL DEFAULT '{}'::jsonb,   -- callback 原始參數等
  actor       text NOT NULL DEFAULT 'system',       -- system / user:<id> / admin:<id> / ecpay
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shop_order_events_order ON shop_order_events (order_id, created_at);

DROP TRIGGER IF EXISTS trg_shop_orders_touch ON shop_orders;
CREATE TRIGGER trg_shop_orders_touch BEFORE UPDATE ON shop_orders
  FOR EACH ROW EXECUTE FUNCTION shop_touch_updated_at();

-- ---------- 訂單編號:SHP + yymmdd + 6 碼流水(共 15 字,符合綠界 20 字上限) ----------
CREATE SEQUENCE IF NOT EXISTS shop_order_no_seq;

CREATE OR REPLACE FUNCTION next_shop_order_no() RETURNS text AS $$
  SELECT 'SHP' || to_char(now() AT TIME ZONE 'Asia/Taipei', 'YYMMDD')
       || lpad((nextval('shop_order_no_seq') % 1000000)::text, 6, '0');
$$ LANGUAGE sql;

-- ---------- RLS ----------
ALTER TABLE shop_orders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_order_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_order_events ENABLE ROW LEVEL SECURITY;

-- 本人讀自己的訂單;admin 全讀寫。寫入一律走 SECURITY DEFINER 函式或 admin。
DROP POLICY IF EXISTS so_owner_read ON shop_orders;
CREATE POLICY so_owner_read ON shop_orders FOR SELECT
  USING (user_id = app_current_user_id() OR shop_is_admin());
DROP POLICY IF EXISTS so_owner_insert ON shop_orders;
CREATE POLICY so_owner_insert ON shop_orders FOR INSERT
  WITH CHECK (user_id = app_current_user_id() OR shop_is_admin());
DROP POLICY IF EXISTS so_admin_all ON shop_orders;
CREATE POLICY so_admin_all ON shop_orders FOR UPDATE
  USING (shop_is_admin()) WITH CHECK (shop_is_admin());

DROP POLICY IF EXISTS soi_owner_read ON shop_order_items;
CREATE POLICY soi_owner_read ON shop_order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM shop_orders o WHERE o.id = order_id
                 AND (o.user_id = app_current_user_id() OR shop_is_admin())));
DROP POLICY IF EXISTS soi_owner_insert ON shop_order_items;
CREATE POLICY soi_owner_insert ON shop_order_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM shop_orders o WHERE o.id = order_id
                      AND (o.user_id = app_current_user_id() OR shop_is_admin())));

DROP POLICY IF EXISTS soe_owner_read ON shop_order_events;
CREATE POLICY soe_owner_read ON shop_order_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM shop_orders o WHERE o.id = order_id
                 AND (o.user_id = app_current_user_id() OR shop_is_admin())));

-- ============================================================================
-- 核心交易函式(SECURITY DEFINER):繞過 RLS 的關鍵寫入集中於此,App 不直寫。
-- ============================================================================

-- 下單:鎖庫存 → 扣減 → 建單+明細。items: [{variant_id, qty}, ...]
-- 回傳 order_id;庫存不足 raise 'insufficient_stock:<variant_id>'
CREATE OR REPLACE FUNCTION shop_create_order(
  p_user_id int,
  p_items jsonb,
  p_shipping_method text,
  p_receiver_name text,
  p_receiver_phone text,
  p_shipping_cents int,
  p_cvs_store_id text DEFAULT NULL,
  p_cvs_store_name text DEFAULT NULL,
  p_cvs_store_address text DEFAULT NULL,
  p_home_address text DEFAULT NULL
) RETURNS TABLE (out_order_id int, out_order_no text) AS $$
DECLARE
  v_item record;
  v_variant record;
  v_subtotal int := 0;
  v_order_id int;
  v_order_no text;
BEGIN
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'empty_cart';
  END IF;

  -- 依 variant_id 排序鎖列,避免死鎖
  FOR v_item IN
    SELECT (e->>'variant_id')::int AS variant_id, (e->>'qty')::int AS qty
    FROM jsonb_array_elements(p_items) e
    ORDER BY (e->>'variant_id')::int
  LOOP
    IF v_item.qty IS NULL OR v_item.qty <= 0 OR v_item.qty > 99 THEN
      RAISE EXCEPTION 'invalid_qty:%', v_item.variant_id;
    END IF;

    SELECT pv.id, pv.stock, pv.price_cents, pv.name AS variant_name, pv.sku,
           p.name AS product_name, p.images, p.status
      INTO v_variant
      FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
     WHERE pv.id = v_item.variant_id AND pv.is_active
     FOR UPDATE OF pv;

    IF NOT FOUND OR v_variant.status <> 'active' THEN
      RAISE EXCEPTION 'variant_not_found:%', v_item.variant_id;
    END IF;
    IF v_variant.stock < v_item.qty THEN
      RAISE EXCEPTION 'insufficient_stock:%', v_item.variant_id;
    END IF;

    UPDATE product_variants SET stock = stock - v_item.qty
     WHERE id = v_item.variant_id;

    v_subtotal := v_subtotal + v_variant.price_cents * v_item.qty;
  END LOOP;

  v_order_no := next_shop_order_no();

  INSERT INTO shop_orders (
    order_no, user_id, status, subtotal_cents, shipping_cents, total_cents,
    receiver_name, receiver_phone, shipping_method,
    cvs_store_id, cvs_store_name, cvs_store_address, home_address
  ) VALUES (
    v_order_no, p_user_id, 'pending', v_subtotal, p_shipping_cents,
    v_subtotal + p_shipping_cents,
    p_receiver_name, p_receiver_phone, p_shipping_method,
    p_cvs_store_id, p_cvs_store_name, p_cvs_store_address, p_home_address
  ) RETURNING id INTO v_order_id;

  INSERT INTO shop_order_items
    (order_id, variant_id, product_name, variant_name, sku, unit_cents, qty, image_url)
  SELECT v_order_id, pv.id, p.name, pv.name, pv.sku, pv.price_cents,
         (e->>'qty')::int, p.images->>0
    FROM jsonb_array_elements(p_items) e
    JOIN product_variants pv ON pv.id = (e->>'variant_id')::int
    JOIN products p ON p.id = pv.product_id;

  INSERT INTO shop_order_events (order_id, event, actor)
  VALUES (v_order_id, 'created', 'user:' || p_user_id);

  RETURN QUERY SELECT v_order_id, v_order_no;
END $$ LANGUAGE plpgsql SECURITY DEFINER;

-- 取消(用戶限 pending/awaiting_payment;admin 另可取消 paid)+ 回補庫存
CREATE OR REPLACE FUNCTION shop_cancel_order(
  p_order_id int, p_actor text, p_allow_paid boolean DEFAULT false
) RETURNS boolean AS $$
DECLARE
  v_status text;
BEGIN
  SELECT status INTO v_status FROM shop_orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  IF v_status NOT IN ('pending','awaiting_payment')
     AND NOT (p_allow_paid AND v_status = 'paid') THEN
    RETURN false;
  END IF;

  UPDATE product_variants pv SET stock = pv.stock + i.qty
    FROM shop_order_items i
   WHERE i.order_id = p_order_id AND pv.id = i.variant_id;

  UPDATE shop_orders SET status = 'cancelled' WHERE id = p_order_id;
  INSERT INTO shop_order_events (order_id, event, actor)
  VALUES (p_order_id, 'cancelled', p_actor);
  RETURN true;
END $$ LANGUAGE plpgsql SECURITY DEFINER;

-- 逾期未付(取號後超過 payment_expire_at / pending 超過 2 小時)批次取消
CREATE OR REPLACE FUNCTION shop_expire_orders() RETURNS int AS $$
DECLARE
  v_id int;
  v_count int := 0;
BEGIN
  FOR v_id IN
    SELECT id FROM shop_orders
     WHERE (status = 'awaiting_payment' AND payment_expire_at < now())
        OR (status = 'pending' AND created_at < now() - interval '2 hours')
  LOOP
    IF shop_cancel_order(v_id, 'system:expire') THEN
      v_count := v_count + 1;
    END IF;
  END LOOP;
  RETURN v_count;
END $$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

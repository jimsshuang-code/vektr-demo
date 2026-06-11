-- ============================================================================
-- VEKTR migration 013_payments.sql
-- 金流「預留」訂單表(尚未啟用線上付款)。先把資料結構備好,之後決定收費模式
-- (建議「訂金/服務費,VEKTR 當商家」,避免代收代付)+ 綠界沙盒測通後再啟用。
-- kind:用途(如 court_reservation_deposit / coach_fee / shop_order)。
-- 冪等。
-- ============================================================================

begin;

create table if not exists payment_orders (
  id               bigint generated always as identity primary key,
  ref              varchar(40) not null unique,      -- 對綠界的 MerchantTradeNo
  user_id          bigint references users(id) on delete set null,
  kind             varchar(40) not null,             -- 業務用途
  related_id       bigint,                           -- 關聯的預約/訂單 id
  amount           int not null check (amount > 0),  -- 新台幣整數
  description      varchar(200),
  provider         varchar(20) not null default 'ecpay',
  provider_trade_no varchar(40),                     -- 綠界回傳交易序號
  status           varchar(20) not null default 'pending'
                     check (status in ('pending','paid','failed','refunded','cancelled')),
  paid_at          timestamptz,
  created_at       timestamptz not null default now()
);
create index if not exists payment_orders_user_idx on payment_orders (user_id, created_at desc);
create index if not exists payment_orders_status_idx on payment_orders (status, created_at desc);

commit;

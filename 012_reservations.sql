-- ============================================================================
-- VEKTR migration 012_reservations.sql
-- 球場線上預約(Phase 1:現場付款,不接線上金流)。
--   使用者在球場詳情頁送出預約 -> status='pending' -> 後台(代球場端)接受/婉拒。
-- 設計沿用 courts/coaches 模式(一般表,存取控制在 App/API 層)。
-- 冪等。
-- ============================================================================

begin;

create table if not exists court_reservations (
  id            bigint generated always as identity primary key,
  court_id      bigint not null references courts(id) on delete cascade,
  user_id       bigint references users(id) on delete set null,
  contact_name  varchar(100) not null,
  contact       varchar(200) not null,
  reserve_date  date not null,
  time_slot     varchar(100) not null,   -- 例「19:00-21:00」或「晚上」
  party_size    int,
  note          text,
  status        varchar(20) not null default 'pending'
                  check (status in ('pending','confirmed','declined','cancelled')),
  created_at    timestamptz not null default now()
);
create index if not exists court_reservations_court_idx on court_reservations (court_id, created_at desc);
create index if not exists court_reservations_status_idx on court_reservations (status, created_at desc);

commit;

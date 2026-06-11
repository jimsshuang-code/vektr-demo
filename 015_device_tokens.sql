-- ============================================================================
-- VEKTR migration 015_device_tokens.sql
-- App 推播裝置 token(由 vektr-native.js 在 App 內註冊時 POST /api/push/register 儲存)。
-- 之後用 Firebase Admin SDK 對 token 發推播。冪等。
-- ============================================================================

begin;

create table if not exists device_tokens (
  id          bigint generated always as identity primary key,
  user_id     bigint references users(id) on delete cascade,
  token       text not null unique,
  platform    varchar(20),               -- 'ios' | 'android'
  updated_at  timestamptz not null default now(),
  created_at  timestamptz not null default now()
);
create index if not exists device_tokens_user_idx on device_tokens (user_id);

commit;

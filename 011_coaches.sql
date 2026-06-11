-- ============================================================================
-- VEKTR migration 011_coaches.sql
-- 教練「純媒合」系統(第一階段,不碰金流):
--   coaches        教練資料(申請 -> 後台審核 -> 上架)
--   coach_bookings 學員送出的預約需求(平台記錄,後台/教練再聯繫;無付款)
-- 設計:沿用 courts 的模式(一般表,存取控制在 App / API 層;非 RLS)。
--   教練聯絡方式(contact)僅後台可見,不公開於前台,避免 PII 外洩。
-- 冪等、可重複執行。
-- ============================================================================

begin;

create table if not exists coaches (
  id           bigint generated always as identity primary key,
  name         varchar(100) not null,
  bio          text,
  city         varchar(50),
  district     varchar(50),
  specialties  text,                 -- 自由文字,如「入門, 技術, 青少年」
  dupr_rating  numeric(3,1),
  hourly_rate  int,                  -- 顯示用參考價;實際收費由教練與學員私下議定
  avatar_url   text,
  contact      varchar(200) not null, -- LINE/電話/email;僅後台可見
  status       varchar(20) not null default 'pending'
                 check (status in ('pending','active','rejected')),
  created_at   timestamptz not null default now()
);
create index if not exists coaches_status_idx on coaches (status, created_at desc);
create index if not exists coaches_city_idx on coaches (city);

create table if not exists coach_bookings (
  id              bigint generated always as identity primary key,
  coach_id        bigint not null references coaches(id) on delete cascade,
  student_user_id bigint references users(id) on delete set null,
  student_name    varchar(100) not null,
  student_contact varchar(200) not null,
  preferred_time  text,
  message         text,
  status          varchar(20) not null default 'new'
                    check (status in ('new','contacted','closed')),
  created_at      timestamptz not null default now()
);
create index if not exists coach_bookings_coach_idx on coach_bookings (coach_id, created_at desc);
create index if not exists coach_bookings_status_idx on coach_bookings (status, created_at desc);

commit;

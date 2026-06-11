-- ============================================================================
-- VEKTR migration 014_marketing.sql
-- 行銷後台:站台公告/橫幅。admin 建立公告,前台頂部顯示啟用中、在有效期間內、
-- priority 最高的一則。冪等。
-- ============================================================================

begin;

create table if not exists announcements (
  id          bigint generated always as identity primary key,
  title       varchar(200) not null,
  body        text,
  link_url    varchar(300),
  link_label  varchar(50),
  active      boolean not null default true,
  priority    int not null default 0,
  starts_at   timestamptz,
  ends_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists announcements_active_idx on announcements (active, priority desc, created_at desc);

commit;

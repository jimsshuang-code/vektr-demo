-- ============================================================================
-- VEKTR migration 020_court_ownership_ugc.sql
-- (1) 場主認領 / 自行新增球場:court_owners
-- (2) 球友(打者)上傳照片/影片(先顯示、可檢舉下架):court_media + court_media_reports
-- 冪等。
-- ============================================================================

begin;

-- ---- (1) 場主與球場關係 ----------------------------------------------------
-- status: pending(待審) / approved(已核准場主) / rejected
-- 場主自行新增的球場:courts.status 先設 'pending',核准後才轉 'active'。
create table if not exists court_owners (
  id          bigserial primary key,
  court_id    bigint not null references courts(id) on delete cascade,
  user_id     bigint not null references users(id) on delete cascade,
  status      varchar(20) not null default 'pending',
  note        text,
  created_at  timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (court_id, user_id)
);
create index if not exists court_owners_user_idx  on court_owners (user_id, status);
create index if not exists court_owners_court_idx on court_owners (court_id, status);

-- 球場是否屬於某已核准場主(供 owner API 授權檢查)
create or replace function is_court_owner(p_court_id bigint, p_user_id bigint)
returns boolean
language sql
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from court_owners
    where court_id = p_court_id and user_id = p_user_id and status = 'approved'
  );
$$;

-- ---- (2) 球友上傳媒體(社群分享) ------------------------------------------
-- kind: 'photo' | 'video';status: 'visible' | 'removed'
create table if not exists court_media (
  id           bigserial primary key,
  court_id     bigint not null references courts(id) on delete cascade,
  user_id      bigint references users(id) on delete set null,
  kind         varchar(10) not null,
  url          text not null,
  status       varchar(10) not null default 'visible',
  report_count int not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists court_media_court_idx on court_media (court_id, status, created_at desc);
create index if not exists court_media_user_idx  on court_media (user_id);

-- 檢舉(同一人對同一則只算一次;達門檻自動隱藏待審)
create table if not exists court_media_reports (
  id          bigserial primary key,
  media_id    bigint not null references court_media(id) on delete cascade,
  reporter_id bigint references users(id) on delete set null,
  reason      varchar(200),
  created_at  timestamptz not null default now(),
  unique (media_id, reporter_id)
);

-- 檢舉一則媒體:累加計數,達 3 次自動轉 removed(可由管理員復原)。回新的 report_count。
create or replace function report_court_media(p_media_id bigint, p_reporter_id bigint, p_reason text)
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count int;
begin
  insert into court_media_reports (media_id, reporter_id, reason)
  values (p_media_id, p_reporter_id, nullif(p_reason, ''))
  on conflict (media_id, reporter_id) do nothing;

  update court_media
     set report_count = (select count(*) from court_media_reports where media_id = p_media_id)
   where id = p_media_id
  returning report_count into v_count;

  if v_count >= 3 then
    update court_media set status = 'removed' where id = p_media_id and status = 'visible';
  end if;
  return coalesce(v_count, 0);
end;
$$;

commit;

-- ============================================================================
-- VEKTR migration 005_reports.sql
-- A2 -- 檢舉 + 停權系統 (Reports + Suspension)
-- ----------------------------------------------------------------------------
-- 執行順序: 001 -> 003 -> 002 -> 004 -> 005 (005 最後)
-- 依賴實表: users(球友), match_rooms / match_participants(約球), admin_users(後台)
--
-- 設計決策 (§6, 已採用建議值, 並依實際 codebase 校正):
--   1. Admin 可見性 -> SECURITY DEFINER function (不加會遞迴的 RLS policy)。
--      admin 身分驗證對 admin_users (後台帳號), 不是 users (球友)。
--   2. 停權執行點   -> login-time (auth callbacks) 與 write-time (API isSuspended)。
--      不走 RLS; 本檔建資料與工具函式。
--   3. match_reports -> 同時擷取 reported_user_id 與 match_id。
--
-- RLS 模型 (重要, 與既有約球不同):
--   App 以「表 owner」連線 (DATABASE_URL)。match_rooms/match_participants 為 FORCE,
--   故 owner 也受 RLS 約束 (靠 app.current_user_id GUC)。
--   match_reports 採 ENABLE 但「不 FORCE」: owner 連線豁免 -> 球友 INSERT、admin
--   讀寫皆可; 球友端本就沒有「讀他人檢舉」的 endpoint, 信任邊界落在 App 層
--   (createReport 強制 reporter_id = 登入者; admin 走 rbac.requireAdmin)。
--   下方仍保留 policy 作為未來最小權限 role 的防線。
--
-- 冪等: 全檔可重複執行。
--
-- GUC 名稱: app_current_user_id() 讀 current_setting('app.current_user_id'),
--           與 app/lib/matchDb.ts 之 set_config('app.current_user_id', ...) 一致。
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 0. 取目前 App 球友 id (對齊 withUser 所 SET 的 GUC)
-- ----------------------------------------------------------------------------
create or replace function app_current_user_id()
returns bigint
language sql
stable
as $$
  select nullif(current_setting('app.current_user_id', true), '')::bigint
$$;

-- ----------------------------------------------------------------------------
-- 1. users 停權欄位 (停權狀態唯一真相)
--    suspended_by 指向 admin_users(id) (執行停權的是後台帳號)。
-- ----------------------------------------------------------------------------
alter table users add column if not exists suspended_at      timestamptz;
alter table users add column if not exists suspended_until   timestamptz;
alter table users add column if not exists suspended_reason  text;
alter table users add column if not exists suspended_by      bigint references admin_users(id);

-- 球友當下是否被停權 (login-time / write-time 共用)。
-- SECURITY DEFINER -> 任何呼叫情境都能讀 users, 不受 RLS 影響。
create or replace function user_is_suspended(p_user_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from users u
    where u.id = p_user_id
      and u.suspended_at is not null
      and (u.suspended_until is null or u.suspended_until > now())
  )
$$;

-- ----------------------------------------------------------------------------
-- 2. match_reports 檢舉表 (同時擷取 reported_user_id 與 match_id)
--    match_id -> match_rooms(id) ON DELETE SET NULL (房刪後檢舉留存供稽核)。
--    resolved_by -> admin_users(id) (結案的是後台帳號)。
-- ----------------------------------------------------------------------------
create table if not exists match_reports (
  id                bigint generated always as identity primary key,
  reporter_id       bigint not null references users(id)        on delete cascade,
  reported_user_id  bigint not null references users(id)        on delete cascade,
  match_id          bigint          references match_rooms(id)  on delete set null,
  category          text   not null
                      check (category in ('harassment','no_show','unsafe','fake_profile','spam','other')),
  detail            text,
  status            text   not null default 'pending'
                      check (status in ('pending','reviewing','resolved','dismissed')),
  resolution        text,
  resolved_by       bigint references admin_users(id),
  resolved_at       timestamptz,
  created_at        timestamptz not null default now(),
  constraint match_reports_no_self check (reporter_id <> reported_user_id)
);

-- 同一檢舉人對同一對象+同一場局, 僅一筆未結案 (防重複洗版)
create unique index if not exists match_reports_dedupe_open
  on match_reports (reporter_id, reported_user_id, coalesce(match_id, 0))
  where status in ('pending','reviewing');

create index if not exists match_reports_status_idx   on match_reports (status, created_at desc);
create index if not exists match_reports_reported_idx on match_reports (reported_user_id);
create index if not exists match_reports_match_idx    on match_reports (match_id);

-- ----------------------------------------------------------------------------
-- 3. RLS (ENABLE, 不 FORCE -> owner 連線豁免; policy 為未來最小權限 role 防線)
-- ----------------------------------------------------------------------------
alter table match_reports enable row level security;

drop policy if exists mreport_insert_self on match_reports;
create policy mreport_insert_self on match_reports
  for insert
  with check (reporter_id = app_current_user_id());

drop policy if exists mreport_select_self on match_reports;
create policy mreport_select_self on match_reports
  for select
  using (reporter_id = app_current_user_id());

-- ----------------------------------------------------------------------------
-- 4. Admin SECURITY DEFINER 函式 (身分驗證對 admin_users)
--    呼叫端: App 已過 rbac.requireAdmin; 再傳 admin_users.id 進來雙重把關。
-- ----------------------------------------------------------------------------
create or replace function assert_admin(p_admin_id bigint)
returns void
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare v_ok boolean;
begin
  if p_admin_id is null then
    raise exception 'admin required: null admin id' using errcode = '42501';
  end if;
  select exists (
    select 1 from admin_users a
    where a.id = p_admin_id
      and a.status = 'active'
      and a.role in ('super_admin','admin')
  ) into v_ok;
  if not v_ok then
    raise exception 'admin required: % is not an active admin', p_admin_id using errcode = '42501';
  end if;
end;
$$;

-- 4a. 檢舉佇列
create or replace function admin_list_reports(p_admin_id bigint, p_status text default null)
returns table (
  id bigint, reporter_id bigint, reporter_name text,
  reported_user_id bigint, reported_name text, reported_suspended boolean,
  match_id bigint, match_title text,
  category text, detail text, status text, resolution text,
  resolved_by bigint, resolved_at timestamptz, created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  perform assert_admin(p_admin_id);
  return query
    select r.id, r.reporter_id, ru.name::text, r.reported_user_id, tu.name::text,
           user_is_suspended(r.reported_user_id),
           r.match_id, m.title::text,
           r.category, r.detail, r.status, r.resolution,
           r.resolved_by, r.resolved_at, r.created_at
    from match_reports r
    join users ru on ru.id = r.reporter_id
    join users tu on tu.id = r.reported_user_id
    left join match_rooms m on m.id = r.match_id
    where p_status is null or r.status = p_status
    order by
      case r.status when 'pending' then 0 when 'reviewing' then 1 else 2 end,
      r.created_at desc;
end;
$$;

-- 4b. 結案 / 改狀態
create or replace function admin_resolve_report(
  p_admin_id bigint, p_report_id bigint, p_status text, p_resolution text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform assert_admin(p_admin_id);
  if p_status not in ('pending','reviewing','resolved','dismissed') then
    raise exception 'invalid status: %', p_status using errcode = '22023';
  end if;
  update match_reports
     set status      = p_status,
         resolution  = coalesce(p_resolution, resolution),
         resolved_by = case when p_status in ('resolved','dismissed') then p_admin_id else null end,
         resolved_at = case when p_status in ('resolved','dismissed') then now()      else null end
   where id = p_report_id;
  if not found then
    raise exception 'report % not found', p_report_id using errcode = 'P0002';
  end if;
end;
$$;

-- 4c. 停權 (p_until = NULL -> 永久)
create or replace function admin_suspend_user(
  p_admin_id bigint, p_user_id bigint, p_reason text, p_until timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform assert_admin(p_admin_id);
  update users
     set suspended_at = now(), suspended_until = p_until,
         suspended_reason = p_reason, suspended_by = p_admin_id
   where id = p_user_id;
  if not found then
    raise exception 'user % not found', p_user_id using errcode = 'P0002';
  end if;
end;
$$;

-- 4d. 解除停權
create or replace function admin_unsuspend_user(p_admin_id bigint, p_user_id bigint)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform assert_admin(p_admin_id);
  update users
     set suspended_at = null, suspended_until = null,
         suspended_reason = null, suspended_by = null
   where id = p_user_id;
  if not found then
    raise exception 'user % not found', p_user_id using errcode = 'P0002';
  end if;
end;
$$;

commit;

-- ============================================================================
-- 驗證: 見 verify/reports_test.sql
-- ============================================================================

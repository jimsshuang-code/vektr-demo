-- ============================================================================
-- VEKTR migration 017_email_google_auth.sql
-- 新增兩種登入:
--   (1) Google 登入(Gmail):users.google_user_id + upsert_google_user
--   (2) Email + 密碼註冊:users.email / password_hash / email_verified
--       + register_user(註冊) + find_user_for_login(登入查詢)
-- 皆 SECURITY DEFINER(繞 RLS),冪等可重複執行。
-- ============================================================================

begin;

-- ---- 欄位(冪等) -----------------------------------------------------------
alter table users add column if not exists google_user_id varchar(255);
alter table users add column if not exists email          varchar(255);
alter table users add column if not exists password_hash  varchar(255);
alter table users add column if not exists email_verified boolean not null default false;

-- google sub 唯一(僅非 null)
create unique index if not exists users_google_user_id_key
  on users (google_user_id) where google_user_id is not null;

-- email/密碼帳號:同一 email 只能註冊一個密碼帳號(不影響 LINE/Apple/Google 那些 password_hash 為 null 的列)
create unique index if not exists users_email_password_key
  on users (lower(email)) where password_hash is not null;

-- ---- (1) Google 登入 -------------------------------------------------------
-- 以 Google sub 建/取球友,回 users.id 與 role(對齊 upsert_line_user / upsert_apple_user)。
create or replace function upsert_google_user(
  p_sub text, p_name text, p_email text, p_picture text
)
returns table(id bigint, role text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id bigint;
  v_role text;
begin
  select u.id, u.role into v_id, v_role from users u where u.google_user_id = p_sub limit 1;
  if v_id is null then
    insert into users (google_user_id, name, email, avatar_url, role, referral_code, email_verified)
    values (
      p_sub,
      coalesce(nullif(p_name, ''), 'Google 球友'),
      nullif(p_email, ''),
      nullif(p_picture, ''),
      'user',
      'R' || substr(md5(random()::text || clock_timestamp()::text), 1, 9),
      true   -- Google 已驗證 email
    )
    returning users.id, users.role into v_id, v_role;
  end if;
  return query select v_id, v_role::text;
end;
$$;

-- ---- (2) Email + 密碼:註冊 ------------------------------------------------
-- 密碼雜湊在應用層(bcrypt)算好再傳入;此處只負責落地與唯一性檢查。
create or replace function register_user(
  p_email text, p_password_hash text, p_name text
)
returns table(id bigint, role text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id bigint;
  v_role text;
  v_email text;
begin
  v_email := lower(trim(p_email));
  if v_email is null or v_email = '' then raise exception 'email_required'; end if;
  if p_password_hash is null or p_password_hash = '' then raise exception 'password_required'; end if;
  if exists (select 1 from users where lower(email) = v_email and password_hash is not null) then
    raise exception 'email_taken';
  end if;
  insert into users (email, password_hash, name, role, referral_code, email_verified)
  values (
    v_email,
    p_password_hash,
    coalesce(nullif(p_name, ''), '球友'),
    'user',
    'R' || substr(md5(random()::text || clock_timestamp()::text), 1, 9),
    false   -- email 尚未驗證(寄驗證信為後續工作)
  )
  returning users.id, users.role into v_id, v_role;
  return query select v_id, v_role::text;
end;
$$;

-- ---- (2) Email + 密碼:登入查詢 -------------------------------------------
-- 回傳該 email 的密碼帳號(id / role / 雜湊),由應用層 bcrypt.compare 驗證。
create or replace function find_user_for_login(p_email text)
returns table(id bigint, role text, password_hash text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return query
    select u.id, u.role::text, u.password_hash
    from users u
    where lower(u.email) = lower(trim(p_email))
      and u.password_hash is not null
    limit 1;
end;
$$;

commit;

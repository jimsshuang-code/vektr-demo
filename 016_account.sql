-- ============================================================================
-- VEKTR migration 016_account.sql
-- (1) delete_user_account:刪除球友帳號與其關聯資料(Apple App Store 硬性要求)。
-- (2) Apple 登入支援:users.apple_user_id + upsert_apple_user。
-- 皆 SECURITY DEFINER(繞 RLS),冪等。
-- ============================================================================

begin;

-- ---- (1) 刪除帳號 ----------------------------------------------------------
create or replace function delete_user_account(p_user_id bigint)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_user_id is null then return; end if;
  -- 預約 / 預約需求 / 裝置 token / 檢舉(其資料)
  delete from court_reservations where user_id = p_user_id;
  delete from coach_bookings where student_user_id = p_user_id;
  delete from device_tokens where user_id = p_user_id;
  delete from match_reports where reporter_id = p_user_id or reported_user_id = p_user_id;
  -- 此人開的球局:先刪參加者,再刪房
  delete from match_participants where match_id in (select id from match_rooms where host_id = p_user_id);
  delete from match_rooms where host_id = p_user_id;
  -- 此人在他人球局的參與
  delete from match_participants where user_id = p_user_id;
  -- 推薦關係解除(避免 FK 卡住)
  update users set referred_by = null where referred_by = p_user_id;
  -- 付款訂單留存稽核但解除個資關聯
  update payment_orders set user_id = null where user_id = p_user_id;
  -- 最後刪本人
  delete from users where id = p_user_id;
end;
$$;

-- ---- (2) Apple 登入 --------------------------------------------------------
alter table users add column if not exists apple_user_id varchar(255);
create unique index if not exists users_apple_user_id_key on users (apple_user_id) where apple_user_id is not null;

-- 以 Apple sub 建/取球友,回 users.id 與 role(對齊 upsert_line_user 模式)。
create or replace function upsert_apple_user(p_sub text, p_name text, p_email text)
returns table(id bigint, role text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id bigint;
  v_role text;
begin
  select u.id, u.role into v_id, v_role from users u where u.apple_user_id = p_sub limit 1;
  if v_id is null then
    insert into users (apple_user_id, name, role, referral_code)
    values (
      p_sub,
      coalesce(nullif(p_name, ''), 'Apple 球友'),
      'user',
      'R' || substr(md5(random()::text || clock_timestamp()::text), 1, 9)
    )
    returning users.id, users.role into v_id, v_role;
  end if;
  return query select v_id, v_role::text;
end;
$$;

commit;

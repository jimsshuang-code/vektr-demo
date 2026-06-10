-- ============================================================================
-- VEKTR migration 008_referral_admin.sql
-- 後台推薦成長報表用的 SECURITY DEFINER 查詢函式。
-- 依賴:007_referral.sql(users.referred_by)、005(assert_admin)。
-- 身分驗證對 admin_users(傳 admin_users.id),與其他 admin 函式一致。
-- 冪等、可重複執行。型別:對 varchar 欄位加 ::text 以符合 RETURNS TABLE 宣告。
-- ============================================================================

begin;

-- 推薦排行榜:每位推薦人邀來的已綁定球友數,由多到少。
create or replace function admin_referral_stats(p_admin_id bigint)
returns table (
  referrer_id   bigint,
  referrer_name text,
  referral_code text,
  invited       bigint
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  perform assert_admin(p_admin_id);
  return query
    select u.id, u.name::text, u.referral_code::text, count(r.id)::bigint
      from users u
      join users r on r.referred_by = u.id
     group by u.id, u.name, u.referral_code
     order by count(r.id) desc, u.id
     limit 500;
end;
$$;

-- 總計:已被歸因的球友數、有效推薦人數。
create or replace function admin_referral_summary(p_admin_id bigint)
returns table (
  total_invited   bigint,
  total_referrers bigint
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  perform assert_admin(p_admin_id);
  return query
    select
      (select count(*) from users where referred_by is not null)::bigint,
      (select count(distinct referred_by) from users where referred_by is not null)::bigint;
end;
$$;

commit;

-- 驗證(手動):
--   select * from admin_referral_summary(<admin_users.id>);
--   select * from admin_referral_stats(<admin_users.id>);

-- ============================================================================
-- VEKTR migration 009_referral_self.sql
-- 球友端「我邀了幾人」頁用的自身推薦統計。依賴 007(users.referred_by)。
-- my_referral_stats 為 SECURITY DEFINER:由 /invites 頁以登入球友自己的 id 呼叫,
-- 只回該球友邀來的名單(呼叫端一律傳 session 的 users.id,不接受任意 id)。
-- 冪等、可重複執行。name 加 ::text 以符合 RETURNS TABLE 宣告。
-- ============================================================================

begin;

create or replace function my_referral_stats(p_user_id bigint)
returns table (
  user_id    bigint,
  name       text,
  joined_at  timestamptz
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if p_user_id is null then
    return;
  end if;
  return query
    select u.id, u.name::text, u.created_at
      from users u
     where u.referred_by = p_user_id
     order by u.created_at desc
     limit 200;
end;
$$;

commit;

-- 驗證(手動):
--   select * from my_referral_stats(<球友 users.id>);

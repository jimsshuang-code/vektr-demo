-- ============================================================================
-- VEKTR migration 010_member.sql
-- 會員中心用的自身資料查詢函式(SECURITY DEFINER,只回呼叫者自己的資料)。
-- /match/history 與 /member/friends 使用。呼叫端一律傳 session 的 users.id。
-- 冪等。varchar 欄位加 ::text 以符合 RETURNS TABLE 宣告。
-- ============================================================================

begin;

-- 我的約球歷史(過去與現在參與的球局,新到舊)
create or replace function my_match_history(p_user_id bigint)
returns table (
  match_id     bigint,
  title        text,
  scheduled_at timestamptz,
  duration_min int,
  status       text,
  court_name   text,
  my_rating    int,
  my_status    text
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if p_user_id is null then return; end if;
  return query
    select m.id, m.title::text, m.scheduled_at, m.duration_min, m.status::text,
           co.name::text, mp.rating, mp.status::text
      from match_participants mp
      join match_rooms m on m.id = mp.match_id
      left join courts co on co.id = m.court_id
     where mp.user_id = p_user_id
     order by m.scheduled_at desc
     limit 200;
end;
$$;

-- 我的球友(曾在同一場球局一起 joined 過的人),依共同場次數排序
create or replace function my_play_partners(p_user_id bigint)
returns table (
  user_id     bigint,
  name        text,
  avatar_url  text,
  dupr_rating numeric,
  games       bigint
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if p_user_id is null then return; end if;
  return query
    select u.id, u.name::text, u.avatar_url::text, u.dupr_rating,
           count(distinct mp2.match_id)
      from match_participants mp1
      join match_participants mp2
        on mp2.match_id = mp1.match_id and mp2.user_id <> mp1.user_id
      join users u on u.id = mp2.user_id
     where mp1.user_id = p_user_id
       and mp1.status = 'joined'
       and mp2.status = 'joined'
     group by u.id, u.name, u.avatar_url, u.dupr_rating
     order by count(distinct mp2.match_id) desc, u.id
     limit 200;
end;
$$;

commit;

-- 驗證(手動):
--   select * from my_match_history(<球友 id>);
--   select * from my_play_partners(<球友 id>);

-- ============================================================================
-- VEKTR migration 006_match_lifecycle.sql
-- 球局生命週期自動化:把「已過結束時間」的開放球局自動關閉(open -> completed)。
-- ----------------------------------------------------------------------------
-- 動機:
--   約球列表已過濾 status='open' AND scheduled_at >= now(),過期房不會出現在列表;
--   但「直接帶連結」仍可能對過期房點加入(detail 的 canJoin 只看 status/滿房)。
--   本函式讓 status 反映真實狀態:過期 -> completed,使
--     1. 直接連結也無法再加入過期房,
--     2. OG 卡 / UI 顯示正確(已結束),
--     3. 評分以 status='completed' 自然成立(與時間判斷一致)。
--
-- 設計:
--   SECURITY DEFINER -> 由排程(cron route)以一般連線呼叫即可,不受 RLS 約束。
--   只動 status='open' 且 scheduled_at + duration_min 已過者;不碰 cancelled/completed。
--   冪等、可重複執行。
-- ============================================================================

begin;

create or replace function match_close_expired()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  update match_rooms
     set status = 'completed'
   where status = 'open'
     and scheduled_at + make_interval(mins => duration_min) < now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

commit;

-- 驗證(手動):
--   select match_close_expired();   -- 回傳本次關閉的房間數

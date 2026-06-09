-- ============================================================================
-- VEKTR migration 007_referral.sql
-- 推薦碼歸因:記錄「誰推薦了這個新球友」。完成 Sprint2 發酵邀約的成長迴圈
-- (分享連結帶 ?ref=<referral_code> -> 前端寫入 vektr_ref cookie -> 登入時綁定)。
-- ----------------------------------------------------------------------------
-- 綁定策略(MVP):first-touch、只在 referred_by IS NULL 時綁定、禁止自我推薦。
--   先有 referral_code 欄(既有),本檔新增 referred_by 指回推薦人 users(id)。
--   bind_referral 為 SECURITY DEFINER:由 auth signIn callback 以一般連線呼叫即可。
-- 冪等、可重複執行。
-- ============================================================================

begin;

alter table users add column if not exists referred_by bigint references users(id);
create index if not exists users_referred_by_idx on users (referred_by);

-- 以推薦碼把新球友綁到推薦人。回傳是否完成綁定。
--   p_user_id : 剛登入/註冊的球友 users.id
--   p_ref_code: vektr_ref cookie 內的推薦碼(= 推薦人的 users.referral_code)
-- 僅在 (新球友 referred_by 為 NULL) 且 (找得到推薦人) 且 (推薦人 <> 本人) 時綁定。
create or replace function bind_referral(p_user_id bigint, p_ref_code text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_referrer bigint;
begin
  if p_user_id is null or p_ref_code is null or btrim(p_ref_code) = '' then
    return false;
  end if;

  -- 找推薦人
  select id into v_referrer
    from users
   where referral_code = p_ref_code
   limit 1;

  if v_referrer is null or v_referrer = p_user_id then
    return false; -- 找不到推薦人,或自我推薦
  end if;

  -- 只在尚未綁定時綁定(first-touch wins)
  update users
     set referred_by = v_referrer
   where id = p_user_id
     and referred_by is null;

  return found;
end;
$$;

commit;

-- 驗證(手動):
--   select bind_referral(<新球友 id>, '<推薦人 referral_code>');  -- 第一次 true,再呼叫 false

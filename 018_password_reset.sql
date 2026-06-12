-- ============================================================================
-- VEKTR migration 018_password_reset.sql
-- 忘記密碼:重設 token 資料表 + 函式。
--   - create_reset_token:落地一筆 token(raw token 與 hash 由應用層產生)
--   - find_password_user:依 email 找密碼帳號
--   - reset_password_with_token:驗證 token(未過期未使用)並更新密碼
-- 皆 SECURITY DEFINER,冪等。
-- ============================================================================

begin;

create table if not exists password_reset_tokens (
  id         bigserial primary key,
  user_id    bigint not null references users(id) on delete cascade,
  token_hash varchar(64) not null,        -- sha256(raw token) 的十六進位
  expires_at timestamptz not null,
  used_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists prt_token_hash_idx on password_reset_tokens (token_hash);
create index if not exists prt_user_idx        on password_reset_tokens (user_id);

-- 依 email 找密碼帳號(回 id);找不到回空集合(不洩漏帳號是否存在交由應用層處理)。
create or replace function find_password_user(p_email text)
returns table(id bigint)
language sql
security definer
set search_path = public, pg_temp
as $$
  select u.id
  from users u
  where lower(u.email) = lower(trim(p_email))
    and u.password_hash is not null
  limit 1;
$$;

-- 落地一筆重設 token。
create or replace function create_reset_token(
  p_user_id bigint, p_token_hash text, p_expires timestamptz
)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  insert into password_reset_tokens (user_id, token_hash, expires_at)
  values (p_user_id, p_token_hash, p_expires);
$$;

-- 用 token 重設密碼:驗證未過期且未使用 → 更新 users.password_hash → 標記該 token 與
-- 同用戶其他未使用 token 為 used。回更新到的 user_id(失敗回 0)。
create or replace function reset_password_with_token(
  p_token_hash text, p_new_hash text
)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id   bigint;
  v_user bigint;
begin
  select id, user_id into v_id, v_user
  from password_reset_tokens
  where token_hash = p_token_hash
    and used_at is null
    and expires_at > now()
  order by created_at desc
  limit 1;

  if v_user is null then
    return 0;
  end if;

  update users set password_hash = p_new_hash where id = v_user;
  update password_reset_tokens set used_at = now()
   where user_id = v_user and used_at is null;
  return v_user;
end;
$$;

commit;

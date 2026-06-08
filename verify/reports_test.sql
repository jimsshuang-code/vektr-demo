-- ============================================================================
-- verify/reports_test.sql  --  A2 檢舉 + 停權 只讀/可回滾驗證
-- 用法: psql "$DATABASE_URL" -f verify/reports_test.sql
-- 全程包在 transaction, 最後 ROLLBACK -> 不污染資料。
-- 把 :admin_id 換成真正 admin_users.id(role in super_admin/admin, status active)。
-- ============================================================================
\set ON_ERROR_STOP on
\set admin_id 1
begin;

select 'has match_reports' as check, to_regclass('public.match_reports') is not null as ok;

select 'users suspended cols' as check, count(*) = 4 as ok
  from information_schema.columns
 where table_name = 'users' and column_name like 'suspended%';

select 'suspended_by -> admin_users' as check, count(*) = 1 as ok
  from information_schema.constraint_column_usage ccu
  join information_schema.table_constraints tc using (constraint_name)
 where tc.table_name = 'users' and ccu.table_name = 'admin_users';

select 'fns present' as check, count(*) >= 7 as ok
  from pg_proc
 where proname in ('app_current_user_id','user_is_suspended','assert_admin',
                   'admin_list_reports','admin_resolve_report','admin_suspend_user','admin_unsuspend_user');

-- admin 可列佇列(換成真 admin id)
select 'admin can list' as check, true as ok
  from admin_list_reports(:admin_id, null) limit 1;

-- 非 admin 應被擋(取消註解單測, 預期 ERROR: admin required):
--   select * from admin_list_reports(999999, null);

rollback;
-- ============================================================================

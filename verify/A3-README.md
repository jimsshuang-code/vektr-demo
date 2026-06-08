# A3 多帳號實測 — 使用說明

`verify/a3_multiuser.mjs`:對真實 DB 用多連線重現 app 的 `withUser` 與約球路由 SQL,以**真並發**驗證滿房上限、`pg_advisory_xact_lock` 序列化、退出/補位、房主取消、評分時點、停權整合。全程用 `A3TEST_` 標記的拋棄式資料,結束自動清除。

## 跑法(Mac terminal,專案根)

```bash
DIRECT_URL="postgresql://...5432..." node verify/a3_multiuser.mjs
```

連線優先序:`A3_DATABASE_URL` > `DIRECT_URL` > `DATABASE_URL`。
**建議用 `DIRECT_URL`(5432 session 連線)**,並發測試最穩;pooler(6543)也可,但 16 條連線可能受 pool 限制。

需求:`005_reports.sql` 已套用(停權函式)、DB 內有至少一個 `status='active'` 且 role 為 `admin`/`super_admin` 的 `admin_users`(否則停權場景自動 SKIP)。

## 涵蓋場景(9 類)

1. 並發開搶滿房:max=4、房主佔 1,9 人同時搶 → 恰 3 人成功、6 人滿房、最終 joined=4。
2. 退出釋出名額 → 等候者補入。
3. 重複加入被擋(未滿房時回 already)。
4. 退出者可重新加入(re-activate)。
5. 滿房再搶仍被擋。
6. 房主退出 = 取消整場;已取消無法再加入。
7. 未結束球局不可評分。
8. 已結束球局:參加者可評分(1–5);越界分數、非參加者被擋。
9. 停權整合:`admin_suspend_user` → `user_is_suspended=true`;解除 → false。

## 驗證紀錄

此腳本邏輯已用 PGlite(真 Postgres,序列化版)跑過 **17 項斷言全綠**。並發保證(advisory lock)需在真實 Postgres 多連線下成立,即由本腳本在你的 DB 上驗證。

> 注意:`join` 路由是「先檢查滿房、後檢查是否已加入」。因此已加入者在「滿房」時再點加入會收到「額滿」而非「你已在此球局中」——屬正常行為,場景 3 因而在未滿房的獨立房驗證 already 分支。

## 退場清理

腳本 finally 會刪除所有 `A3TEST_` 資料。若中途強制中斷,手動清:

```sql
DELETE FROM match_participants WHERE match_id IN (SELECT id FROM match_rooms WHERE title='A3TEST_room')
   OR user_id IN (SELECT id FROM users WHERE name LIKE 'A3TEST_%');
DELETE FROM match_rooms WHERE title='A3TEST_room';
DELETE FROM users WHERE name LIKE 'A3TEST_%';
```

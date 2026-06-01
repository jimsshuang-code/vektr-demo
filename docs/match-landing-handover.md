# VEKTR · 約球功能 落地交接(Sprint 1 已上線本機驗證)

> 完成日:2026-06-01 · 分支:`feature/match-sprint01`
> 狀態:約球 MVP 在**真實 Supabase + 本機 dev** 跑通(開房/瀏覽/名單/計數/RLS 全驗證)。
> 撰寫對象:接手這條線的人(或未來的你)。貼這份即可掌握現況與下一步。

---

## 0. 一句話現況

約球的「開房 → 瀏覽 → 詳情 → 名單 → 取消 → 分享」已在真實環境跑通,跑在 Postgres RLS 之上。
**唯一的臨時件**:球友登入尚未接上,目前用 `MATCH_DEV_USER_ID` 環境變數模擬單一測試球友(id=9)。接上 LINE 登入後即可拔除。

---

## 1. 這次實際做了什麼

### 資料庫(Supabase,已套用)
依序跑了三支 migration(`001` courts 早已存在,跳過):
- `003_auth.sql` — 建 `users`(一般球友,與既有 `admin_users` 分開)、`app_uid()`、`upsert_line_user()`、RLS。
- `002_match.sql` — 建 `match_rooms`、`match_participants`。
- `004_match_rls_patch.sql` — match 兩表的 RLS(唯一權威來源)。

RLS 狀態(已驗證):`courts` 無 RLS、`match_rooms`/`match_participants` = FORCE、`users` = ENABLE 但 NO FORCE。

### 程式碼(已整合進 repo,build 通過)
對齊既有 repo 風格(raw `pg` pool、`NextResponse`、API 仿 courts route、路由用 `/match` 單數):

| 檔案 | 作用 |
|---|---|
| `app/lib/currentUser.ts` | 取目前球友 id;含 `MATCH_DEV_USER_ID` dev 後備(僅非 production) |
| `app/lib/matchDb.ts` | `withUser()` RLS 交易 helper(沿用既有 `app/lib/db.ts` 的 pool) |
| `app/api/v1/matches/route.ts` | 列表(篩 city/date/dupr/附近)+ 開房 |
| `app/api/v1/matches/[id]/route.ts` | 詳情 + 名單 + viewer 關係 |
| `app/api/v1/matches/[id]/join/route.ts` | 加入(advisory lock 序列化) |
| `app/api/v1/matches/[id]/leave/route.ts` | 退出(房主退出=取消整場) |
| `app/api/v1/matches/[id]/rate/route.ts` | 賽後評分(1–5) |
| `app/match/page.tsx` | 列表頁(取代原 placeholder) |
| `app/match/create/page.tsx` | 開房頁(取代原 placeholder) |
| `app/match/[id]/page.tsx` | 詳情頁(新增) |

**未動**:`auth.ts`、`auth.config.ts`、`app/lib/db.ts`、`app/lib/prisma.ts`、`middleware.ts`、`prisma/`、`app/match/find`、`app/match/history`。

---

## 2. 關鍵設計決策(為什麼這樣做)

- **約球用 raw `pg`,不用 Prisma**:沿用既有 courts 的資料路徑,最短路徑接上;RLS 透過 `withUser()` 在交易內 `set_config('app.current_user_id')` 生效。
- **`users` 與 `admin_users` 分開**:admin_users = 後台人員(帳密+2FA);users = 一般球友(未來 LINE 登入)。約球 `host_id` 指向 users。
- **計數真相 = COUNT**:`current_players` 欄位僅便利,滿房由 `count(joined) >= max_players` 推導。
- **房主退出 = 取消球局**(MVP 不做房主轉移)。
- **RLS 斷遞迴**:`mr_read` 只看 `open`/房主(不回查 participants),`mp_read` 只參照 match_rooms。副作用:**非 open 房間(如已取消)只有房主看得到**,MVP 可接受。
- **評分**:`match_participants.rating` 單欄,解讀為「我對這場的評分」。球友互評需另開 ratings 表(後續)。

---

## 3. 環境變數

`.env.local`(本機)新增:
```
MATCH_DEV_USER_ID=9
```
- 作用:在球友登入接上前,把未登入請求當成 id=9 的測試球友。
- 安全:`currentUser.ts` 限定僅 `NODE_ENV !== 'production'` 生效,正式環境不會吃這個後備。
- **這是臨時件**,接上 LINE 登入後刪除,並改由 `auth()` 回傳球友 users.id。

測試球友(已建於 DB):id=9、`測試球友 Jim`、`referral_code=DEVJIM01`、DUPR 3.5、台北市。

---

## 4. 如何在本機重跑

```bash
cd /Users/jim/projects/vektr-demo
git checkout feature/match-sprint01
npm install
npm run dev
# 瀏覽器:http://localhost:3000/match
```
DB 已是套用後狀態,無需重跑 migration。若要在新環境重建,依序跑:`001 → 003 → 002 → 004`。

---

## 5. 已驗證 / 尚未做

**已驗證(真實環境)**:build 通過、開房、列表、詳情、名單、即時計數、房主可取消、RLS 開關正確、dev 身分生效。

**尚未做(下一步候選)**:
1. **球友 LINE 登入**(最關鍵)— 讓真實使用者能登入,拔掉 `MATCH_DEV_USER_ID`。需:`users` 接 LINE provider、`auth()` 回傳球友 users.id(目前 session 來自 adminUser)。
2. **多帳號實測 join/leave/rate** — 目前只用單一 dev 身分,加入/退出/評分的多人流程尚未實跑。
3. **Sprint 2 發酵邀約** — 動態 OG 分享卡、缺人 LINE 通知、推薦碼歸因(`?ref=` 已寫入 cookie,綁定邏輯待做)。
4. **生命週期自動化** — cron 將過期房轉 started/completed(讓評分入口自然開啟)。
5. **middleware → proxy** — Next.js 16 提醒 `middleware.ts` 改名 `proxy.ts`(既有檔,與約球無關)。

---

## 6. 相關文件

`match-predev-assessment`(開發前評估)、`SP0-auth-handover`、`SP1-match-handover`、`legal-track-handover`(法務線)、`004_match_rls_patch.sql`、`verify/rls_test.sql`(RLS 驗證 harness)。

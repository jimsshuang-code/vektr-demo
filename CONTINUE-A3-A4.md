# VEKTR · Cowork 延續交接(A2 已上線 → A3 / A4)

> 用途:供新的 Cowork 視窗接手。讀完即可繼續 A3(多帳號迴歸)與 A4(移除 dev 後備)。
> 更新:2026-06-08 · 分支 `feature/match-sprint01` · commit `38fc49f` · 繁中為主、英文識別碼、無 emoji。
> 交付規範沿用原 handover:完整檔案內容、不給 diff;改動後附驗證指令;動工前先 codebase audit。

---

## 0. 目前狀態(一頁速覽)

- **A2 檢舉 + 停權 已上線正式站** https://vektr-demo.vercel.app(2026-06-08)。
- 程式已 commit+push:`feature/match-sprint01` @ `38fc49f`(25 檔,1476+)。
- `005_reports.sql` 已套用正式 Supabase。Vercel Production 環境變數已補齊。
- 專案根:`/Users/jim/projects/vektr-demo`。GitHub:`jimsshuang-code/vektr-demo`(private)。

### 已上線的 A2 內容
- `005_reports.sql`:`match_reports` 表、`users` 停權欄位(suspended_at/until/reason/by)、RLS、SECURITY DEFINER admin 函式。
- 球友:檢舉鈕(`app/match/_components/ReportButton.tsx`,接在 `/match/[id]` 名單)、`POST /api/v1/reports`。
- 後台:`/admin/matches` 佇列(停權/解除/結案),`PATCH /api/v1/admin/reports/[id]`、`POST|DELETE /api/v1/admin/users/[id]/suspend`,皆走 `rbac.requireAdmin('members',{write})` + `auditLog`。
- 停權執行:login-time(`auth.ts` signIn callback,僅 LINE,redirect `/suspended`)+ write-time(`reports`/`matches`/`join` 路由的 `isSuspended` 403)。
- 修問題 1/2:全站 `SessionProvider`(`app/components/Providers.tsx`)+ `HeaderAuth`,Header 反映實際登入;`/match/create` 401/403 處理;`app/match/layout.tsx` 移除重複 provider。

---

## 1. 環境與工具(沿用本機現況)

- psql / pg_dump:由 `brew install libpq` 提供,需把 PATH 加上 `$(brew --prefix libpq)/bin`(每個新終端機都要設一次):
  ```bash
  export PATH="$(brew --prefix libpq)/bin:$PATH"
  ```
- 從 `.env.local` 安全載入連線字串(不印出值):
  ```bash
  export DIRECT_URL=$(grep -E '^DIRECT_URL=' .env.local | sed -E 's/^[^=]+=//; s/^"//; s/"$//')
  export DATABASE_URL=$(grep -E '^DATABASE_URL=' .env.local | sed -E 's/^[^=]+=//; s/^"//; s/"$//')
  ```
- 備份:`~/vektr-backup-20260608-1806.dump`(`pg_dump "$DIRECT_URL" -Fc`)。跑任何 schema 變更前先做一份。
- Vercel:CLI 已登入;Production 已設 `AUTH_SECRET / AUTH_LINE_ID / AUTH_LINE_SECRET / DIRECT_URL / DATABASE_URL / NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`。改 env 後要 `vercel --prod` 才生效。
- 部署:`vercel`=Preview(preview 網址有 Vercel SSO 保護),`vercel --prod`=正式站(公開)。env 詢問 pull/overwrite 一律 `N`。

---

## 2. 關鍵架構事實(整合 A2 時校正,務必記住)

- **admin 與球友是不同身分空間**:admin 在 `admin_users`(role super_admin/admin/editor/coach/viewer,Credentials 登入),球友在 `users`(role 'user',LINE 登入)。`session.user.id` 對 admin 是 `admin_users.id`、對球友是 `users.id`。
- **約球房間表是 `match_rooms`**(不是 matches);參加者 `match_participants`(status 'joined'/'left',真相計數 = COUNT joined);並發用 `pg_advisory_xact_lock(match_id)`。
- **RLS GUC 是 `app.current_user_id`**;`app/lib/matchDb.ts` 的 `withUser(userId, fn)` 用 `set_config('app.current_user_id', ...)`,fn 收 `pg.PoolClient`。
- **match_reports 採 ENABLE 但不 FORCE**:App 以 owner 連線豁免;信任邊界在 App 層(createReport 強制 reporter_id=登入者);admin 讀寫走 SECURITY DEFINER 函式(傳 `admin_users.id`,函式內 `assert_admin(p_admin_id)` 驗證 active 且 role in super_admin/admin)。**不要對 admin 身分查 `users` 表。**
- `app/lib/currentUser.ts`:`getCurrentUser()` / `requireUser()` 回 `{id,role}`;含 `MATCH_DEV_USER_ID` dev 後備(僅 `NODE_ENV!=='production'`)。
- `auth.config.ts` 為 edge-safe(純 callback,勿加 DB);需要 DB 的 callback(如 signIn 停權檢查)放 `auth.ts`(node)。

---

## 3. 上線中踩過的雷(避免重蹈)

1. **RETURNS TABLE 型別**:`users.name` 是 `varchar(100)`,函式宣告 `text` 會報「structure of query does not match function result type」。解:SELECT 內對 varchar 欄位加 `::text`(已修 `admin_list_reports`)。離線用 PGlite 驗證若 stub 用 `text` 會漏掉,記得 stub 要用 `varchar`。
2. **Vercel env 缺漏**:Auth.js「There is a problem with the server configuration」= 缺 `AUTH_SECRET`(或 provider 的 clientId/secret)。用 `vercel env ls` 檢查 Production 欄。
3. **LINE callback 白名單**:LINE 400「Invalid redirect_uri」= LINE Developers 後台未加正式站 callback。需加 `https://vektr-demo.vercel.app/api/auth/callback/line`(已加)。
4. **`.git/index.lock` 殘留**:git add/commit 報 lock 存在 → 確認沒有開著的 commit 編輯器後 `rm -f .git/index.lock`。
5. **Prisma directUrl**:schema 有 `directUrl = env("DIRECT_URL")`,runtime 缺 `DIRECT_URL` 會丟錯,Production 必須設。

---

## 4. 下一步任務 A:A3 多帳號迴歸(對正式 DB)

腳本已寫好:`verify/a3_multiuser.mjs`(已用 PGlite 17 斷言通過;真並發需對真 Postgres 跑)。涵蓋:並發滿房上限、advisory lock 序列化、退出補位、重複加入、房主取消、評分時點、越界/非參加者守衛、停權整合。用 `A3TEST_` 拋棄式資料,結束自動清除。

執行(Mac,專案根,PATH 已含 libpq、`.env.local` 有 DIRECT_URL):
```bash
DIRECT_URL=$(grep -E '^DIRECT_URL=' .env.local | sed -E 's/^[^=]+=//; s/^"//; s/"$//') \
  node verify/a3_multiuser.mjs
```
- 預期:`N passed, 0 failed`,最後印「已清除 A3TEST_ 測試資料」。
- 需求:`005` 已套用(已)、DB 內有 active super_admin/admin(有)。
- 細節見 `verify/A3-README.md`。
- 若中途中斷殘留,清理 SQL 也在該 README。

A3 全綠 = 多帳號/並發行為通過,可推進 A4。

---

## 5. 下一步任務 B:A4 移除 `MATCH_DEV_USER_ID` dev 後備

前提:A3 通過、且正式站球友 LINE 登入已穩(已上線可登入)。

動工前先 audit `app/lib/currentUser.ts`。要移除的是「2) DEV 後備身分」這段(`process.env.MATCH_DEV_USER_ID` 那段),讓未登入一律回 null(→ API 401)。

影響面檢查(grep 確認沒有殘留依賴):
```bash
grep -rn "MATCH_DEV_USER_ID" app/ ; grep -rn "MATCH_DEV_USER_ID" .
```
移除後:
- 本機 `npm run dev` 未登入打 `/api/v1/matches`(POST)應回 401(不再退回 user 9)。
- `npm run build` 必過。
- 確認 Vercel 沒有設 `MATCH_DEV_USER_ID`(production 本就該失效;可順手移除該 env 若有)。
- 提交 + `vercel --prod`。

> 注意:移除後本機開發若要扮演球友,需改用真 LINE 登入(或暫時保留一個被環境變數保護的測試路徑)。先確認團隊本機開發流程不被卡住再移除。

---

## 6. 紅線(沿用)

1. 對外輸出不得出現供應商真名(寫 "multiple suppliers with confirmed production quotes")。
2. 法務/商標/財務標「需專業確認」、數字標估算。
3. 品牌 CI 嚴格三色(對外行銷物;**站內既有 app UI 用 navy/lime,不在此限**)。
4. 跑 schema migration 前先確認 Supabase 備份。
5. 正式站部署需球友登入到位(已到位);法務(A5)為獨立並行線,隱私權政策仍草案、需律師核。

---

## 7. 相關檔案

- `A2-GO-LIVE.md`(A2 上線 runbook 與檔案清單)
- `005_reports.sql`、`verify/reports_test.sql`、`verify/a3_multiuser.mjs`、`verify/A3-README.md`
- 整合點:`app/lib/matchDb.ts`、`app/lib/currentUser.ts`、`app/lib/rbac.ts`、`app/lib/audit.ts`、`auth.ts`、`auth.config.ts`

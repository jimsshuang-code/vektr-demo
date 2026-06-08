# A2 檢舉 + 停權 — 上線 runbook(整合版,已併入 codebase)

> 分支 `feature/match-sprint01`。本文件對應已整合進 codebase 的 A2。所有檔案皆為實際專案路徑,非 patch。
> §6 三項設計決策已採用建議值並依實際架構校正(admin 在 `admin_users`、表為 `match_rooms`、GUC `app.current_user_id`)。

## 變更檔案

新增
- `005_reports.sql`(repo 根,與 001 同層)— match_reports、users 停權欄位、RLS、SECURITY DEFINER 函式(admin 驗證對 admin_users)
- `verify/reports_test.sql` — 只讀驗證
- `app/lib/reportsDb.ts` — 檢舉/停權資料層(球友 withUser;admin pool + SECURITY DEFINER)
- `app/api/v1/reports/route.ts` — 檢舉 POST
- `app/api/v1/admin/reports/[id]/route.ts` — 結案/改狀態 PATCH(rbac.requireAdmin('members',write) + auditLog)
- `app/api/v1/admin/users/[id]/suspend/route.ts` — 停權 POST / 解除 DELETE(+auditLog)
- `app/match/_components/ReportButton.tsx` — 檢舉按鈕 + Modal
- `app/admin/matches/page.tsx`、`app/admin/matches/ReportQueue.tsx` — 後台佇列
- `app/suspended/page.tsx` — 停權導向頁
- `app/components/Providers.tsx`、`app/components/HeaderAuth.tsx` — 全站 session + Header 登入狀態

修改
- `auth.ts` — signIn callback 加 login-time 停權守衛(僅球友/LINE;redirect /suspended)
- `app/api/v1/matches/route.ts`、`.../[id]/join/route.ts` — write-time 停權守衛(403)
- `app/api/v1/matches/[id]/route.ts` — viewer 加 userId(前端隱藏對自己的檢舉鈕)
- `app/match/[id]/page.tsx` — 名單列接 ReportButton
- `app/match/create/page.tsx` — 401/403 訊息
- `app/layout.tsx` — body 包 Providers(全站 SessionProvider)
- `app/components/Header.tsx` — 靜態「登入」改 HeaderAuth(反映實際登入狀態,修問題 1)
- `app/admin/layout.tsx` — 側欄加「約球檢舉」
- `app/match/layout.tsx` — 移除重複 SessionProvider(改由 root 提供,解 dual-session)

## 已完成驗證
- `005_reports.sql` 以真實 Postgres(PGlite,PG16)實跑,14 項全過:建表、停權欄位、FK→admin_users、RLS、防重複/防自我檢舉、editor/未知 admin 被擋、admin 列表 join match_rooms、停權/限期過期/解除、resolved_by/suspended_by 記 admin id、冪等。
- `npx tsc --noEmit` 全專案 exit 0(含全部新檔)。
- next build 需 Mac 端執行(本機 swc binary);見下方步驟 1。

## 上線步驟(你的 Mac terminal)

前置(硬前提):**先在 Supabase 後台確認/建立一次手動備份**,再跑 migration。

```bash
cd /Users/jim/projects/vektr-demo
git checkout feature/match-sprint01
git pull
npm install
```

1) 本機 build + 型別(必過才續)
```bash
npm run build
```

2) 跑 migration(005 最後,001~004 已在 DB)
```bash
psql "$DATABASE_URL" -f 005_reports.sql
psql "$DATABASE_URL" -f verify/reports_test.sql
```
> verify 內 admin_id 預設 1;若你的 admin_users.id 非 1,改 `\set admin_id`。

3) 本機 smoke test
```bash
npm run dev
```
驗收清單:
- 球友 LINE 登入後,球局詳情頁對「他人」出現「檢舉」→ 送出回 201。
- 後台以 admin 登入 `/admin/matches`：看到檢舉 → 「停權此球友」「標記已處理」可動作;audit_logs 有記錄。
- 對被停權球友:重新登入導向 `/suspended`;其開團/加入 API 回 403。
- 全域 Header:登入顯示姓名+登出;未登入顯示「登入」。

4) Preview(不碰正式站;問 pull env 一律 N)
```bash
vercel
```

5) 正式站(確認 1~4 全綠後)
```bash
vercel --prod
```

## 上線後注意
- Vercel 環境變數需已設好(`DATABASE_URL` pooler、`DIRECT_URL`、`AUTH_SECRET`、`AUTH_LINE_ID/SECRET`、`NEXT_PUBLIC_SITE_URL`);`NEXT_PUBLIC_` 改值需 redeploy。
- LINE OIDC callback URL 需含正式站網域。
- A3(多帳號實測)→ A4(移除 MATCH_DEV_USER_ID)為後續;本批未動。
- 法務(A5)為獨立線,與本功能上線並行;隱私權政策仍為草案,需律師核(標註待專業確認)。

## 回滾
- 程式:`git revert` 本批 commit 後 redeploy。
- DB:005 僅「新增」table/欄位/函式,不改既有資料;如需回退可 `drop table match_reports; alter table users drop column suspended_at, ...; drop function ...`(停權資料會一併消失,建議保留)。

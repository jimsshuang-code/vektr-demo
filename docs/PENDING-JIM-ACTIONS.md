# 待 Jim 處理(2026-06-09 更新)

> 技術面我能自主做的都做完並驗證(tsc 全綠)。下面分「你要跑的指令」「我需要你給的值」「你要決策的事」。

## A. 部署這批(推薦歸因 + 後台報表 + 邀請頁 + Sentry)

程式都寫好、`@sentry/nextjs` 也已加入 package.json。Migration 皆為冪等(可重複跑)。
在 Mac 專案根:

```
cd ~/projects/vektr-demo
npm install
export PATH="$(brew --prefix libpq)/bin:$PATH"
export DIRECT_URL=$(grep -E '^DIRECT_URL=' .env.local | sed -E 's/^[^=]+=//; s/^"//; s/"$//')
pg_dump "$DIRECT_URL" -Fc > ~/vektr-backup-$(date +%Y%m%d-%H%M).dump
psql "$DIRECT_URL" -f 007_referral.sql
psql "$DIRECT_URL" -f 008_referral_admin.sql
psql "$DIRECT_URL" -f 009_referral_self.sql
git add -A && git commit -m "feat(growth): 推薦歸因 + 後台/球友報表 + Sentry 接線"
git push && vercel --prod
```

### 驗證
- 球友端:登入後開 `/invites` → 看自己的推薦碼、邀請數、邀來名單。
- 後台:側欄「推薦成長」→ `/admin/referrals` 排行榜。
- 歸因:A 的邀請連結(`/match?ref=<A 的碼>` 或任一 `/match/[id]?ref=`)邀 B,B LINE 登入後 `referred_by` = A。

## B. 正式網域 + 隱私 v1.0(我已套用,剩你的設定)

### 我已完成
- 隱私頁定版 **v1.0**:移除草案橫幅與內部待確認註記,填入統編 24718812、登記地址(新北市汐止區新台五路一段 97 號 14 樓之 12)、官網 https://www.vektr.com.tw、聯絡信箱、年滿 18 歲、生效日 2026-06-10。
- 全站 `NEXT_PUBLIC_SITE_URL` 預設與 `.env.local` 改為 `https://www.vektr.com.tw`。

### ⚠ 你要確認 / 設定
1. **信箱拼字**:你給的是 `service@abouttime-tehc.com`,看似 `tech` 的筆誤;我先填 `service@abouttime-tech.com`(對齊你 v0.2 原稿)。**這是法律頁的對外聯絡信箱,部署前請務必確認正確拼字**(若應為 abouttime.com.tw 網域也請告知,我改)。
2. **網域切換(只能你做)**:
   - Vercel 專案 → Settings → Domains 綁定 `www.vektr.com.tw`(及 `vektr.com.tw` 轉址),並在 DNS(Gandi/遠振)指向 Vercel。
   - Vercel Production 環境變數 `NEXT_PUBLIC_SITE_URL` 設為 `https://www.vektr.com.tw`。
   - LINE Developers 後台 callback 改成 `https://www.vektr.com.tw/api/auth/callback/line`(舊的 vercel.app 可保留並存)。
   - 順序:先綁網域 + DNS 生效,再設 env + 重新部署,避免 OG/sitemap 指向尚未生效的網域。

### B3. Sentry DSN(仍需你給)
程式已接好(未設 DSN 為 no-op)。給我 Sentry 專案的 `NEXT_PUBLIC_SENTRY_DSN`,我放進設定;你在 Vercel 加同名環境變數即可開始收前後端錯誤。

## C. 你要決策 / 你帳號的事(P0,卡正式公測)

1. 法務:隱私 v0.2 + 服務條款最終仍建議律師核「待法務確認」條款(清單見 `docs/legal-review-checklist.md`)。你已決定 v0.2 上線方向。
2. 正式網域 DNS / Vercel 綁定 / LINE callback 設定(見 B1)。

## D. 已知小事(低優先)

- `middleware.ts → proxy.ts`:Next 16 棄用警告(僅警告)。牽涉 admin 登入守衛 + next-auth 對 proxy 支援度未定,建議專門測一次再改。
- `app/components/Header.tsx.bak.*` 兩個備份檔可刪。

## 進度總覽

已上線:A2 檢舉/停權 · A3 並發 · A4 移除 dev 後備 · Sprint2 OG+LINE · 生命週期 cron · SEO。
本批待部署:推薦歸因綁定 · 後台推薦報表 `/admin/referrals` · 球友邀請頁 `/invites` · Sentry 接線(待 DSN)。
待你給值:正式網域、隱私定版事實、Sentry DSN。

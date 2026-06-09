# VEKTR 全站 Go-Live 整備路線圖

> 2026-06-09。目的:把「整站可正式對外上線」拆成可執行的優先序。
> 結論先講:**建議以 COURTS(找球場)+ MATCH(約球)為 MVP 對外上線**,其餘模組維持誠實的「Coming Soon」。市場缺口在「找場 + 揪人」,這兩塊已是真功能。

## 1. 模組成熟度盤點

| 模組 | 狀態 | 說明 |
| --- | --- | --- |
| MATCH 約球 | ✅ 真功能(已上線) | 開房/列表/詳情/加入/退出/評分/檢舉/停權 + OG 分享卡 + LINE 揪人。find/history 仍為 placeholder。 |
| COURTS 球場 | ✅ 真功能 | 列表 + 詳情接 DB/API,後台 courts CRUD。cities/map 仍為 placeholder。 |
| SHOP 商城 | ⛔ Coming Soon | 全部 placeholder,金流未啟用。 |
| COACH 教練 | ⛔ Coming Soon | 全部 placeholder,無預約後端。 |
| LEARN 學習 | ⛔ Coming Soon | 全部 placeholder。 |
| MEMBER 會員中心 | ⛔ Coming Soon | orders/level/friends/coaching 皆 placeholder。 |
| 後台 Admin | ◐ 部分 | courts、約球檢舉/停權為真;其餘 placeholder。 |

登入:球友 LINE 登入已上線;A4 已移除 dev 後備(未登入 → 401)。

## 2. P0 — 對外開放「註冊/登入」前必須完成(launch gate)

1. **法務定版**(A5):隱私政策 v0.2 自載「定版前不得對真實使用者開放註冊」。須律師核定所有「待法務確認」、填妥「待填」事實(統編/地址/網域/窗口/信箱),再移除草案橫幅。服務條款同步核閱。
2. **正式網域 + 品牌名決策**:目前 vektr-demo.vercel.app;上線前確認正式網域與是否沿用 VEKTR(商標檢索中)。網域影響 LINE callback、NEXT_PUBLIC_SITE_URL、OG/sitemap。
3. **未成年/服務對象年齡門檻**:隱私政策 [待填:建議 18],須與註冊流程一致。

## 3. P1 — 上線品質(MVP 範圍內應完成)

1. **球局生命週期自動化**(本批已實作):`006_match_lifecycle.sql` + `/api/cron/close-expired-matches` + `vercel.json` 每 15 分關閉過期房。**待辦:套用 006 到正式 DB、Vercel 設 `CRON_SECRET`。**
2. **未上線模組導覽收斂**:Header/Footer 對 SHOP/COACH/LEARN/MEMBER 的連結,確認都導向 Coming Soon(已是 placeholder),避免使用者撞到半成品;或暫時從主導覽弱化。
3. **SEO / 可被發現**:加 `app/sitemap.ts`、`app/robots.ts`、首頁與 /courts 的 metadata;OG 卡目前只有 match 有。市場缺口大,自然搜尋與分享是低成本獲客。
4. **錯誤監控**:接 Sentry 或 Vercel 內建,至少捕捉 API 500。
5. **基本法遵**:Cookie 若加分析/行銷類,需同意橫幅(隱私政策已標待補)。

## 4. P2 — 成長 / 留存(上線後迭代)

1. **推薦碼歸因綁定**:`?ref=` 已寫入 `vektr_ref` cookie,缺「LINE 首次註冊時把推薦人綁到新用戶」的邏輯(需 users 加 referred_by 欄 + signup 綁定 + 防自我推薦)。
2. **缺人主動推播**:LINE Messaging API OA + token + 好友/userId 綁定(見 `match-sprint2-invite.md §3`)。
3. **match find/history 真功能**、courts map/cities 真功能。
4. **金流啟用 → SHOP 上線**(需第三方支付串接 + 退換貨/消保法遵循)。

## 5. 技術債 / 上線前清理

- `middleware.ts → proxy.ts`(Next 16 deprecation 提醒)。
- 移除 `app/components/Header.tsx.bak.*` 等備份檔。
- sandbox commit 殘留的 `.git/*.lock` 需在 Mac 清除(每次以工具提交後易殘留)。

## 6. 建議上線順序(最短路徑)

1. 法務定版(P0-1)+ 網域決策(P0-2)→ 解除 launch gate。
2. 套用 006 + 設 CRON_SECRET(P1-1)、SEO 基礎(P1-3)、監控(P1-4)。
3. 確認導覽收斂(P1-2)→ 公測上線(MATCH + COURTS)。
4. 上線後依數據迭代 P2(推薦歸因 → 推播 → 其餘模組 → 金流/SHOP)。

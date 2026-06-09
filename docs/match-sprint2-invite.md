# Sprint 2 發酵邀約 — OG 分享卡 + LINE 揪人

> 2026-06-09。分支 feature/match-sprint01。本批已實作「動態 OG 分享卡」與「LINE 揪人(分享)」。
> 「缺人 LINE 主動推播」為 follow-up,需 LINE Messaging API 前置(見 §3)。

## 1. 已實作

### 動態 OG 分享卡
- `app/lib/matchPublic.ts` — `getPublicMatch(id)`(React cache),以 `withUser(null)` 匿名讀球局公開欄位 + joined 計數;附 `playersNeeded` / `formatWhen` / `GAME_LABEL`。
- `app/match/[id]/opengraph-image.tsx` — 1200x630 navy/lime 卡,顯示標題、時間、場地、「還缺 N 人」(滿房顯示已滿、取消顯示已取消)。中文以 Google Fonts Noto Sans TC 子集載入(只取卡片用到的字,體積小);字型載入失敗時以英文標籤 + 大數字優雅降級,永不丟錯。
- `app/match/[id]/layout.tsx` — 每場球 server 端 `generateMetadata`:og:title / description(含缺幾人)/ url + metadataBase + twitter summary_large_image。og:image 由 opengraph-image 自動帶入。

### LINE 揪人(分享)
- `app/match/[id]/page.tsx` — 新增「📲 用 LINE 揪人(還缺 N 人)」綠色按鈕,深連結 `https://line.me/R/msg/text/?<文案>`,文案含標題、缺幾人、時間、場地與帶 `?ref=` 的網址;原分享改為「其他分享方式」(navigator.share / 複製)。

## 2. 驗證

- `npx tsc --noEmit`:原始碼零型別錯誤(app/、lib/ 無錯)。`.next/dev/types` 殘留錯誤為舊 build 生成檔過期,`next build` 會重生。
- 上線後驗證 OG 卡:
  - 直接開 `https://vektr-demo.vercel.app/match/<id>/opengraph-image` 應回傳一張 PNG。
  - 用 https://www.opengraph.xyz/ 或實際貼到 LINE/Slack 貼上 `/match/<id>` 看預覽卡。
  - 中文是否正確顯示(字型子集);若為方框,檢查 Vercel 是否能連 fonts.googleapis.com。
- LINE 按鈕:手機點擊應開 LINE 並帶入文案;桌機開 line.me 分享頁。

## 3. Follow-up:缺人「主動推播」LINE 通知(需前置,未做)

主動推播(房間缺人時自動發 LINE 訊息給目標球友)無法只靠現有設定完成,需要:

1. **LINE Official Account + Messaging API channel**(與現有 LINE Login channel 不同)。取得 channel access token。
2. **好友關係**:Messaging API 只能 push 給「已加入該 OA 為好友」的使用者;且 push 用的 `userId` 來自 Messaging API webhook,與 Login 取得的 `sub` 不必然相同(除非同一 provider 並完成綁定)。需建立 users.line_messaging_id 對應並走加好友流程。
3. **觸發與頻率控管**:定義何時推(開房後 N 分鐘仍缺人 / 開打前 X 小時)、推給誰(同區、DUPR 區間、近期活躍),並做去重與退訂,避免擾民與觸法(個資/通訊)。
4. **額度與成本**:Messaging API 免費推播則數有限,超量計費,需評估。

建議先以「LINE 揪人分享」驗證發酵效果,待 OA 設定到位再做主動推播。

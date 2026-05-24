# VEKTR 平台 - Project Instructions

最後更新:2026-05-24(Stage 2 完成)

---

## 脈絡

- 品牌:VEKTR(暫定,內部討論中可能改名)
- 平台類型:pickleball 平台
- 商業模式:方案 C — 不做金流,只做媒合 + 商城展示
- 域名:vektr.com.tw(HTTPS 正常)
- 部署:AWS EC2(公司既有帳號,t2.micro Demo)
- 擁有人:關於時間科技股份有限公司(Jim 為負責人,VEKTR 為內部創業)

---

## 基礎設施(SP-03 既有)

- AWS EC2 t2.micro @ ap-northeast-1(東京),EIP 54.150.9.35
- Security Group: vektr-demo-sg(SSH 限 My IP / HTTP / HTTPS)
- Stack:Node 20.20.2 / npm 10.8.2 / PM2 7.0.1 / Nginx 1.28 / PostgreSQL 18.4
- DB:vektr_demo / vektr_user(密碼存密碼管理工具)
- SSL:Let's Encrypt(到期 2026-08-21,Certbot 自動續期)

---

## 開發環境

- Mac 裝 nvm + Node 20.20.2(跟 EC2 一致)
- 編輯器:Cursor(已登入 GitHub jimsshuang-code)
- 專案位置:~/projects/vektr-demo
- GitHub repo: github.com/jimsshuang-code/vektr-demo(private)
- SSH key(Mac + EC2)已加到 GitHub
- git remote 已設,雙向 push/pull 通

---

## 技術棧

- Next.js 16.2.6(App Router + Turbopack)
- TypeScript
- Tailwind CSS 4(透過 @import "tailwindcss")
- 字體:Inter(標題、英文)+ Noto Serif TC(中文內文)

---

## VEKTR 視覺規格

- 主色(海軍藍):#1e3a8a
- 亮點色(萊姆綠):#bef264,hover #a3e635
- 深色背景:#0f172a
- 白底:#ffffff,灰底:#f8fafc
- 文字主色:#0f172a,次色:#475569
- 設計參考:DUPR(dupr.com)

---

## Stage 1 已產出(5 個檔案)

- app/globals.css(VEKTR 配色 CSS 變數 + Tailwind 4 主題 + 字體設定)
- app/layout.tsx(Inter + Noto Serif TC 載入、metadata、掛載 Header/Footer)
- app/components/Header.tsx(已升級為含 dropdown + 手機漢堡選單)
- app/components/Footer.tsx(4 區塊連結 + 公司資訊 + 版權)
- app/page.tsx(Hero + 統計 + 6 模組 + 4 角色 + 飛輪 + CTA)

---

## Stage 2 已產出(2026-05-24 完成)

### 共用元件
- app/components/PagePlaceholder.tsx(所有子頁的 Coming Soon 樣板)

### 子頁面骨架(共 41 頁,含首頁)

| 模組 | 頁數 | 路徑 |
|---|---|---|
| 首頁 | 1 | / |
| 商城 | 8 | /shop + 7 子頁(paddles/balls/shoes/apparel/bags/accessories/demo) |
| 球場 | 4 | /courts + map + cities/[city] + detail/[id] |
| 教練 | 4 | /coaches + detail/[id] + booking + apply |
| 約球 | 4 | /match + create + find + history |
| 學習 | 5 | /learn + rules + videos + guide + events |
| 會員 | 5 | /member + orders + level + friends + coaching |
| 管理後台 | 10 | /admin + 9 MVP 模組(members/orders/coaches/courts/products/content/permissions/settings/analytics) |

### 路徑衝突處理
- /courts/cities/[city] + /courts/detail/[id](避免 [id] 跟 [city] 衝突)
- /coaches/detail/[id](跟 courts 保持一致)

### Header 升級
- 桌機:hover dropdown 子選單(商城/教練/約球/學習/會員 有 dropdown,球場無)
- 手機:漢堡選單 + 點箭頭展開子選單
- active state:當前路徑的主選單 highlight

### 後台架構文件
- docs/admin-architecture.md(規格書,約 500 行)
- docs/admin-architecture.html(視覺版規格書)
- 包含:27 模組路線圖、5 層 RBAC 權限、9 個 MVP 模組完整 DB schema + API、金流預留設計、Phase 2-4 路線圖

---

## 部署狀態

- PM2 process: vektr-demo(online,next start production build)
- Nginx:proxy 模式,80/443 → 127.0.0.1:3000
- 對外可訪問:https://vektr.com.tw

---

## 多語言

- Header 有「中/EN」切換按鈕,點下去 alert「English version coming soon」
- 實際多語言之後再做(框架候選:next-intl / paraglide)

---

## 備份檔案

### EC2 上
- /etc/nginx/sites-available/vektr.bak.20260523(proxy 模式備份)
- /etc/nginx/sites-available/vektr.static.20260523(靜態 HTML 模式備份,舊版)

### Mac 上
- app/components/Header.tsx.bak.20260524(Stage 1 Header 原版)
- app/components/Header.tsx.bak.20260524.v2(Stage 2 Header 第一版)

---

## 開發流程(已建立)

1. Mac Cursor 改檔 → 終端機 git add/commit/push
2. EC2 SSH 進去 → cd /home/ubuntu/vektr-demo → git pull
3. EC2 執行 npm run build
4. EC2 執行 pm2 restart vektr-demo
5. 開瀏覽器驗證 https://vektr.com.tw

---

## 未完成 TODO

### 高優先(下次對話建議處理)
- 品牌改名決策(VEKTR 是否改名)
  - VEKTR 商標申請狀態確認(需專業確認)
  - 想換名的真正原因釐清
  - 新名字方向(重新發想 / 既有候選收斂)
- SP 編號重整(原 SP-04 是社群行銷,後端開發需重新編號避免衝突)

### 中優先(這幾週)
- 建立 IAM User 取代 Root 操作
- EC2 加自動備份(AMI snapshot 排程)
- AWS Session Manager 解決 SSH 斷線問題

### 法務/商標(需專業確認)
- VEKTR 商標委託商標代理人正式檢索 + 申請(類別:41/42/9/35)
- 域名擁有人是關於時間科技,內部創業分拆要安排移轉
- 內部創業損益、股權、智財權歸屬找會計師、律師討論

### 後端範圍(SP-04 後端版,需確認編號)
- 後端 API(連 PostgreSQL,依 docs/admin-architecture.md 的 schema)
- DB schema 建立(含金流預留)
- Admin auth + RBAC(5 層)
- MVP 9 模組逐個實作
- 媒合主要功能(DUPR 等級、約球配對演算法)
- 監控(PM2 logs、Nginx access log、磁碟用量)

---

## 環境

- Mac 終端機(zsh),開發機:MacBook Air
- SSH KeepAlive 已設定(~/.ssh/config)
- Mac SSH key:~/.ssh/id_ed25519(GitHub 用)
- Mac SSH key:~/.ssh/vektr-demo-key.pem(EC2 用)
- EC2 SSH key:~/.ssh/id_ed25519(GitHub 用,deploy key)
- GitHub 帳號:jimsshuang-code
- Email:jim@abouttime.com.tw

---

## 特殊狀況註記

- AWS 帳號中還有同事的 search-web EC2 + 18.182.200.163 EIP(abouttime.tw 主站用),不要動
- SSH 容易斷線,每次重連要 curl -4 ifconfig.me 確認 IP,必要時更新 Security Group SSH 來源
- DNS 在 Gandi 但遠振後台同步可管(遠振是 Gandi reseller)
- Stage 1 / Stage 2 既有檔案不要動,要動先看現況
- Mac 用 Cursor 開發,免費版額度(每月慢速補全 200 次、Premium 50 次)

---

## 對話偏好(必讀)

1. **確認再動**:修改前先確認目前狀態,不要假設
2. **不動其他程式**:只修改被要求的部分
3. **指令格式**:SSH 指令用 code block,Mac 終端機指令也要說清楚是在哪裡執行
4. **註解行**(# 開頭)不要混進 code block,避免複製出錯
5. **錯誤處理**:出錯時先診斷原因再修正,不要猜
6. **確認結果**:每次修改後給驗證指令
7. **簡潔指令**、不要過度解釋
8. 涉及法務、商標、財務時主動標註「需專業確認」
9. **不要 emoji**
10. **對外文件絕不揭露供應商與代工型號**
11. **改檔時給「全選刪除後貼上」的完整檔案內容**,不要給 patch / diff
12. **prompt 提示符區分位置**:
    - ubuntu@ip-172-31-39-247:~$ = EC2
    - jim@MacBook-Air xxx % = Mac
13. **一次性建檔**用 mkdir + cat heredoc(EOF)模式,避免分次貼上斷掉

---

## 開新對話時的標準開場

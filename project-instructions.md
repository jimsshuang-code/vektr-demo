
---

## 2026-05-24 更新:Stage 2 完成,後台架構規格產出

### 平台現況
- 品牌:VEKTR(暫定,內部討論中可能改名)
- 方案:C - 不做金流,只做媒合 + 商城展示
- 域名:vektr.com.tw(HTTPS 正常運作)
- 部署:AWS EC2 t2.micro @ ap-northeast-1,EIP 54.150.9.35
- 技術棧:Next.js 16.2.6 + Tailwind 4 + PostgreSQL 18.4
- Stage 1 + Stage 2 完成:41 頁 placeholder + 後台架構文件 v1.0
- 主要文件:docs/admin-architecture.md / .html

### SP 編號需釐清
原 SP-04 在舊規劃為「社群行銷」,2026-05-24 對話中將「後端 API + DB schema」也稱為 SP-04。
**待處理**:重新編號避免衝突,或明確區分 SP-04a / SP-04b。

### 開發工作流程偏好(2026-05-24 對話沉澱)
1. SSH(EC2)與 Mac 終端機指令必須分清楚,prompt 區分位置:
   - ubuntu@ip-172-31-39-247:~$ = EC2
   - jim@MacBook-Air xxx % = Mac
2. 註解行(# 開頭)不要混進 code block,避免複製出錯
3. 改檔給「全選刪除後貼上」的完整檔案,不要 patch/diff
4. 一次性建檔用 mkdir + cat heredoc(EOF)模式
5. 確認再動:修改前先看現況,不要假設
6. 出錯時先診斷原因再修正,不要猜
7. 每次修改後給驗證指令

### 對外文件規則(再次強調)
- 對外文件絕不揭露供應商與代工型號
- 不使用 emoji
- 法務 / 商標 / 財務涉及時主動標註「需專業確認」

### Stage 2 已建立的目錄結構
- app/components/PagePlaceholder.tsx(共用元件)
- app/shop/* (8 頁)
- app/courts/* (4 頁,含 cities/[city] + detail/[id])
- app/coaches/* (4 頁,含 detail/[id])
- app/match/* (4 頁)
- app/learn/* (5 頁)
- app/member/* (5 頁)
- app/admin/* (10 頁:dashboard + 9 MVP 模組)
- docs/admin-architecture.md (規格書,500 行)
- docs/admin-architecture.html (視覺版規格書)

### 下一階段待處理
- 品牌改名決策(VEKTR 是否改名 + 商標申請狀態,需專業確認)
- SP 編號重新整理
- 後端 API 開發(對應 docs/admin-architecture.md 的 schema)
- IAM User 設定 / EC2 自動備份 / Session Manager

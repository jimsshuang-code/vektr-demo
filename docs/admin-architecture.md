# VEKTR 後台架構規格書

**版本**：v1.0
**日期**：2026-05-24
**狀態**：規劃中(SP-04 開發前的架構藍圖)
**作者**：VEKTR 平台團隊

---

## 1. 設計原則

1. **第一階段不做金流**(方案 C),但 DB schema 預留金流相關欄位與 table,未來啟用無需重構
2. **權限分層**:後台所有操作受權限控制,記錄完整 audit log
3. **可擴充性**:模組分階段啟用,Phase 1-4 路線圖明確
4. **資料隔離**:廣告主、教練、會員資料彼此隔離,僅 admin 可跨域查詢
5. **API 一致性**:RESTful 設計,命名空間清楚(`/api/admin/*` 為後台專用)

---

## 2. 模組總覽(27 模組路線圖)

| # | 模組 | 階段 | 優先級 | 對應路徑 |
|---|---|---|---|---|
| 1 | 儀表板 | MVP | P0 | /admin |
| 2 | 會員管理 | MVP | P0 | /admin/members |
| 3 | 教練管理 | MVP | P0 | /admin/coaches |
| 4 | 球場管理 | MVP | P1 | /admin/courts |
| 5 | 商品管理 | MVP | P1 | /admin/products |
| 6 | 內容管理 | MVP | P1 | /admin/content |
| 7 | 訂單管理 | MVP | P0 | /admin/orders |
| 8 | 權限管理 | MVP | P0 | /admin/permissions |
| 9 | 系統設定 | MVP | P1 | /admin/settings |
| 10 | 賽事管理 | Phase 2 | P2 | /admin/events |
| 11 | 課程審核 | Phase 2 | P1 | /admin/lessons |
| 12 | 預約糾紛 | Phase 2 | P2 | /admin/disputes |
| 13 | 評價管控 | Phase 2 | P2 | /admin/reviews |
| 14 | 通知中心 | Phase 2 | P1 | /admin/notifications |
| 15 | 行為分析 | Phase 2 | P2 | /admin/analytics/behavior |
| 16 | 轉換漏斗 | Phase 2 | P2 | /admin/analytics/funnel |
| 17 | 留存分析 | Phase 2 | P2 | /admin/analytics/retention |
| 18 | 優惠券系統 | Phase 2 | P2 | /admin/coupons |
| 19 | 推播管理 | Phase 2 | P2 | /admin/push |
| 20 | 金流交易 | Phase 3 | - | /admin/payments |
| 21 | 分潤結算 | Phase 3 | - | /admin/commissions |
| 22 | 財務報表 | Phase 3 | - | /admin/finance |
| 23 | 金流通路 | Phase 3 | - | /admin/payment-gateways |
| 24 | 廣告版位 | Phase 4 | - | /admin/ad-slots |
| 25 | 廣告主管理 | Phase 4 | - | /admin/advertisers |
| 26 | 廣告投放 | Phase 2 | P2 | /admin/ads |
| 27 | A/B 測試 | Phase 3 | - | /admin/experiments |

---

## 3. 權限分級(5 層 RBAC)

| 角色 | 代號 | 權限範圍 |
|---|---|---|
| 超級管理員 | super_admin | 所有模組讀寫,可建立 admin 帳號、改權限,可看 audit log |
| 一般管理員 | admin | 除權限管理外,所有模組讀寫 |
| 編輯者 | editor | 內容管理、商品管理、CMS 寫入。其他模組唯讀 |
| 教練端 | coach | 僅看自己的課程、預約、學員、評價、分潤 |
| 觀察員 | viewer | 全站唯讀,適合外部審計、投資人 demo |

**操作日誌**:所有寫入操作記錄 `who / when / what / before / after`,保留至少 6 個月。

---

## 4. MVP 9 模組詳細規格

### 4.1 儀表板 Dashboard(/admin)

**功能清單**

- 今日 / 本週 / 本月關鍵指標(DAU、新註冊、媒合成功、課程預約、商品點擊)
- 異常警示(系統錯誤、付款失敗、爭議單、教練申請待審)
- 快速連結到各模組
- 系統健康狀態(API 回應時間、DB 連線、儲存空間)

**權限**:admin 以上可看;coach 只看自己的儀表板(課程、預約、收入)

**API**
- `GET /api/admin/dashboard/metrics` - 取得指標
- `GET /api/admin/dashboard/alerts` - 取得警示
- `GET /api/admin/dashboard/health` - 系統健康

### 4.2 會員管理 Members(/admin/members)

**功能清單**

- 會員列表(搜尋 / 篩選:註冊日期、DUPR 等級、地區、活躍度、會員等級)
- 會員詳情(基本資料、約球紀錄、課程紀錄、訂單紀錄、評價紀錄、操作日誌)
- 帳號狀態變更(啟用 / 停權 / 刪除)
- 客服回覆與註記
- CSV 匯出
- 批次操作(發信、加標籤)

**DB Schema**

```sql
users (
  id              BIGSERIAL PRIMARY KEY,
  email           VARCHAR(255) UNIQUE NOT NULL,
  phone           VARCHAR(20),
  display_name    VARCHAR(100),
  avatar_url      TEXT,
  dupr_rating     DECIMAL(3,2),
  gender          VARCHAR(10),
  birth_year      INT,
  city            VARCHAR(50),
  status          VARCHAR(20) DEFAULT 'active',
  email_verified  BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  last_login_at   TIMESTAMPTZ
);

user_tags (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT REFERENCES users(id),
  tag         VARCHAR(50) NOT NULL,
  created_by  BIGINT REFERENCES admin_users(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);

user_notes (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT REFERENCES users(id),
  admin_id    BIGINT REFERENCES admin_users(id),
  note        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

**API**
- `GET /api/admin/members` - 列表
- `GET /api/admin/members/:id` - 詳情
- `PATCH /api/admin/members/:id` - 更新狀態
- `POST /api/admin/members/:id/notes` - 新增客服註記
- `GET /api/admin/members/export` - CSV 匯出

### 4.3 教練管理 Coaches(/admin/coaches)

**功能清單**

- 教練申請列表(待審核 / 已通過 / 已拒絕)
- 資歷驗證、DUPR 等級、面試紀錄
- 教練資料管理(資歷、收費、可預約時段)
- 教練上下架控制
- 教練評價檢視
- 績效指標(接課率、滿意度、續課率)
- 教練分潤紀錄(連結金流模組)

**DB Schema**

```sql
coaches (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT REFERENCES users(id),
  status          VARCHAR(20) DEFAULT 'pending',
  bio             TEXT,
  specialties     TEXT[],
  certifications  JSONB,
  hourly_rate     INT,
  available_cities VARCHAR(50)[],
  approved_at     TIMESTAMPTZ,
  approved_by     BIGINT REFERENCES admin_users(id),
  rejected_reason TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

coach_schedules (
  id          BIGSERIAL PRIMARY KEY,
  coach_id    BIGINT REFERENCES coaches(id),
  day_of_week INT,
  start_time  TIME,
  end_time    TIME,
  active      BOOLEAN DEFAULT true
);
```

### 4.4 球場管理 Courts(/admin/courts)

**功能清單**

- 球場列表(地區、類型、合作狀態篩選)
- 球場新增 / 編輯(地址、營業時間、收費、照片、設施)
- 預約規則設定(可預約時段、最小預約單位、取消政策)
- 合作條件(獨家 / 一般、分潤比例 - 為金流預留)
- 球場使用熱度數據

**DB Schema**

```sql
courts (
  id              BIGSERIAL PRIMARY KEY,
  name            VARCHAR(200) NOT NULL,
  address         TEXT NOT NULL,
  city            VARCHAR(50),
  district        VARCHAR(50),
  lat             DECIMAL(10,7),
  lng             DECIMAL(10,7),
  type            VARCHAR(20),
  num_courts      INT,
  hourly_rate     INT,
  amenities       JSONB,
  partner_status  VARCHAR(20),
  commission_rate DECIMAL(5,2),
  status          VARCHAR(20) DEFAULT 'active',
  created_at      TIMESTAMPTZ DEFAULT now()
);

court_hours (
  id          BIGSERIAL PRIMARY KEY,
  court_id    BIGINT REFERENCES courts(id),
  day_of_week INT,
  open_time   TIME,
  close_time  TIME
);
```

### 4.5 商品管理 Products(/admin/products)

**功能清單**

- 商品列表(分類:球拍 / 球類 / 鞋類 / 服飾 / 球袋 / 配件)
- 商品新增 / 編輯(規格、照片、敘述、品牌、授權通路連結)
- 上下架管理
- 點擊與導購數據追蹤(預留 affiliate 抽成欄位)

**DB Schema**

```sql
products (
  id              BIGSERIAL PRIMARY KEY,
  category        VARCHAR(50),
  name            VARCHAR(200) NOT NULL,
  brand           VARCHAR(100),
  model           VARCHAR(100),
  description     TEXT,
  specs           JSONB,
  images          TEXT[],
  affiliate_url   TEXT,
  affiliate_rate  DECIMAL(5,2),
  status          VARCHAR(20) DEFAULT 'active',
  created_at      TIMESTAMPTZ DEFAULT now()
);

product_clicks (
  id          BIGSERIAL PRIMARY KEY,
  product_id  BIGINT REFERENCES products(id),
  user_id     BIGINT REFERENCES users(id),
  source      VARCHAR(50),
  clicked_at  TIMESTAMPTZ DEFAULT now()
);
```

### 4.6 內容管理 Content(/admin/content)

**功能清單**

- 首頁 Banner 排程
- 學習中心文章(規則、技巧、賽事)
- 教學影片(YouTube embed 或自架)
- 賽事公告
- 站內公告(系統訊息、活動推播)

**DB Schema**

```sql
articles (
  id          BIGSERIAL PRIMARY KEY,
  category    VARCHAR(50),
  title       VARCHAR(300),
  slug        VARCHAR(300) UNIQUE,
  content     TEXT,
  cover_image TEXT,
  author      VARCHAR(100),
  published   BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);

banners (
  id          BIGSERIAL PRIMARY KEY,
  position    VARCHAR(50),
  image_url   TEXT,
  link_url    TEXT,
  start_at    TIMESTAMPTZ,
  end_at      TIMESTAMPTZ,
  priority    INT DEFAULT 0,
  active      BOOLEAN DEFAULT true
);
```

### 4.7 訂單管理 Orders(/admin/orders)

**功能清單**

- 訂單列表(類型:商品諮詢 / 課程預約 / 球場預約 / 試打申請)
- 訂單狀態追蹤(pending / confirmed / completed / cancelled)
- 爭議單管理
- **第一階段不含金流**,訂單僅為媒合紀錄
- **預留金流串接點**:`payment_id`、`amount`、`paid_at` 等欄位先建,留 NULL

**DB Schema(已預留金流)**

```sql
orders (
  id              BIGSERIAL PRIMARY KEY,
  order_no        VARCHAR(50) UNIQUE,
  user_id         BIGINT REFERENCES users(id),
  type            VARCHAR(30),
  status          VARCHAR(20) DEFAULT 'pending',
  related_id      BIGINT,
  metadata        JSONB,

  -- 預留金流欄位(第一階段全 NULL)
  amount          INT,
  currency        VARCHAR(10) DEFAULT 'TWD',
  payment_id      BIGINT,
  paid_at         TIMESTAMPTZ,

  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

### 4.8 權限管理 Permissions(/admin/permissions)

**功能清單**

- 後台帳號管理(新增 admin 使用者、改密碼、停用)
- 角色管理(5 層預設 + 可自訂)
- 操作日誌(audit log)檢視
- API token 管理

**DB Schema**

```sql
admin_users (
  id              BIGSERIAL PRIMARY KEY,
  email           VARCHAR(255) UNIQUE,
  password_hash   TEXT,
  display_name    VARCHAR(100),
  role            VARCHAR(30),
  status          VARCHAR(20) DEFAULT 'active',
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

audit_logs (
  id          BIGSERIAL PRIMARY KEY,
  admin_id    BIGINT REFERENCES admin_users(id),
  action      VARCHAR(100),
  target_type VARCHAR(50),
  target_id   BIGINT,
  before      JSONB,
  after       JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

### 4.9 系統設定 Settings(/admin/settings)

**功能清單**

- 全域參數(站名、SEO meta、客服 email、客服電話)
- 第三方服務串接設定:
  - GA4 measurement ID
  - Mixpanel / Amplitude token
  - **金流通路設定(預留,Phase 3 啟用):綠界 / 藍新 / Stripe / LINE Pay**
- Email 範本(註冊歡迎、訂單通知)
- 系統公告

**DB Schema**

```sql
settings (
  key         VARCHAR(100) PRIMARY KEY,
  value       JSONB,
  description TEXT,
  updated_by  BIGINT REFERENCES admin_users(id),
  updated_at  TIMESTAMPTZ DEFAULT now()
);
```

---

## 5. 金流預留設計(Phase 3 啟用)

雖然第一階段不做金流,以下 schema 在 SP-04 開發時直接建立,結構先存在但不啟用對外功能。這樣設計避免未來啟用金流時的 schema migration 痛點。

```sql
-- 金流交易主表
payments (
  id              BIGSERIAL PRIMARY KEY,
  order_id        BIGINT REFERENCES orders(id),
  user_id         BIGINT REFERENCES users(id),
  amount          INT NOT NULL,
  currency        VARCHAR(10) DEFAULT 'TWD',
  gateway         VARCHAR(50),
  gateway_txn_id  VARCHAR(200),
  status          VARCHAR(20),
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 分潤結算
commissions (
  id              BIGSERIAL PRIMARY KEY,
  payment_id      BIGINT REFERENCES payments(id),
  payee_type      VARCHAR(20),
  payee_id        BIGINT,
  amount          INT,
  rate            DECIMAL(5,2),
  settled         BOOLEAN DEFAULT false,
  settled_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 退款
refunds (
  id              BIGSERIAL PRIMARY KEY,
  payment_id      BIGINT REFERENCES payments(id),
  amount          INT,
  reason          TEXT,
  status          VARCHAR(20),
  processed_by    BIGINT REFERENCES admin_users(id),
  processed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

**API 命名空間預留**:`/api/admin/payments/*`、`/api/admin/commissions/*`、`/api/admin/refunds/*`

**法務與會計確認**:第三方支付金流串接、發票開立、營業稅、跨境金流(若有)、教練分潤的勞健保與扣繳(需專業確認)

---

## 6. Phase 2-4 模組概要規格

### Phase 2(MVP 之後 3-6 個月)

| 模組 | 路徑 | 主要功能 |
|---|---|---|
| 賽事管理 | /admin/events | 賽事建立、報名審核、賽程表、結果登錄 |
| 課程審核 | /admin/lessons | 教練上架課程審核、課綱檢視 |
| 預約糾紛 | /admin/disputes | 爽約、爭議單處理流程 |
| 評價管控 | /admin/reviews | 不實評價檢舉、刪除惡意評價 |
| 通知中心 | /admin/notifications | EDM、推播、客服訊息範本 |
| 行為分析 | /admin/analytics/behavior | 頁面熱圖、停留時間 |
| 轉換漏斗 | /admin/analytics/funnel | 註冊 → 約球 → 預約 → 購買 |
| 留存分析 | /admin/analytics/retention | DAU / WAU / MAU、cohort retention |
| 優惠券系統 | /admin/coupons | 折扣碼建立、發放、使用追蹤 |
| 推播管理 | /admin/push | App push、LINE 通知、SMS |
| 廣告投放 | /admin/ads | 自己投放 FB/Google Ads 的預算與 ROAS 追蹤 |

### Phase 3(商業化後,搭配金流啟用)

| 模組 | 路徑 | 主要功能 |
|---|---|---|
| 金流交易 | /admin/payments | 交易列表、退款、爭議單 |
| 分潤結算 | /admin/commissions | 教練 / 球場月結報表 |
| 財務報表 | /admin/finance | 月營收、現金流、稅務 |
| 金流通路 | /admin/payment-gateways | 綠界 / 藍新 / Stripe 設定 |
| A/B 測試 | /admin/experiments | 實驗組設定、版本對照 |

### Phase 4(DAU 上萬後考慮)

| 模組 | 路徑 | 主要功能 |
|---|---|---|
| 廣告版位 | /admin/ad-slots | 平台廣告版位管理 |
| 廣告主管理 | /admin/advertisers | 廣告主帳號、合約、計費 |

---

## 7. 開發路線圖建議

| 階段 | 時程 | 主要任務 |
|---|---|---|
| SP-03 Stage 2 | 已完成 | 41 頁 placeholder + 後台架構文件 |
| SP-04 Phase A | 下一階段 | 後端 API 框架、DB schema 建立(含金流預留)、admin/permissions 與 admin auth |
| SP-04 Phase B | 之後 | MVP 9 模組逐步上線(member/order/dashboard 優先) |
| SP-05 | 商業化前 | Phase 2 模組 + 真實金流評估 |
| SP-06 | 商業化後 | Phase 3 金流啟用 + Phase 4 廣告變現評估 |

---

## 8. 需專業確認事項

以下事項涉及法律、會計、稅務、資安專業領域,VEKTR 平台團隊不提供建議,需委託專業人士確認。

- **法務**:第三方支付串接合約、發票開立規範、跨境金流合規
- **會計**:教練分潤的勞務報酬扣繳、營業稅處理
- **稅務**:平台抽成收入認列、發票流向
- **個資**:會員資料保存期、刪除流程、GDPR / 個資法合規
- **商標**:VEKTR 商標申請進度(若改名需重新檢索)
- **資安**:後台滲透測試、API rate limit、密碼策略

---

**文件結束**

如需更新此文件,請建立新版本(`docs/admin-architecture-v1.1.md`),不要直接覆寫舊版,以利歷史比對。

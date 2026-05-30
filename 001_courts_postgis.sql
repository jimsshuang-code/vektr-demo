-- ============================================================
-- VEKTR · 共同前置 migration:courts (PostGIS)
-- 跑法:psql "$DATABASE_URL" -f 001_courts_postgis.sql
-- 這是 A 線(匯入)與 B 線(LBS 端點)唯一的共同相依,只跑一次。
-- ============================================================

CREATE EXTENSION IF NOT EXISTS postgis;

-- ---- courts 主表(依 admin-architecture v1.1 §6.4,加上地理欄位與 google_place_id)----
CREATE TABLE IF NOT EXISTS courts (
  id              BIGSERIAL PRIMARY KEY,
  name            VARCHAR(200) NOT NULL,
  address         TEXT NOT NULL,
  city            VARCHAR(50),
  district        VARCHAR(50),
  lat             DECIMAL(10,7),
  lng             DECIMAL(10,7),

  -- 地理欄位:由 lat/lng 自動生成,App 端永遠不用手動維護
  -- 用 geography(Point,4326) 才能用 ST_DWithin 以「公尺」做半徑搜尋
  geog            geography(Point,4326)
                    GENERATED ALWAYS AS (
                      ST_SetSRID(ST_MakePoint(lng::double precision, lat::double precision), 4326)::geography
                    ) STORED,

  -- 以下 4 欄 + photos 為「BD 補欄」區,Places 匯入不會碰
  type            VARCHAR(20),        -- indoor/outdoor/mixed
  num_courts      INT,
  hourly_rate     INT,
  amenities       JSONB,              -- {parking, shower, locker, shop, food}
  photos          TEXT[],

  phone           VARCHAR(20),        -- 採「courts 直接加 phone 欄」選項(Places 帶回市話)
  rating          DECIMAL(3,2),
  rating_count    INT DEFAULT 0,

  partner_status  VARCHAR(20) DEFAULT 'basic',   -- basic/partner/flagship
  commission_rate DECIMAL(5,2) DEFAULT 0,

  data_source     VARCHAR(30) DEFAULT 'admin',   -- admin/owner/user_submit
  is_verified     BOOLEAN DEFAULT false,         -- 場主認領後轉 true
  google_place_id VARCHAR(255) UNIQUE,           -- upsert 對齊鍵

  status          VARCHAR(20) DEFAULT 'active',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_courts_city         ON courts(city);
CREATE INDEX IF NOT EXISTS idx_courts_geog         ON courts USING GIST(geog);
CREATE INDEX IF NOT EXISTS idx_courts_partner      ON courts(partner_status);
CREATE INDEX IF NOT EXISTS idx_courts_google_place ON courts(google_place_id);

-- ---- court_hours(營業時段,harvest 也會帶回)----
CREATE TABLE IF NOT EXISTS court_hours (
  id          BIGSERIAL PRIMARY KEY,
  court_id    BIGINT REFERENCES courts(id) ON DELETE CASCADE,
  day_of_week INT CHECK (day_of_week BETWEEN 0 AND 6),
  open_time   TIME,
  close_time  TIME
);
CREATE INDEX IF NOT EXISTS idx_court_hours_court ON court_hours(court_id);

-- ============================================================
-- 樣本資料(B 線可立刻用這幾筆開發,不必等 A 線匯入)
-- google_place_id 用 SEED_ 前綴,日後可整批刪除。座標為各縣市概略點位。
-- ============================================================
INSERT INTO courts (name, address, city, district, lat, lng, type, num_courts, hourly_rate, rating, rating_count, data_source, is_verified, google_place_id)
VALUES
  ('樣本-台北信義匹克球場', '台北市信義區', '台北市', '信義區', 25.0330, 121.5654, 'indoor',  4, 400, 4.6, 88, 'admin', false, 'SEED_001'),
  ('樣本-新北板橋匹克球館', '新北市板橋區', '新北市', '板橋區', 25.0118, 121.4628, 'indoor',  6, 350, 4.4, 51, 'admin', false, 'SEED_002'),
  ('樣本-桃園中壢球場',     '桃園市中壢區', '桃園市', '中壢區', 24.9536, 121.2256, 'outdoor', 2, 200, 4.2, 23, 'admin', false, 'SEED_003'),
  ('樣本-台中西屯匹克球場', '台中市西屯區', '台中市', '西屯區', 24.1818, 120.6469, 'mixed',   4, 300, 4.7, 64, 'admin', false, 'SEED_004'),
  ('樣本-台南東區球場',     '台南市東區',   '台南市', '東區',   22.9870, 120.2270, 'outdoor', 3, 250, 4.3, 30, 'admin', false, 'SEED_005'),
  ('樣本-高雄左營匹克球館', '高雄市左營區', '高雄市', '左營區', 22.6890, 120.2960, 'indoor',  5, 380, 4.5, 47, 'admin', false, 'SEED_006')
ON CONFLICT (google_place_id) DO NOTHING;

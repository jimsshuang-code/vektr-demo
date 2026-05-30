#!/usr/bin/env node
/**
 * VEKTR — 全台 pickleball 球場蒐集腳本 v2(地理錨定版)
 * --------------------------------------------------
 * 與 v1 差別:每個縣市帶上「邊界框 locationRestriction」,
 * 強制 Google 只回傳該縣市範圍內的結果。
 *   - 修正 v1 的分布失真(台中漏抓、馬祖/苗栗灌水、跨縣市污染)
 *   - textQuery 只放關鍵字,地理範圍交給 locationRestriction 控制
 *
 * 用法:
 *   export GOOGLE_MAPS_API_KEY="AIza...(真金鑰,別填中文)"
 *   node harvest-courts.mjs
 *
 * 需求:Node 18+
 */

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
if (!API_KEY || /[^\x00-\x7F]/.test(API_KEY)) {
  console.error('❌ GOOGLE_MAPS_API_KEY 未設定或含非 ASCII 字元(別填「你的金鑰」這種佔位字,要填 AIza... 開頭的真金鑰)');
  process.exit(1);
}

const SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';

// 各縣市邊界框(概略):[latLow, lngLow, latHigh, lngHigh]
// 用 locationRestriction 硬性限制搜尋範圍,結果只會落在框內
const COUNTY_BOXES = {
  台北市: [24.96, 121.46, 25.21, 121.67],
  新北市: [24.67, 121.27, 25.30, 122.01],
  基隆市: [25.07, 121.68, 25.20, 121.80],
  桃園市: [24.59, 120.96, 25.12, 121.46],
  新竹市: [24.74, 120.88, 24.85, 121.03],
  新竹縣: [24.50, 120.92, 24.90, 121.43],
  苗栗縣: [24.30, 120.65, 24.75, 121.27],
  台中市: [24.00, 120.43, 24.45, 121.30],
  彰化縣: [23.85, 120.30, 24.16, 120.65],
  南投縣: [23.45, 120.65, 24.20, 121.32],
  雲林縣: [23.50, 120.10, 23.86, 120.70],
  嘉義市: [23.44, 120.40, 23.52, 120.50],
  嘉義縣: [23.20, 120.10, 23.66, 120.85],
  台南市: [22.90, 120.00, 23.45, 120.55],
  高雄市: [22.45, 120.10, 23.47, 121.06],
  屏東縣: [21.90, 120.40, 22.95, 120.90],
  宜蘭縣: [24.30, 121.30, 24.80, 122.00],
  花蓮縣: [23.10, 121.10, 24.37, 121.65],
  台東縣: [22.00, 120.75, 23.30, 121.50],
  澎湖縣: [23.18, 119.30, 23.80, 119.75],
  金門縣: [24.36, 118.24, 24.55, 118.53],
  連江縣: [25.93, 119.91, 26.39, 120.51],
};

const KEYWORDS = ['匹克球', 'pickleball', '匹克球場', '匹克球館'];

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.nationalPhoneNumber',
  'places.regularOpeningHours',
  'places.rating',
  'places.userRatingCount',
  'places.primaryType',
  'places.googleMapsUri',
  'nextPageToken',
].join(',');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function textSearch(query, box, pageToken = null) {
  const [latLow, lngLow, latHigh, lngHigh] = box;
  const body = {
    textQuery: query,
    languageCode: 'zh-TW',
    regionCode: 'TW',
    pageSize: 20,
    locationRestriction: {
      rectangle: {
        low: { latitude: latLow, longitude: lngLow },
        high: { latitude: latHigh, longitude: lngHigh },
      },
    },
  };
  if (pageToken) body.pageToken = pageToken;

  const res = await fetch(SEARCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Places API ${res.status}: ${text}`);
  }
  return res.json();
}

const CITY_NAMES = Object.keys(COUNTY_BOXES);

function parseLocation(address, queryCity) {
  const city = CITY_NAMES.find((c) => address.includes(c)) || queryCity || null;
  let district = null;
  const m = address.match(/(縣|市)([\u4e00-\u9fa5]{1,4}?(區|鄉|鎮|市))/);
  if (m) district = m[2];
  return { city, district };
}

function parseHours(courtTmpId, regularOpeningHours) {
  if (!regularOpeningHours?.periods) return [];
  return regularOpeningHours.periods
    .filter((p) => p.open && p.close)
    .map((p) => ({
      court_tmp_id: courtTmpId,
      day_of_week: p.open.day,
      open_time: `${String(p.open.hour).padStart(2, '0')}:${String(p.open.minute ?? 0).padStart(2, '0')}`,
      close_time: `${String(p.close.hour).padStart(2, '0')}:${String(p.close.minute ?? 0).padStart(2, '0')}`,
    }));
}

function toCourtRow(place, queryCity) {
  const address = place.formattedAddress || '';
  const { city, district } = parseLocation(address, queryCity);
  return {
    google_place_id: place.id,
    name: place.displayName?.text || '(未命名)',
    address,
    city,
    district,
    lat: place.location?.latitude ?? null,
    lng: place.location?.longitude ?? null,
    type: null,
    num_courts: null,
    hourly_rate: null,
    amenities: null,
    rating: place.rating ?? null,
    rating_count: place.userRatingCount ?? 0,
    phone: place.nationalPhoneNumber ?? null,
    google_maps_uri: place.googleMapsUri ?? null,
    primary_type: place.primaryType ?? null,
    data_source: 'admin',
    is_verified: false,
    status: 'active',
  };
}

async function harvest() {
  const byPlaceId = new Map();
  const allHours = [];
  let requestCount = 0;

  for (const [city, box] of Object.entries(COUNTY_BOXES)) {
    for (const kw of KEYWORDS) {
      let pageToken = null;
      let page = 0;

      do {
        page++;
        requestCount++;
        try {
          const data = await textSearch(kw, box, pageToken);
          const places = data.places || [];
          let added = 0;
          for (const p of places) {
            if (!p.id || byPlaceId.has(p.id)) continue;
            byPlaceId.set(p.id, toCourtRow(p, city));
            allHours.push(...parseHours(p.id, p.regularOpeningHours));
            added++;
          }
          pageToken = data.nextPageToken || null;
          process.stdout.write(
            `  [${requestCount}] ${city} "${kw}" (p${page}) -> +${added}/${places.length} | total ${byPlaceId.size}\n`
          );
          if (pageToken) await sleep(1500);
        } catch (err) {
          console.error(`  WARN ${city} "${kw}" (p${page}) failed: ${err.message}`);
          await sleep(2000);
          pageToken = null;
        }
      } while (pageToken && page < 3);

      await sleep(250);
    }
  }

  return { courts: [...byPlaceId.values()], hours: allHours, requestCount };
}

import { writeFileSync } from 'node:fs';

function toCSV(rows) {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  const esc = (v) => {
    if (v === null || v === undefined) return '';
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
}

(async () => {
  console.log('開始蒐集全台 pickleball 球場(v2 地理錨定)...\n');
  const { courts, hours, requestCount } = await harvest();

  writeFileSync('courts_seed.json', JSON.stringify(courts, null, 2), 'utf8');
  writeFileSync('court_hours_seed.json', JSON.stringify(hours, null, 2), 'utf8');
  writeFileSync('courts_seed.csv', toCSV(courts), 'utf8');

  const dist = {};
  for (const c of courts) dist[c.city || '(unknown)'] = (dist[c.city || '(unknown)'] || 0) + 1;
  const sorted = Object.entries(dist).sort((a, b) => b[1] - a[1]);

  console.log('\n------------------------------');
  console.log(`完成:${courts.length} 個球場(去重後) · 時段 ${hours.length} 筆 · 請求 ${requestCount} 次`);
  console.log('縣市分布:');
  for (const [city, n] of sorted) console.log(`  ${city}  ${n}`);
  console.log('輸出:courts_seed.json / courts_seed.csv / court_hours_seed.json');
})();

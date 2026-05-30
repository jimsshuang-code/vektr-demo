#!/usr/bin/env node
/**
 * VEKTR · A 線 — 場地資料匯入 pipeline
 * --------------------------------------------------
 * 讀 harvest-courts.mjs 產出的 courts_seed.json,
 * 以 google_place_id 做 upsert 灌進 courts 表。
 *
 * 關鍵原則:Stage 1(Places)不覆寫 Stage 2(BD 補欄)。
 *   - type / num_courts / hourly_rate / amenities / photos 不在 UPDATE 清單裡 → 重跑不會蓋掉 BD 填的值。
 *   - phone 用 COALESCE(新, 舊) → Places 若回 null 也不抹掉舊電話。
 *
 * 用法:
 *   npm i pg
 *   export DATABASE_URL="postgres://user:pass@host:5432/vektr"
 *   node import-courts.mjs            # 預設讀 ./courts_seed.json
 *   node import-courts.mjs my.json    # 指定檔案
 *
 * 可重複跑,結果一致(idempotent)。
 */

import { readFileSync } from 'node:fs';
import pg from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ 請先設定 DATABASE_URL');
  process.exit(1);
}

const file = process.argv[2] || 'courts_seed.json';
const rows = JSON.parse(readFileSync(file, 'utf8'));

const UPSERT = `
  INSERT INTO courts
    (google_place_id, name, address, city, district, lat, lng, phone,
     rating, rating_count, data_source, is_verified, status)
  VALUES
    ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
  ON CONFLICT (google_place_id) DO UPDATE SET
    name         = EXCLUDED.name,
    address      = EXCLUDED.address,
    city         = EXCLUDED.city,
    district     = EXCLUDED.district,
    lat          = EXCLUDED.lat,
    lng          = EXCLUDED.lng,
    phone        = COALESCE(EXCLUDED.phone, courts.phone),
    rating       = EXCLUDED.rating,
    rating_count = EXCLUDED.rating_count,
    updated_at   = now()
  RETURNING (xmax = 0) AS inserted;  -- xmax=0 代表新插入,否則為更新
`;

const { Pool } = pg;
const pool = new Pool({ connectionString: DATABASE_URL });

(async () => {
  const client = await pool.connect();
  let inserted = 0, updated = 0, skipped = 0;
  try {
    console.log(`🏓 匯入 ${rows.length} 筆(來源:${file})...\n`);
    for (const r of rows) {
      if (!r.google_place_id) {
        skipped++;
        continue; // 沒有對齊鍵就跳過,避免重複建檔
      }
      const res = await client.query(UPSERT, [
        r.google_place_id,
        r.name || '(未命名)',
        r.address || '',
        r.city ?? null,
        r.district ?? null,
        r.lat ?? null,
        r.lng ?? null,
        r.phone ?? null,
        r.rating ?? null,
        r.rating_count ?? 0,
        r.data_source || 'admin',
        r.is_verified ?? false,
        r.status || 'active',
      ]);
      res.rows[0]?.inserted ? inserted++ : updated++;
    }
    console.log('──────────────────────────────');
    console.log(`✅ 完成:新增 ${inserted} · 更新 ${updated} · 跳過 ${skipped}(無 place_id)`);
    console.log('   注意:type / num_courts / hourly_rate / amenities / photos 維持原值(BD 補欄區未被覆寫)。');
  } catch (err) {
    console.error('❌ 匯入失敗:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
})();

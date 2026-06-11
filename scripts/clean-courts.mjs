#!/usr/bin/env node
/**
 * VEKTR 球場資料清理腳本
 * --------------------------------------------------------------------------
 * 功能:
 *   1) 完整度報告:總數、狀態分布、缺收費/照片/營業時間/座標 的數量。
 *   2) 重複偵測:依 google_place_id、以及正規化 name+city 找出重複群組。
 *   3) 去重(需 --apply):每組保留「最完整」那筆,刪除其餘(交易內執行)。
 *
 * 安全:
 *   - 預設為 DRY-RUN(只報告、不寫入)。
 *   - 真的要刪除請加 --apply,且務必先備份:
 *       pg_dump "$DIRECT_URL" -Fc > ~/vektr-backup-$(date +%Y%m%d-%H%M).dump
 *
 * 用法(專案根):
 *   export DIRECT_URL=$(grep -E '^DIRECT_URL=' .env.local | sed -E 's/^[^=]+=//; s/^"//; s/"$//')
 *   node scripts/clean-courts.mjs            # 只報告
 *   node scripts/clean-courts.mjs --apply    # 報告 + 去重(請先備份)
 *
 * 註:收費(hourly_rate)無法從 Google 自動補(Google 不提供場租價);
 *     照片與營業時間可後續用 Place Details 補,屬另一個 enrich 步驟。
 */
import pg from "pg";

const CONN = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!CONN) {
  console.error("缺少 DIRECT_URL / DATABASE_URL");
  process.exit(2);
}
const APPLY = process.argv.includes("--apply");
const pool = new pg.Pool({ connectionString: CONN, max: 4 });

const norm = (s) => (s ?? "").toString().toLowerCase().replace(/\s+/g, "").replace(/[()（）·,，.。]/g, "");

// 「完整度分數」:欄位越齊全分數越高,去重時保留分數最高者
function completeness(c, hasHours) {
  let n = 0;
  if (c.lat != null && c.lng != null) n += 2;
  if (c.hourly_rate != null) n += 1;
  if (Array.isArray(c.photos) && c.photos.length > 0) n += 2;
  if (c.phone) n += 1;
  if (c.rating != null) n += 1;
  if (c.is_verified) n += 3;
  if (hasHours) n += 1;
  if (c.address) n += 1;
  return n;
}

async function main() {
  const { rows: courts } = await pool.query(
    `SELECT id, name, address, city, district, lat, lng, type, hourly_rate, photos,
            phone, rating, is_verified, google_place_id, status
       FROM courts ORDER BY id`
  );
  const { rows: hoursRows } = await pool.query(`SELECT DISTINCT court_id FROM court_hours`);
  const hasHours = new Set(hoursRows.map((r) => String(r.court_id)));

  // ---- 1) 完整度報告 ----
  const total = courts.length;
  const byStatus = {};
  let missRate = 0, missPhoto = 0, missHours = 0, missGeo = 0;
  for (const c of courts) {
    byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;
    if (c.hourly_rate == null) missRate++;
    if (!Array.isArray(c.photos) || c.photos.length === 0) missPhoto++;
    if (!hasHours.has(String(c.id))) missHours++;
    if (c.lat == null || c.lng == null) missGeo++;
  }

  console.log("===== 球場完整度報告 =====");
  console.log("總數:", total);
  console.log("狀態分布:", byStatus);
  console.log(`缺收費(hourly_rate):${missRate}（${pct(missRate, total)}）`);
  console.log(`缺照片(photos):    ${missPhoto}（${pct(missPhoto, total)}）`);
  console.log(`缺營業時間(hours):  ${missHours}（${pct(missHours, total)}）`);
  console.log(`缺座標(lat/lng):    ${missGeo}（${pct(missGeo, total)}）`);

  // ---- 2) 重複偵測 ----
  const groups = new Map(); // key -> [court,...]
  for (const c of courts) {
    const key = c.google_place_id
      ? `pid:${c.google_place_id}`
      : `nc:${norm(c.name)}|${norm(c.city)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(c);
  }
  const dupGroups = [...groups.values()].filter((g) => g.length > 1);
  const dupCount = dupGroups.reduce((s, g) => s + (g.length - 1), 0);

  console.log("\n===== 重複偵測 =====");
  console.log("重複群組數:", dupGroups.length, "| 可刪除的重複筆數:", dupCount);
  for (const g of dupGroups.slice(0, 20)) {
    const sorted = [...g].sort((a, b) => completeness(b, hasHours.has(String(b.id))) - completeness(a, hasHours.has(String(a.id))) || a.id - b.id);
    const keep = sorted[0];
    console.log(`  · 「${keep.name}」(${keep.city ?? "?"}) 共 ${g.length} 筆 → 保留 id=${keep.id},刪 ${sorted.slice(1).map((x) => x.id).join(",")}`);
  }
  if (dupGroups.length > 20) console.log(`  …(其餘 ${dupGroups.length - 20} 組略)`);

  // ---- 3) 去重(需 --apply)----
  if (!APPLY) {
    console.log("\n[DRY-RUN] 未加 --apply,不做任何寫入。確認上面結果無誤、且已備份後,再加 --apply 執行去重。");
  } else {
    let deleted = 0;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const g of dupGroups) {
        const sorted = [...g].sort((a, b) => completeness(b, hasHours.has(String(b.id))) - completeness(a, hasHours.has(String(a.id))) || a.id - b.id);
        const removeIds = sorted.slice(1).map((x) => x.id);
        for (const rid of removeIds) {
          await client.query("DELETE FROM court_hours WHERE court_id = $1", [rid]);
          await client.query("DELETE FROM courts WHERE id = $1", [rid]);
          deleted++;
        }
      }
      await client.query("COMMIT");
      console.log(`\n[APPLY] 已刪除 ${deleted} 筆重複球場。`);
    } catch (e) {
      await client.query("ROLLBACK");
      console.error("去重失敗,已 ROLLBACK:", e);
    } finally {
      client.release();
    }
  }

  await pool.end();
  console.log("\n完成。");
}

function pct(n, total) {
  return total ? `${((n / total) * 100).toFixed(0)}%` : "0%";
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

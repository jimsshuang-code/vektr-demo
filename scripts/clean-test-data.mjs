#!/usr/bin/env node
/**
 * VEKTR 測試資料清除腳本
 * --------------------------------------------------------------------------
 * 清除測試期間建立的資料:
 *   - 教練 coaches:name 含「測試 / test」者,連同其 coach_bookings。
 *   - 球局 match_rooms:title 含「測試 / test / A3TEST_」者,連同 match_participants。
 *   - 殘留的 A3TEST_ 測試球友(users.name LIKE 'A3TEST_%')。
 *
 * 安全:預設 DRY-RUN(只列出將被刪的資料,不寫入)。確認後加 --apply 才刪除。
 *   真的刪之前請先備份:
 *     pg_dump "$DIRECT_URL" -Fc > ~/vektr-backup-$(date +%Y%m%d-%H%M).dump
 *
 * 用法(專案根):
 *   export DIRECT_URL=$(grep -E '^DIRECT_URL=' .env.local | sed -E 's/^[^=]+=//; s/^"//; s/"$//')
 *   node scripts/clean-test-data.mjs           # 只列出
 *   node scripts/clean-test-data.mjs --apply   # 真的刪除(先備份)
 */
import pg from "pg";

const CONN = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!CONN) { console.error("缺少 DIRECT_URL / DATABASE_URL"); process.exit(2); }
const APPLY = process.argv.includes("--apply");
const pool = new pg.Pool({ connectionString: CONN, max: 4 });

const COACH_LIKE = "(name ILIKE '%測試%' OR name ILIKE '%test%')";
const ROOM_LIKE = "(title ILIKE '%測試%' OR title ILIKE '%test%' OR title LIKE 'A3TEST_%')";

async function main() {
  // 預覽要刪的資料
  const coaches = (await pool.query(`SELECT id, name, city, status FROM coaches WHERE ${COACH_LIKE} ORDER BY id`)).rows;
  const rooms = (await pool.query(`SELECT id, title, status, scheduled_at FROM match_rooms WHERE ${ROOM_LIKE} ORDER BY id`)).rows;
  const a3users = (await pool.query(`SELECT id, name FROM users WHERE name LIKE 'A3TEST_%' ORDER BY id`)).rows;

  console.log("===== 將被清除的測試資料(預覽)=====");
  console.log(`測試教練 coaches:${coaches.length}`);
  coaches.forEach((c) => console.log(`  · #${c.id} ${c.name}(${c.city ?? "?"}, ${c.status})`));
  console.log(`測試球局 match_rooms:${rooms.length}`);
  rooms.forEach((r) => console.log(`  · #${r.id} ${r.title}(${r.status})`));
  console.log(`A3TEST_ 殘留球友 users:${a3users.length}`);
  a3users.forEach((u) => console.log(`  · #${u.id} ${u.name}`));

  if (!APPLY) {
    console.log("\n[DRY-RUN] 未加 --apply,不刪除。確認上面清單無誤、已備份後,再加 --apply。");
    await pool.end();
    return;
  }

  const client = await pool.connect();
  let n = 0;
  try {
    await client.query("BEGIN");
    // 教練(先刪預約,FK 有 ON DELETE CASCADE 也安全,這裡顯式刪)
    for (const c of coaches) {
      await client.query("DELETE FROM coach_bookings WHERE coach_id = $1", [c.id]);
      await client.query("DELETE FROM coaches WHERE id = $1", [c.id]);
      n++;
    }
    // 球局(先刪參加者,再刪房)
    for (const r of rooms) {
      await client.query("DELETE FROM match_participants WHERE match_id = $1", [r.id]);
      await client.query("DELETE FROM match_reports WHERE match_id = $1", [r.id]).catch(() => {});
      await client.query("DELETE FROM match_rooms WHERE id = $1", [r.id]);
      n++;
    }
    // A3TEST_ 球友
    for (const u of a3users) {
      await client.query("DELETE FROM match_participants WHERE user_id = $1", [u.id]).catch(() => {});
      await client.query("DELETE FROM users WHERE id = $1", [u.id]);
      n++;
    }
    await client.query("COMMIT");
    console.log(`\n[APPLY] 已清除 ${n} 筆測試資料。`);
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("清除失敗,已 ROLLBACK:", e);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

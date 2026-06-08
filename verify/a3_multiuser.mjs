// ============================================================================
// verify/a3_multiuser.mjs  --  A3 多帳號實測(join/leave/滿房/並發/評分/停權)
// ----------------------------------------------------------------------------
// 對「真實 Supabase DB」跑。直接以 pg 多連線重現 app 的 withUser + 路由 SQL,
// 用「真並發」驗證 pg_advisory_xact_lock 序列化與滿房上限。
// 全程使用 A3TEST_ 標記的拋棄式資料,結束自動清除(finally)。
//
// 用法(Mac terminal,專案根):
//   node verify/a3_multiuser.mjs
// 連線優先序: A3_DATABASE_URL > DIRECT_URL > DATABASE_URL
//   建議用 DIRECT_URL(5432, session 連線)跑並發測試最穩。
//
// 安全: 只新增/刪除自己建立的 A3TEST_ 資料;不碰既有 users/球局。
// ============================================================================

import pg from "pg";

const CONN =
  process.env.A3_DATABASE_URL || process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!CONN) {
  console.error("缺少連線字串。請設定 DIRECT_URL 或 DATABASE_URL。");
  process.exit(2);
}

const MARK = "A3TEST_";
const pool = new pg.Pool({ connectionString: CONN, max: 16 });

let pass = 0,
  fail = 0;
const ok = (c, m) => {
  if (c) {
    pass++;
    console.log("PASS", m);
  } else {
    fail++;
    console.log("FAIL", m);
  }
};

// app/lib/matchDb.ts withUser 的等價實作(各自獨立連線 -> 可真並發)
async function withUser(userId, fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.current_user_id', $1, true)", [
      userId == null ? "" : String(userId),
    ]);
    const r = await fn(client);
    await client.query("COMMIT");
    return r;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

// ---- 路由 SQL 的等價封裝(與 app/api/v1/matches/.../route.ts 對齊) -------------
async function joinMatch(userId, matchId) {
  return withUser(userId, async (c) => {
    await c.query("SELECT pg_advisory_xact_lock($1)", [matchId]);
    const m = await c.query("SELECT id, status, max_players FROM match_rooms WHERE id=$1", [matchId]);
    if (m.rowCount === 0) return { code: 404 };
    const room = m.rows[0];
    if (room.status !== "open") return { code: 409, reason: "not_open" };
    const cnt = await c.query(
      "SELECT count(*)::int AS n FROM match_participants WHERE match_id=$1 AND status='joined'",
      [matchId]
    );
    if (cnt.rows[0].n >= room.max_players) return { code: 409, reason: "full" };
    const exist = await c.query(
      "SELECT id, status FROM match_participants WHERE match_id=$1 AND user_id=$2",
      [matchId, userId]
    );
    if (exist.rowCount && exist.rows[0].status === "joined") return { code: 409, reason: "already" };
    if (exist.rowCount) {
      await c.query(
        "UPDATE match_participants SET status='joined', left_at=NULL, joined_at=now() WHERE id=$1",
        [exist.rows[0].id]
      );
    } else {
      await c.query("INSERT INTO match_participants (match_id, user_id) VALUES ($1,$2)", [matchId, userId]);
    }
    return { code: 200 };
  });
}

async function leaveMatch(userId, matchId) {
  return withUser(userId, async (c) => {
    await c.query("SELECT pg_advisory_xact_lock($1)", [matchId]);
    const m = await c.query("SELECT id, host_id, status FROM match_rooms WHERE id=$1", [matchId]);
    if (m.rowCount === 0) return { code: 404 };
    const room = m.rows[0];
    if (Number(room.host_id) === Number(userId)) {
      if (room.status === "cancelled") return { code: 409, reason: "already_cancelled" };
      await c.query("UPDATE match_rooms SET status='cancelled' WHERE id=$1", [matchId]);
      return { code: 200, cancelled: true };
    }
    const p = await c.query(
      "SELECT id, status FROM match_participants WHERE match_id=$1 AND user_id=$2",
      [matchId, userId]
    );
    if (p.rowCount === 0 || p.rows[0].status !== "joined") return { code: 409, reason: "not_in" };
    await c.query("UPDATE match_participants SET status='left', left_at=now() WHERE id=$1", [p.rows[0].id]);
    return { code: 200 };
  });
}

async function rateMatch(userId, matchId, rating) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { code: 400, reason: "bad_rating" };
  return withUser(userId, async (c) => {
    const m = await c.query("SELECT scheduled_at, duration_min, status FROM match_rooms WHERE id=$1", [matchId]);
    if (m.rowCount === 0) return { code: 404 };
    const room = m.rows[0];
    const ended = new Date(room.scheduled_at).getTime() + room.duration_min * 60000 < Date.now();
    if (!(ended || room.status === "completed")) return { code: 409, reason: "not_ended" };
    const p = await c.query(
      "SELECT id FROM match_participants WHERE match_id=$1 AND user_id=$2 AND status='joined'",
      [matchId, userId]
    );
    if (p.rowCount === 0) return { code: 403, reason: "not_participant" };
    await c.query("UPDATE match_participants SET rating=$2 WHERE id=$1", [p.rows[0].id, rating]);
    return { code: 200 };
  });
}

async function joinedCount(matchId) {
  const r = await pool.query(
    "SELECT count(*)::int AS n FROM match_participants WHERE match_id=$1 AND status='joined'",
    [matchId]
  );
  return r.rows[0].n;
}

// ---- 測試資料建置 / 清除 ------------------------------------------------------
async function createUser(n) {
  const r = await pool.query(
    `INSERT INTO users (name, role, line_user_id, referral_code)
     VALUES ($1, 'user', $2, $3) RETURNING id`,
    [`${MARK}player${n}`, `${MARK.toLowerCase()}line_${n}_${Date.now()}`, `${MARK}REF${n}${Date.now() % 100000}`]
  );
  return Number(r.rows[0].id);
}

async function createRoom(hostId, maxPlayers, { past = false } = {}) {
  const when = past ? "now() - interval '3 hours'" : "now() + interval '2 days'";
  const r = await pool.query(
    `INSERT INTO match_rooms
       (host_id, court_id, title, scheduled_at, duration_min, max_players, game_type, share_code, current_players, status)
     VALUES ($1, NULL, $2, ${when}, 90, $3, 'doubles', $4, 1, 'open')
     RETURNING id`,
    [hostId, `${MARK}room`, maxPlayers, `${MARK}${Math.random().toString(36).slice(2, 9).toUpperCase()}`]
  );
  const matchId = Number(r.rows[0].id);
  // create 路由會把房主自動加入名單
  await pool.query("INSERT INTO match_participants (match_id, user_id) VALUES ($1,$2)", [matchId, hostId]);
  return matchId;
}

async function cleanup() {
  // 先刪 participants(FK),再房間,再 users。全靠 A3TEST_ 標記。
  await pool.query(
    `DELETE FROM match_participants
      WHERE match_id IN (SELECT id FROM match_rooms WHERE title = $1)
         OR user_id IN (SELECT id FROM users WHERE name LIKE $2)`,
    [`${MARK}room`, `${MARK}%`]
  );
  await pool.query(`DELETE FROM match_reports WHERE reporter_id IN (SELECT id FROM users WHERE name LIKE $1)
                    OR reported_user_id IN (SELECT id FROM users WHERE name LIKE $1)`, [`${MARK}%`]).catch(() => {});
  await pool.query(`DELETE FROM match_rooms WHERE title = $1`, [`${MARK}room`]);
  await pool.query(`DELETE FROM users WHERE name LIKE $1`, [`${MARK}%`]);
}

// ---- 場景 --------------------------------------------------------------------
async function main() {
  await cleanup(); // 清掉上次殘留

  // 建 1 房主 + 9 球友
  const host = await createUser("host");
  const players = [];
  for (let i = 0; i < 9; i++) players.push(await createUser(i));

  // 場景 1: 並發開搶滿房 (max=4, 房主已佔 1 -> 剩 3 名額, 9 人同時搶)
  const room = await createRoom(host, 4);
  ok((await joinedCount(room)) === 1, "建房後房主自動入列 (count=1)");

  const results = await Promise.all(players.map((u) => joinMatch(u, room).catch((e) => ({ code: 500, err: String(e) }))));
  const joined200 = results.filter((r) => r.code === 200).length;
  const fulls = results.filter((r) => r.code === 409 && r.reason === "full").length;
  const finalN = await joinedCount(room);
  ok(finalN === 4, `並發後 joined 恰為 max_players=4 (實得 ${finalN})`);
  ok(joined200 === 3, `恰 3 人搶到名額 (實得 ${joined200})`);
  ok(fulls === 6, `其餘 6 人收到滿房 (實得 ${fulls})`);

  // 場景 2: 一名已加入者退出 -> 釋出名額 -> 等候者可入
  const winners = players.filter((_, i) => results[i].code === 200);
  const losers = players.filter((_, i) => results[i].code === 409 && results[i].reason === "full");
  await leaveMatch(winners[0], room);
  ok((await joinedCount(room)) === 3, "一人退出後 count=3");
  const rejoinNew = await joinMatch(losers[0], room);
  ok(rejoinNew.code === 200 && (await joinedCount(room)) === 4, "釋出名額後等候者成功補入 (count=4)");

  // 場景 3: 重複加入被擋(join 先檢查滿房, 故 already 分支需在「未滿房」時驗)
  const dedupRoom = await createRoom(host, 3); // 房主佔 1, max 3 -> 尚有名額
  await joinMatch(players[1], dedupRoom); // count 2
  const dup = await joinMatch(players[1], dedupRoom);
  ok(dup.code === 409 && dup.reason === "already", "重複加入被擋 (already, 未滿房時)");

  // 場景 4: 退出者可重新加入(re-activate)
  await leaveMatch(players[1], dedupRoom);
  const rejoinSelf = await joinMatch(players[1], dedupRoom);
  ok(rejoinSelf.code === 200, "退出者可重新加入 (re-activate)");

  // 場景 5: 滿房時再搶仍被擋(原 room 已滿)
  const blocked = await joinMatch(losers[1], room);
  ok(blocked.code === 409 && blocked.reason === "full", "滿房狀態再加入被擋 (full)");

  // 場景 6: 房主退出 = 取消整場
  const cancel = await leaveMatch(host, room);
  ok(cancel.code === 200 && cancel.cancelled === true, "房主退出 -> 取消整場");
  const joinCancelled = await joinMatch(losers[1], room);
  ok(joinCancelled.code === 409 && joinCancelled.reason === "not_open", "已取消球局無法再加入 (not_open)");

  // 場景 7: 評分 — 未結束不能評
  const room2 = await createRoom(host, 4);
  await joinMatch(players[0], room2);
  const early = await rateMatch(players[0], room2, 5);
  ok(early.code === 409 && early.reason === "not_ended", "未結束的球局不可評分");

  // 場景 8: 已結束可評分 (1-5);非參加者 / 越界分數被擋
  const ended = await createRoom(host, 4, { past: true });
  await joinMatch(players[0], ended);
  const good = await rateMatch(players[0], ended, 4);
  ok(good.code === 200, "已結束球局 -> 參加者可評分 (4)");
  const bad = await rateMatch(players[0], ended, 6);
  ok(bad.code === 400, "越界評分 (6) 被擋");
  const notIn = await rateMatch(players[2], ended, 3);
  ok(notIn.code === 403, "非參加者不可評分");

  // 場景 9: 停權整合 (A2 交叉驗證) — 停權後 user_is_suspended 為真
  const admin = await pool.query(
    "SELECT id FROM admin_users WHERE status='active' AND role IN ('super_admin','admin') ORDER BY id LIMIT 1"
  );
  if (admin.rowCount) {
    const adminId = Number(admin.rows[0].id);
    await pool.query("SELECT admin_suspend_user($1,$2,$3,$4)", [adminId, players[0], "A3 測試停權", null]);
    const s = await pool.query("SELECT user_is_suspended($1) AS s", [players[0]]);
    ok(s.rows[0].s === true, "admin_suspend_user -> user_is_suspended=true");
    await pool.query("SELECT admin_unsuspend_user($1,$2)", [adminId, players[0]]);
    const s2 = await pool.query("SELECT user_is_suspended($1) AS s", [players[0]]);
    ok(s2.rows[0].s === false, "admin_unsuspend_user -> user_is_suspended=false");
  } else {
    console.log("SKIP 停權整合(找不到 active admin_users)");
  }
}

(async () => {
  try {
    await main();
  } catch (e) {
    fail++;
    console.error("FAIL 例外:", e);
  } finally {
    try {
      await cleanup();
      console.log("已清除 A3TEST_ 測試資料");
    } catch (e) {
      console.error("清除失敗(請手動檢查 A3TEST_ 殘留):", String(e));
    }
    await pool.end();
    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
  }
})();

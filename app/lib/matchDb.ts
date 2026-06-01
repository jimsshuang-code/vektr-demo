// app/lib/matchDb.ts
// 約球專用的 RLS 交易 helper。沿用你既有的 app/lib/db.ts 的 pool。
// 原理:在交易內 set_config('app.current_user_id', …, true),讓 Postgres RLS 生效。
// 公開查詢(瀏覽 open 房)可傳 userId=null。

import { pool } from "@/app/lib/db";
import type { PoolClient } from "pg";

export async function withUser<T>(
  userId: number | null,
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.current_user_id', $1, true)", [
      userId == null ? "" : String(userId),
    ]);
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

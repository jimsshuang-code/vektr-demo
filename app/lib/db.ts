import { Pool } from 'pg';

// Next dev 會熱重載模組,用 global 快取避免重複建立連線池
const g = globalThis as unknown as { _pgPool?: Pool };

export const pool =
  g._pgPool ?? new Pool({ connectionString: process.env.DATABASE_URL });

if (process.env.NODE_ENV !== 'production') g._pgPool = pool;

/** 便利包裝:pool.query 的直接呼叫,供 SHOP 等模組使用 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function query(text: string, params?: unknown[]): Promise<{ rows: any[] }> {
  return pool.query(text, params as unknown[]);
}

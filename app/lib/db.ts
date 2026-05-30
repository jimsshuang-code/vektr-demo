import { Pool } from 'pg';

// Next dev 會熱重載模組,用 global 快取避免重複建立連線池
const g = globalThis as unknown as { _pgPool?: Pool };

export const pool =
  g._pgPool ?? new Pool({ connectionString: process.env.DATABASE_URL });

if (process.env.NODE_ENV !== 'production') g._pgPool = pool;

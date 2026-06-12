// 用專案內建的 pg 套件執行一支 .sql migration,免安裝 psql。
// 連線字串優先用 DIRECT_URL(直連,適合 DDL),否則 DATABASE_URL。
// 用法:node scripts/run-migration.mjs 017_email_google_auth.sql
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

// 載入 .env.local(簡易解析,不覆蓋已存在的環境變數)
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      let v = m[2].trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      )
        v = v.slice(1, -1);
      process.env[m[1]] = v;
    }
  }
}

const file = process.argv[2];
if (!file) {
  console.error("用法: node scripts/run-migration.mjs <檔名.sql>");
  process.exit(1);
}
const sqlPath = path.resolve(process.cwd(), file);
if (!fs.existsSync(sqlPath)) {
  console.error("找不到檔案:", sqlPath);
  process.exit(1);
}
const sql = fs.readFileSync(sqlPath, "utf8");
const conn = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!conn) {
  console.error("找不到 DIRECT_URL / DATABASE_URL,請確認 .env.local");
  process.exit(1);
}

const client = new pg.Client({ connectionString: conn });
try {
  await client.connect();
  await client.query(sql);
  console.log("✔ 已套用 migration:", file);
} catch (e) {
  console.error("✘ 失敗:", e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}

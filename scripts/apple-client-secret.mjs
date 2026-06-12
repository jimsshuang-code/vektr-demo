#!/usr/bin/env node
/**
 * 產生 Sign in with Apple 的 client secret(ES256 JWT)。零依賴,用 Node 內建 crypto。
 * --------------------------------------------------------------------------
 * 需要四樣東西(都來自 Apple Developer):
 *   - Team ID:     Apple Developer 右上角 / Membership 頁
 *   - Key ID:      建立 Sign in with Apple 金鑰時給的 10 碼
 *   - Service ID:  你建立的「服務識別碼」(就是 AUTH_APPLE_ID,例 tw.com.vektr.signin)
 *   - .p8 金鑰檔:  建立金鑰時下載的 AuthKey_XXXXXXXXXX.p8
 *
 * 用法(專案根;把值換成你的,.p8 路徑放最後):
 *   APPLE_TEAM_ID=ABCDE12345 \
 *   APPLE_KEY_ID=KEY1234567 \
 *   APPLE_SERVICE_ID=tw.com.vektr.signin \
 *   node scripts/apple-client-secret.mjs ~/Downloads/AuthKey_KEY1234567.p8
 *
 * 輸出:一長串 JWT,貼到 Vercel 環境變數 AUTH_APPLE_SECRET。
 * 注意:Apple 規定 client secret 最長 6 個月,本腳本設 180 天;到期前要重跑一次更新。
 */
import crypto from "node:crypto";
import { readFileSync } from "node:fs";

const TEAM_ID = process.env.APPLE_TEAM_ID;
const KEY_ID = process.env.APPLE_KEY_ID;
const SERVICE_ID = process.env.APPLE_SERVICE_ID; // = client_id = AUTH_APPLE_ID
const P8_PATH = process.argv[2];

if (!TEAM_ID || !KEY_ID || !SERVICE_ID || !P8_PATH) {
  console.error(
    "缺少參數。需要:\n" +
      "  APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_SERVICE_ID 環境變數 + .p8 路徑(argv)\n" +
      "範例:\n" +
      "  APPLE_TEAM_ID=ABCDE12345 APPLE_KEY_ID=KEY1234567 APPLE_SERVICE_ID=tw.com.vektr.signin \\\n" +
      "    node scripts/apple-client-secret.mjs ~/Downloads/AuthKey_KEY1234567.p8"
  );
  process.exit(2);
}

const b64url = (buf) =>
  Buffer.from(buf).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

const now = Math.floor(Date.now() / 1000);
const exp = now + 180 * 24 * 60 * 60; // 180 天(Apple 上限 6 個月)

const header = { alg: "ES256", kid: KEY_ID, typ: "JWT" };
const payload = {
  iss: TEAM_ID,
  iat: now,
  exp,
  aud: "https://appleid.apple.com",
  sub: SERVICE_ID,
};

const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;

let privateKey;
try {
  privateKey = readFileSync(P8_PATH, "utf8");
} catch (e) {
  console.error("讀不到 .p8 檔:", P8_PATH, "\n", String(e));
  process.exit(1);
}

// ES256:用 ieee-p1363 讓簽章直接是 JOSE 需要的 raw R||S(64 bytes),不是 DER
const signature = crypto.sign("sha256", Buffer.from(signingInput), {
  key: privateKey,
  dsaEncoding: "ieee-p1363",
});

const jwt = `${signingInput}.${b64url(signature)}`;

console.log("\n=== AUTH_APPLE_SECRET(貼到 Vercel,有效到 " + new Date(exp * 1000).toLocaleDateString("zh-TW") + ")===\n");
console.log(jwt);
console.log("\n(同時設 AUTH_APPLE_ID=" + SERVICE_ID + " 與 NEXT_PUBLIC_APPLE_ENABLED=1)\n");

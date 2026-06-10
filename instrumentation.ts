// instrumentation.ts
// Next.js 伺服器啟動時載入對應 runtime 的 Sentry 設定;並把伺服器端錯誤交給 Sentry。
// 未設 DSN 時 Sentry 為 no-op,故本檔在無 DSN 環境也安全。
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;

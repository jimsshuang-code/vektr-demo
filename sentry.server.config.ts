// sentry.server.config.ts
// Sentry 伺服器端初始化。僅在有 DSN 時啟用,未設 DSN 則為 no-op(不送事件、零負擔)。
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: !!dsn,
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
  tracesSampleRate: 0.1,
});

// sentry.edge.config.ts
// Sentry edge runtime 初始化(middleware / edge routes)。未設 DSN 則為 no-op。
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: !!dsn,
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
  tracesSampleRate: 0.1,
});

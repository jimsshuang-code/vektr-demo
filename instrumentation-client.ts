// instrumentation-client.ts
// Sentry 瀏覽器端初始化(在 app 互動前載入)。未設 NEXT_PUBLIC_SENTRY_DSN 則為 no-op。
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: !!dsn,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || "development",
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
});

// 讓 Sentry 能追蹤前端路由切換(App Router)
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

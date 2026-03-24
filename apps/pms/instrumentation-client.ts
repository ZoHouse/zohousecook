import * as Sentry from "@sentry/nextjs";
import { sentryConfig } from "@zo/utils/sentry";
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  ...sentryConfig,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

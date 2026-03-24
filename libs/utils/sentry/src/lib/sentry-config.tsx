import * as Sentry from "@sentry/nextjs";

const sentryConfig:
  | Sentry.BrowserOptions
  | Sentry.NodeOptions
  | Sentry.EdgeOptions = {
  debug: false,
  normalizeDepth: 10,
  sendDefaultPii: true,
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  enableLogs: true,
  beforeSend: (event, hint) => {
    const message =
      hint.originalException instanceof Error
        ? String(hint.originalException.message || "")
        : "";

    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const botPattern =
      /(bot|crawler|spider|crawling|facebookexternalhit|twitterbot|linkedinbot|slackbot|pinterest|embedly|quora link preview|whatsapp|telegrambot|google|bing|yandex|ahrefs|semrush|mj12|lighthouse|pagespeed|gtmetrix)/i;
    if (botPattern.test(ua)) {
      return null;
    }

    if (
      message.includes("Network Error") ||
      message.includes("timeout of 30000ms")
    ) {
      return null;
    }

    const isAxios502 = message.includes("status code 502");

    if (isAxios502) {
      return null;
    }

    return event;
  },
};

export { sentryConfig };

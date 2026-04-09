/**
 * Lightweight onboarding telemetry.
 *
 * Currently logs to console.debug (visible in browser devtools).
 * Swap the body for PostHog/Sentry/Amplitude when a product analytics
 * library is wired into the monorepo.
 */

interface OnboardingEventProps {
  step_name?: string;
  user_pid?: string;
  duration_ms?: number;
  error_type?: string;
  http_status?: number;
  queue_length?: number;
  queue_steps?: string[];
  steps_completed?: number;
  total_duration_ms?: number;
}

export function trackOnboarding(
  event: string,
  props?: OnboardingEventProps
): void {
  try {
    if (typeof window !== "undefined") {
      console.debug(`[zo:onboarding] ${event}`, props);
    }
  } catch {
    // Telemetry should never break the flow
  }
}

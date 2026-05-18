/**
 * Analytics event tracking — thin abstraction layer.
 *
 * All functions are no-ops until a real provider (e.g. PostHog, Segment,
 * Plausible) is wired in. Replace the body of `track` to enable.
 *
 * Usage:
 *   import { trackEvent } from "@/lib/analytics-events";
 *   trackEvent("hero_cta_click");
 */

export type AnalyticsEvent =
  | "hero_cta_click"
  | "sample_preview_cta_click"
  | "pricing_cta_click"
  | "contact_cta_click"
  | "faq_expand"
  | "url_submit_started"
  | "url_submit_completed";

/**
 * Fire a named analytics event with optional properties.
 * Replace this implementation to enable real tracking.
 */
export function trackEvent(
  event: AnalyticsEvent,
  _properties?: Record<string, unknown>,
): void {
  // TODO: wire to your analytics provider
  // Example: window.analytics?.track(event, properties);
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.debug("[analytics]", event, _properties ?? "");
  }
}

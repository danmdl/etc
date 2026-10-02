/**
 * Thin wrapper over Vercel Web Analytics custom events.
 *
 * Uses the `window.va` queue provided by the built-in /_vercel/insights script
 * (see app/layout.tsx), so no npm dependency is needed. Safe no-op when
 * analytics is disabled, blocked, or running locally.
 */

export type AnalyticsEvent =
  | "video_request_form_view"
  | "video_request_submitted"
  | "video_request_success"
  | "video_request_error";

type EventData = Record<string, string | number | boolean | null>;

declare global {
  interface Window {
    va?: (event: "event", payload: { name: string; data?: EventData }) => void;
  }
}

export function track(name: AnalyticsEvent, data?: EventData): void {
  try {
    window.va?.("event", { name, data });
  } catch {
    // Analytics must never break the form.
  }
}

/**
 * Shared contract between the form, the API route, and Albato.
 */

/** What the browser sends to POST /api/video-request. */
export interface VideoRequestInput {
  first_name: string;
  email: string;
  company?: string;
  job_title?: string;
  page_url?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  /** Honeypot. Real users never see or fill this field. */
  website?: string;
}

/**
 * The exact JSON payload forwarded to the Albato Incoming Webhook.
 * Flat, snake_case, every key always present (empty string when unknown)
 * so Albato field mapping is stable across submissions.
 */
export interface AlbatoPayload {
  first_name: string;
  email: string;
  company: string;
  job_title: string;
  source: "cv";
  page_url: string;
  referrer: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  submitted_at: string;
  request_id: string;
}

export type VideoRequestResponse =
  | { success: true; request_id?: string }
  | { success: false; message: string };

import { BUSINESS_EMAIL_MESSAGE, isPersonalEmail } from "./business-email";
import type { VideoRequestInput } from "./types";

export const FIRST_NAME_ONE_WORD_MESSAGE = "Please enter just your first name (one word).";

export const LIMITS = {
  first_name: 80,
  email: 254,
  company: 120,
  job_title: 120,
  url: 500,
  utm: 200,
} as const;

// Pragmatic email check: one @, no whitespace, a dot in the domain,
// and a TLD of at least two letters. Deliverability is Albato's job.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@.]{2,}$/;

// ASCII control characters (incl. DEL). Newlines/tabs are collapsed separately.
const CONTROL_CHARS_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/**
 * Trim, strip control characters and angle brackets, collapse whitespace,
 * and cap length. Non-strings become "".
 */
export function sanitizeText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(CONTROL_CHARS_RE, "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function isValidEmail(email: string): boolean {
  return email.length <= LIMITS.email && EMAIL_RE.test(email);
}

/** Accept only absolute http(s) URLs; anything else becomes "". */
export function sanitizeUrl(value: unknown): string {
  const raw = sanitizeText(value, LIMITS.url);
  if (!raw) return "";
  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

export type ValidationResult =
  | { ok: true; data: Required<Omit<VideoRequestInput, "website">>; isBot: boolean }
  | { ok: false; message: string };

export function validateVideoRequest(body: unknown): ValidationResult {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, message: "Invalid request." };
  }

  const input = body as Record<string, unknown>;

  // Honeypot: report as a bot but let the caller decide how to respond.
  const isBot = typeof input.website === "string" && input.website.trim() !== "";

  const first_name = sanitizeText(input.first_name, LIMITS.first_name);
  const email = sanitizeText(input.email, LIMITS.email).toLowerCase();

  if (!first_name || !email) {
    return { ok: false, message: "Please enter your first name and work email." };
  }
  if (first_name.includes(" ")) {
    return { ok: false, message: FIRST_NAME_ONE_WORD_MESSAGE };
  }
  if (!isValidEmail(email)) {
    return { ok: false, message: "Please enter a valid email address." };
  }
  if (isPersonalEmail(email)) {
    return { ok: false, message: BUSINESS_EMAIL_MESSAGE };
  }

  return {
    ok: true,
    isBot,
    data: {
      first_name,
      email,
      company: sanitizeText(input.company, LIMITS.company),
      job_title: sanitizeText(input.job_title, LIMITS.job_title),
      page_url: sanitizeUrl(input.page_url),
      referrer: sanitizeUrl(input.referrer),
      utm_source: sanitizeText(input.utm_source, LIMITS.utm),
      utm_medium: sanitizeText(input.utm_medium, LIMITS.utm),
      utm_campaign: sanitizeText(input.utm_campaign, LIMITS.utm),
    },
  };
}

import type { AlbatoPayload } from "./types";

const TIMEOUT_MS = 8_000;
const MAX_REDIRECTS = 2;

export class AlbatoConfigError extends Error {}
export class AlbatoDeliveryError extends Error {}

/**
 * POST the payload to the Albato Incoming Webhook as JSON.
 *
 * The URL is read from the server-only ALBATO_WEBHOOK_URL env var and is
 * never logged, returned, or included in error messages.
 *
 * Redirects are handled manually: fetch's automatic redirect handling turns a
 * POST into a body-less GET on 301/302/303, which reaches Albato as an empty
 * request while still returning 200. Instead, every hop is re-sent as the same
 * JSON POST.
 *
 * Returns the final HTTP status.
 */
export async function sendToAlbato(payload: AlbatoPayload): Promise<number> {
  let url = parseWebhookUrl(process.env.ALBATO_WEBHOOK_URL);
  const body = JSON.stringify(payload);
  const signal = AbortSignal.timeout(TIMEOUT_MS);

  for (let hop = 0; ; hop++) {
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": "shinyflows-video-request/1.0",
        },
        body,
        redirect: "manual",
        signal,
        cache: "no-store",
      });
    } catch (err) {
      const reason = err instanceof Error && err.name === "TimeoutError" ? "timeout" : "network error";
      throw new AlbatoDeliveryError(`Albato webhook ${reason}`);
    }

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location || hop >= MAX_REDIRECTS) {
        throw new AlbatoDeliveryError(`Albato webhook redirected (HTTP ${res.status}) without a usable target`);
      }
      console.warn(
        `[video-request] ALBATO_WEBHOOK_URL redirects (HTTP ${res.status}); re-sent as JSON POST. ` +
          "Update the env var to the exact URL shown in Albato.",
      );
      url = parseWebhookUrl(new URL(location, url).toString());
      continue;
    }

    if (!res.ok) {
      throw new AlbatoDeliveryError(`Albato webhook responded with HTTP ${res.status}`);
    }
    return res.status;
  }
}

/** Normalize to an https URL (http kept only for localhost testing). Tolerates stray whitespace/quotes from copy-paste. */
function parseWebhookUrl(raw: string | undefined): URL {
  const value = raw?.trim().replace(/^["']|["']$/g, "");
  if (!value) throw new AlbatoConfigError("ALBATO_WEBHOOK_URL is not configured");

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new AlbatoConfigError("ALBATO_WEBHOOK_URL is not a valid URL");
  }

  const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol === "http:" && !isLocal) {
    // An http:// webhook would redirect to https://; go there directly.
    console.warn("[video-request] ALBATO_WEBHOOK_URL uses http://; sending to https:// instead.");
    url.protocol = "https:";
  } else if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new AlbatoConfigError("ALBATO_WEBHOOK_URL must start with https://");
  }
  return url;
}

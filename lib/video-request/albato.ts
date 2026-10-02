import type { AlbatoPayload } from "./types";

const TIMEOUT_MS = 8_000;

export class AlbatoConfigError extends Error {}
export class AlbatoDeliveryError extends Error {}

/**
 * POST the payload to the Albato Incoming Webhook.
 *
 * The URL is read from the server-only ALBATO_WEBHOOK_URL env var and is
 * never logged, returned, or included in error messages.
 */
export async function sendToAlbato(payload: AlbatoPayload): Promise<void> {
  const webhookUrl = process.env.ALBATO_WEBHOOK_URL;
  if (!webhookUrl) {
    throw new AlbatoConfigError("ALBATO_WEBHOOK_URL is not configured");
  }

  let res: Response;
  try {
    res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (err) {
    const reason = err instanceof Error && err.name === "TimeoutError" ? "timeout" : "network error";
    throw new AlbatoDeliveryError(`Albato webhook ${reason}`);
  }

  if (!res.ok) {
    throw new AlbatoDeliveryError(`Albato webhook responded with HTTP ${res.status}`);
  }
}

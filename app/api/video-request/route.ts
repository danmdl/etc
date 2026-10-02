import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { AlbatoConfigError, AlbatoDeliveryError, sendToAlbato } from "@/lib/video-request/albato";
import { getClientIp, rateLimit } from "@/lib/video-request/rate-limit";
import type { AlbatoPayload, VideoRequestResponse } from "@/lib/video-request/types";
import { validateVideoRequest } from "@/lib/video-request/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 10_000;
const GENERIC_ERROR = "Something went wrong. Please try again.";

function json(body: VideoRequestResponse, status = 200, headers?: HeadersInit) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
}

/** Reject browser requests coming from a different site. curl/server calls send no Origin and pass. */
function isCrossOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host !== req.headers.get("host");
  } catch {
    return true;
  }
}

export async function POST(req: NextRequest) {
  const requestId = randomUUID();

  try {
    if (isCrossOrigin(req)) {
      return json({ success: false, message: GENERIC_ERROR }, 403);
    }

    if (!req.headers.get("content-type")?.includes("application/json")) {
      return json({ success: false, message: GENERIC_ERROR }, 415);
    }

    const { allowed, retryAfterSec } = rateLimit(getClientIp(req.headers));
    if (!allowed) {
      return json(
        { success: false, message: "Too many requests. Please try again in a few minutes." },
        429,
        { "Retry-After": String(retryAfterSec) },
      );
    }

    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) {
      return json({ success: false, message: GENERIC_ERROR }, 413);
    }

    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      return json({ success: false, message: GENERIC_ERROR }, 400);
    }

    const result = validateVideoRequest(body);
    if (!result.ok) {
      return json({ success: false, message: result.message }, 400);
    }

    // Honeypot tripped: pretend it worked so bots learn nothing, but forward nothing.
    if (result.isBot) {
      console.info(`[video-request] ${requestId} honeypot triggered, dropped`);
      return json({ success: true });
    }

    const payload: AlbatoPayload = {
      first_name: result.data.first_name,
      email: result.data.email,
      company: result.data.company,
      job_title: result.data.job_title,
      source: "cv",
      page_url: result.data.page_url,
      referrer: result.data.referrer,
      utm_source: result.data.utm_source,
      utm_medium: result.data.utm_medium,
      utm_campaign: result.data.utm_campaign,
      submitted_at: new Date().toISOString(),
      request_id: requestId,
    };

    const albatoStatus = await sendToAlbato(payload);

    console.info(`[video-request] ${requestId} forwarded to Albato as JSON POST (HTTP ${albatoStatus})`);
    return json({ success: true, request_id: requestId });
  } catch (err) {
    // Our error messages never contain the webhook URL; anything unexpected is reduced to its name.
    const reason =
      err instanceof AlbatoConfigError || err instanceof AlbatoDeliveryError
        ? err.message
        : err instanceof Error
          ? `unexpected ${err.name}`
          : "unknown error";
    console.error(`[video-request] ${requestId} failed: ${reason}`);
    return json({ success: false, message: GENERIC_ERROR }, 502);
  }
}

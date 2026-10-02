# shinyflows.com: personalized video intro

A small landing page linked from my resume. A recruiter enters their name and work email,
and an automation sends them a short personalized video introduction.

```
Browser form ──POST /api/video-request──▶ Next.js route (Vercel)
                                           │ validate · sanitize · honeypot · rate limit
                                           ▼
                                  Albato Incoming Webhook ──▶ Sendspark ──▶ Email
```

The Albato webhook URL lives only in the server-side env var `ALBATO_WEBHOOK_URL`. It is
never shipped to the browser and never logged.

## Structure

| Path | Purpose |
| --- | --- |
| `app/page.tsx` | Landing page (server component) |
| `components/VideoRequestForm.tsx` | Client form: validation, sending/success/error states, UTM capture |
| `components/RequestFlow.tsx` | "What happens when you hit send" strip |
| `app/api/video-request/route.ts` | `POST` endpoint: orchestrates checks and forwards to Albato |
| `lib/video-request/validation.ts` | Input sanitizing and validation |
| `lib/video-request/albato.ts` | Server-only webhook client (8s timeout) |
| `lib/video-request/rate-limit.ts` | Best-effort in-memory limiter (5 req / 10 min / IP) |
| `lib/video-request/types.ts` | Request, Albato payload, and response contracts |
| `lib/analytics.ts` | Vercel Web Analytics custom events (no npm dependency) |

## Albato payload

```json
{
  "first_name": "Sarah",
  "email": "sarah@company.com",
  "company": "Acme",
  "job_title": "Talent Partner",
  "source": "cv",
  "page_url": "https://shinyflows.com/",
  "referrer": "",
  "utm_source": "cv",
  "utm_medium": "pdf",
  "utm_campaign": "resume",
  "submitted_at": "2026-10-02T15:45:06.429Z",
  "request_id": "22fed6e5-9e9a-41b2-b5ba-92398fc90206"
}
```

Every key is always present. Unknown values are `""`. `submitted_at` and `request_id` are
generated server-side.

## Local development

```bash
npm install
cp .env.example .env.local   # paste your Albato webhook URL
npm run dev                  # http://localhost:3000
```

## Manual test

```bash
curl -i -X POST http://localhost:3000/api/video-request \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Sarah","email":"sarah@company.com","company":"Acme","job_title":"Talent Partner","page_url":"https://shinyflows.com/","utm_source":"cv","utm_medium":"pdf","utm_campaign":"resume"}'
```

## Responses

| Status | Body | When |
| --- | --- | --- |
| 200 | `{"success":true,"request_id":"…"}` | Forwarded to Albato |
| 400 | `{"success":false,"message":"…"}` | Missing/invalid fields, bad JSON |
| 403 / 413 / 415 | generic error | Cross-site origin, oversized body, non-JSON |
| 429 | generic + `Retry-After` | Rate limit hit |
| 502 | generic error | Albato unreachable/non-2xx, or env var missing |

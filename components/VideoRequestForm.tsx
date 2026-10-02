"use client";

import { useEffect, useRef, useState, type FormEvent, type InputHTMLAttributes } from "react";
import { track } from "@/lib/analytics";
import type { VideoRequestResponse } from "@/lib/video-request/types";

type Status = "idle" | "sending" | "success" | "error";
type FieldErrors = Partial<Record<"first_name" | "email", string>>;

const GENERIC_ERROR = "Something went wrong. Please try again.";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@.]{2,}$/;
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign"] as const;

/** Read UTM params from the landing URL, falling back to blanks. */
function readContext() {
  const params = new URLSearchParams(window.location.search);
  const utm = Object.fromEntries(UTM_KEYS.map((k) => [k, params.get(k) ?? ""]));
  return {
    ...utm,
    page_url: window.location.origin + window.location.pathname,
    referrer: document.referrer,
  };
}

export default function VideoRequestForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverMessage, setServerMessage] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [requestId, setRequestId] = useState("");
  const successHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    track("video_request_form_view");
  }, []);

  useEffect(() => {
    if (status === "success") successHeadingRef.current?.focus();
  }, [status]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;

    const form = e.currentTarget;
    const fd = new FormData(form);
    const value = (name: string) => String(fd.get(name) ?? "").trim();

    const first_name = value("first_name");
    const email = value("email");

    const nextErrors: FieldErrors = {};
    if (!first_name) nextErrors.first_name = "Please enter your first name.";
    if (!email) nextErrors.email = "Please enter your work email.";
    else if (!EMAIL_RE.test(email)) nextErrors.email = "Please enter a valid email address.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const firstInvalid = nextErrors.first_name ? "first_name" : "email";
      (form.elements.namedItem(firstInvalid) as HTMLInputElement | null)?.focus();
      return;
    }

    setStatus("sending");
    setServerMessage("");
    track("video_request_submitted");

    try {
      const res = await fetch("/api/video-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name,
          email,
          company: value("company"),
          job_title: value("job_title"),
          website: value("website"), // honeypot
          ...readContext(),
        }),
      });

      const data = (await res.json().catch(() => null)) as VideoRequestResponse | null;

      if (res.ok && data?.success) {
        setSubmittedEmail(email);
        setRequestId(data.request_id ?? "");
        setStatus("success");
        track("video_request_success");
        return;
      }

      setServerMessage(data && !data.success && data.message ? data.message : GENERIC_ERROR);
      setStatus("error");
      track("video_request_error", { status: res.status });
    } catch {
      setServerMessage(GENERIC_ERROR);
      setStatus("error");
      track("video_request_error", { status: 0 });
    }
  }

  if (status === "success") {
    return (
      <div className="success" role="status">
        <div className="success-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
            <path className="success-check" d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </div>
        <h2 ref={successHeadingRef} tabIndex={-1} className="success-title">
          You&rsquo;re all set.
        </h2>
        <p className="success-text">
          I&rsquo;m creating your introduction now. It should arrive in your inbox shortly.
        </p>
        <p className="success-email">
          <span className="sr-only">Sending to </span>
          {submittedEmail}
        </p>
        {requestId && (
          <p className="success-meta">
            <span className="mono">request_id</span> <span className="mono muted">{requestId.slice(0, 8)}</span>
          </p>
        )}
      </div>
    );
  }

  const sending = status === "sending";

  return (
    <form
      className="form"
      onSubmit={handleSubmit}
      onInput={(e) => {
        const name = (e.target as HTMLInputElement).name as keyof FieldErrors;
        if (errors[name]) setErrors(({ [name]: _cleared, ...rest }) => rest);
      }}
      noValidate
      aria-describedby="form-note"
    >
      <div className="field-row">
        <Field
          id="first_name"
          label="First name"
          autoComplete="given-name"
          required
          maxLength={80}
          error={errors.first_name}
          disabled={sending}
        />
        <Field
          id="email"
          label="Work email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          maxLength={254}
          error={errors.email}
          disabled={sending}
        />
      </div>
      <div className="field-row">
        <Field id="company" label="Company" autoComplete="organization" maxLength={120} disabled={sending} />
        <Field id="job_title" label="Job title" autoComplete="organization-title" maxLength={120} disabled={sending} />
      </div>

      {/* Honeypot: hidden from people and assistive tech, tempting to bots. */}
      <div className="hp" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <button type="submit" className="button" disabled={sending} aria-busy={sending}>
        {sending && <span className="spinner" aria-hidden="true" />}
        {sending ? "Sending..." : "Send me Dan’s video"}
      </button>

      <p id="form-note" className="form-note">
        You&rsquo;ll receive one email containing my video. No mailing list.
      </p>

      <div aria-live="assertive" className="form-error-slot">
        {status === "error" && (
          <p className="form-error" role="alert">
            {serverMessage || GENERIC_ERROR}
          </p>
        )}
      </div>
    </form>
  );
}

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "name"> {
  id: string;
  label: string;
  error?: string;
}

function Field({ id, label, error, required, ...inputProps }: FieldProps) {
  const errorId = `${id}-error`;
  return (
    <div className="field">
      <label htmlFor={id} className="label">
        {label}
        {required ? (
          <span className="req" aria-hidden="true"> *</span>
        ) : (
          <span className="optional">Optional</span>
        )}
      </label>
      <input
        id={id}
        name={id}
        className="input"
        required={required}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

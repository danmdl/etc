/**
 * A quiet "how this works" strip: the page doubles as a small
 * demonstration of the integration behind it.
 */

const STEPS = [
  { label: "You", detail: "submit this form", code: "POST /api/video-request" },
  { label: "API", detail: "validates & sanitizes", code: "serverless · Vercel" },
  { label: "Webhook", detail: "triggers the workflow", code: "Albato" },
  { label: "Video", detail: "personalized for you", code: "Sendspark" },
  { label: "Inbox", detail: "one email, that's it", code: "200 OK" },
];

export default function RequestFlow() {
  return (
    <section className="flow" aria-labelledby="flow-title">
      <h2 id="flow-title" className="flow-title">
        <span className="mono">// </span>What happens when you hit send
      </h2>
      <ol className="flow-steps">
        {STEPS.map((step, i) => (
          <li key={step.label} className="flow-step">
            <span className="flow-index mono" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="flow-label">{step.label}</span>
            <span className="flow-detail">{step.detail}</span>
            <code className="flow-code">{step.code}</code>
          </li>
        ))}
      </ol>
    </section>
  );
}

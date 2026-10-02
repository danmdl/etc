import VideoRequestForm from "@/components/VideoRequestForm";
import RequestFlow from "@/components/RequestFlow";

export default function Home() {
  return (
    <div className="page">
      <div className="backdrop" aria-hidden="true" />

      <header className="topbar">
        <span className="brand">
          <span className="brand-mark" aria-hidden="true">D</span>
          shinyflows
        </span>
        <span className="status-pill">
          <span className="status-dot" aria-hidden="true" />
          Open to new roles
        </span>
      </header>

      <main className="main">
        <section className="hero" aria-labelledby="hero-title">
          <p className="eyebrow">A more personal introduction</p>
          <h1 id="hero-title" className="hero-title">
            Daniel De Lauretis
            <span className="hero-role">Solutions Engineer</span>
          </h1>
          <p className="hero-lede">
            If you&rsquo;re reviewing my resume, I&rsquo;d love to introduce myself properly. Enter your details
            below and I&rsquo;ll send you a short personalized video.
          </p>
          <ul className="hero-points">
            <li>A short video, recorded for you</li>
            <li>Delivered straight to your inbox</li>
            <li>One email, then nothing else</li>
          </ul>
        </section>

        <section className="card" aria-label="Request your video">
          <VideoRequestForm />
        </section>
      </main>

      <RequestFlow />

      <footer className="footer">
        <span>&copy; {new Date().getFullYear()} Daniel De Lauretis</span>
        <span className="mono muted">Next.js · Vercel · Albato · Sendspark</span>
      </footer>
    </div>
  );
}

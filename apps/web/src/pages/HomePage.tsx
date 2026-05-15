import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">Conference slides, synced</p>
        <h1>Share Slides</h1>
        <p className="lead">
          Upload a PDF, share a QR code, and control the page everyone sees — no
          projector required.
        </p>
        <div className="actions">
          <Link className="btn btn-primary" to="/create">
            Start presenting
          </Link>
        </div>
      </header>
      <section className="features">
        <article>
          <h3>Presenter mode</h3>
          <p>You advance slides; every device follows in real time.</p>
        </article>
        <article>
          <h3>QR join</h3>
          <p>Participants scan and open the deck on their laptop or phone.</p>
        </article>
        <article>
          <h3>Take control</h3>
          <p>Hand off navigation when someone else needs to drive.</p>
        </article>
      </section>
    </div>
  );
}

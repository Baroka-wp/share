import { Link } from "react-router-dom";

function IconBell() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 11-3.46 0"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M4 20c1.5-4 6-5 8-5s6.5 1 8 5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function PresenterHeader() {
  return (
    <header className="presenter-header">
      <Link className="landing-logo" to="/">
        Share Slides
      </Link>

      <nav className="presenter-nav" aria-label="Présentation">
        <span className="presenter-nav-active">Présentation en cours</span>
        <a href="#library">Bibliothèque</a>
        <a href="#analytics">Analytiques</a>
      </nav>

      <div className="landing-header-actions">
        <Link className="btn btn-primary btn-sm" to="/join">
          Join Session
        </Link>
        <button type="button" className="icon-btn" aria-label="Notifications">
          <IconBell />
        </button>
        <button type="button" className="icon-btn icon-btn-avatar" aria-label="Profil">
          <IconUser />
        </button>
      </div>
    </header>
  );
}

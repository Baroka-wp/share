import { Link } from "react-router-dom";

type Variant = "landing" | "app" | "presenter";

type Props = {
  variant?: Variant;
  showJoinCta?: boolean;
};

function Logo() {
  return (
    <Link className="brand" to="/" aria-label="Share Slides">
      <span className="brand-mark" aria-hidden>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="14" height="10" rx="2.5" fill="white" opacity="0.95" />
          <rect x="7" y="10" width="14" height="10" rx="2.5" fill="white" />
        </svg>
      </span>
      <span className="brand-name">Share Slides</span>
    </Link>
  );
}

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

export default function AppHeader({ variant = "app", showJoinCta = true }: Props) {
  return (
    <header className={`app-header app-header--${variant}`}>
      <Logo />

      {variant === "presenter" && (
        <nav className="app-nav" aria-label="Présentation">
          <span className="app-nav-active">Présentation en cours</span>
          <span className="app-nav-disabled" aria-disabled="true">
            Bibliothèque
          </span>
          <span className="app-nav-disabled" aria-disabled="true">
            Analytiques
          </span>
        </nav>
      )}

      <div className="app-header-actions">
        {variant === "landing" && (
          <Link className="btn btn-secondary btn-sm" to="/create">
            Démarrer une présentation
          </Link>
        )}
        {showJoinCta && (
          <Link className="btn btn-primary btn-sm" to="/join">
            Rejoindre
          </Link>
        )}
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

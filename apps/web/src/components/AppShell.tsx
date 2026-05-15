import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type Props = {
  children: ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
  footer?: ReactNode;
};

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

export default function AppShell({
  children,
  showHeader = true,
  showFooter = false,
  footer,
}: Props) {
  return (
    <div className="shell">
      {showHeader && (
        <header className="shell-header">
          <Link className="logo" to="/">
            Share Slides
          </Link>
          <div className="shell-header-actions">
            <button type="button" className="icon-btn" aria-label="Notifications">
              <IconBell />
            </button>
            <button type="button" className="icon-btn icon-btn-avatar" aria-label="Profil">
              <IconUser />
            </button>
          </div>
        </header>
      )}
      <main className="shell-main">{children}</main>
      {showFooter && (footer ?? null)}
    </div>
  );
}

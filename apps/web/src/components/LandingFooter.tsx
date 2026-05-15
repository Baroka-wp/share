import { Link } from "react-router-dom";

export default function LandingFooter() {
  return (
    <footer className="landing-footer">
      <p className="landing-footer-brand" aria-hidden>
        Share Slides
      </p>
      <div className="landing-footer-bar">
        <p className="landing-footer-copy">© 2024 Share Slides. All rights reserved.</p>
        <nav className="landing-footer-nav" aria-label="Legal">
          <a href="#terms">Terms</a>
          <a href="#privacy">Privacy</a>
          <a href="#security">Security</a>
          <a href="#contact">Contact</a>
        </nav>
      </div>
    </footer>
  );
}

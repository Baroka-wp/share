import { Link } from "react-router-dom";

export default function JoinFooter() {
  return (
    <footer className="join-footer">
      <Link className="join-footer-logo" to="/">
        Share Slides
      </Link>
      <nav className="join-footer-nav" aria-label="Legal">
        <a href="#terms">Terms</a>
        <a href="#privacy">Privacy</a>
        <a href="#contact">Contact</a>
      </nav>
      <p className="join-footer-copy">© 2024 Share Slides. All rights reserved.</p>
    </footer>
  );
}

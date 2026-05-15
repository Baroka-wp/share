import { Link } from "react-router-dom";

export default function JoinFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="join-footer">
      <Link className="join-footer-logo" to="/">
        Share Slides
      </Link>
      <nav className="join-footer-nav" aria-label="Legal">
        <a href="#terms">Conditions</a>
        <a href="#privacy">Confidentialité</a>
        <a href="#contact">Contact</a>
      </nav>
      <p className="join-footer-copy">© {year} Share Slides. Tous droits réservés.</p>
    </footer>
  );
}

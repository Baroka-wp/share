export default function LandingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="landing-footer">
      <p className="landing-footer-brand" aria-hidden>
        Share Slides
      </p>
      <div className="landing-footer-bar">
        <p className="landing-footer-copy">© {year} Share Slides. Tous droits réservés.</p>
        <nav className="landing-footer-nav" aria-label="Legal">
          <a href="#terms">Conditions</a>
          <a href="#privacy">Confidentialité</a>
          <a href="#security">Sécurité</a>
          <a href="#contact">Contact</a>
        </nav>
      </div>
    </footer>
  );
}

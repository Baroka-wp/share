export default function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <p className="site-footer-copy">© {year} Share Slides. Tous droits réservés.</p>
      <nav className="site-footer-nav" aria-label="Legal">
        <a href="#terms">Conditions</a>
        <a href="#privacy">Confidentialité</a>
        <a href="#security">Sécurité</a>
        <a href="#contact">Contact</a>
      </nav>
    </footer>
  );
}

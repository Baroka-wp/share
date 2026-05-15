import { Link } from "react-router-dom";
import LandingFooter from "../components/LandingFooter";
import LandingHeader from "../components/LandingHeader";

function IconSync() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 12a8 8 0 0114-5.3M20 12a8 8 0 01-14 5.3M4 7V4h3M17 17v3h-3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconEngage() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden>
      <circle cx="32" cy="22" r="10" stroke="currentColor" strokeWidth="2" opacity="0.9" />
      <path
        d="M14 52c2-10 10-14 18-14s16 4 18 14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M44 14l6-4 2 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l8 3v6c0 5-3.5 9.5-8 10-4.5-.5-8-5-8-10V6l8-3z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className="landing">
      <LandingHeader />

      <section className="landing-hero">
        <div className="landing-hero-content">
          <span className="badge badge-live landing-live-badge">Sync en direct</span>
          <h1 className="landing-headline">
            Remplacez le projecteur,{" "}
            <span className="landing-headline-accent">pas l&apos;attention.</span>
          </h1>
          <p className="landing-lead">
            Partagez vos présentations PDF en direct sur les appareils de votre
            audience. Synchronisation parfaite, zéro latence — pour des moments
            vraiment mémorables.
          </p>
          <div className="landing-hero-actions">
            <Link className="btn btn-primary" to="/create">
              Démarrer une présentation
            </Link>
          </div>
        </div>

        <div className="landing-hero-visual" aria-hidden>
          <div className="hero-visual-main" />
        </div>
      </section>

      <section className="landing-grid" id="how">
        <article className="bento bento-sync">
          <div className="bento-icon-wrap">
            <IconSync />
          </div>
          <h2 className="bento-title">Zéro Latence, Sync Totale</h2>
          <p className="bento-text">
            Chaque mouvement de slide est instantanément répliqué sur tous les
            appareils connectés. Fini les « vous voyez la slide 4 ? » en salle.
          </p>
          <div className="bento-visual bento-visual-tablet" />
        </article>

        <article className="bento bento-engage">
          <IconEngage />
          <h2 className="bento-title">Engagement Boosté</h2>
          <p className="bento-text">
            Transformez votre audience passive en participants actifs grâce aux
            questions, votes et sauvegarde de slides.
          </p>
        </article>

        <article className="bento bento-security">
          <div className="bento-icon-wrap bento-icon-wrap--sm">
            <IconShield />
          </div>
          <h2 className="bento-title">Sécurité Pro</h2>
          <p className="bento-text">
            Accès par QR code et PIN. Vos fichiers PDF restent chiffrés et
            contrôlés.
          </p>
          <p className="bento-stat">
            <span className="bento-stat-value">500k+</span>
            <span className="bento-stat-label">Présentations partagées</span>
          </p>
        </article>

        <article className="bento bento-analytics">
          <h2 className="bento-title">Analyses Post-Event</h2>
          <p className="bento-text">
            Recevez un rapport détaillé sur l&apos;engagement de votre audience
            après chaque présentation.
          </p>
          <p className="bento-stat">
            <span className="bento-stat-value">99.9%</span>
            <span className="bento-stat-label">Uptime garanti</span>
          </p>
          <div className="bento-visual bento-visual-desktop">
            <span className="bento-overlay-stat">120+</span>
            <span className="bento-overlay-label">Pays utilisés</span>
          </div>
        </article>
      </section>

      <section className="landing-cta" id="pricing">
        <h2 className="text-headline">Prêt pour votre prochaine conférence ?</h2>
        <p className="text-body">
          Créez une salle en quelques secondes ou rejoignez une session existante.
        </p>
        <div className="landing-hero-actions">
          <Link className="btn btn-primary" to="/create">
            Démarrer une présentation
          </Link>
          <Link className="btn btn-secondary" to="/join">
            Rejoindre une session
          </Link>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}

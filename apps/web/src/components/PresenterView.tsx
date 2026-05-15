import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { PresenceClient } from "@share-slides/shared";
import PdfViewer from "./PdfViewer";
import PresenterHeader from "./PresenterHeader";
import { initialsFromName } from "../utils/initials";

type Props = {
  title: string;
  pdfUrl: string;
  currentPage: number;
  pageCount: number;
  connected: boolean;
  shareUrl: string;
  pin: string | null;
  presence: PresenceClient[];
  clientId: string | null;
  allowTakeControl: boolean;
  requireName: boolean;
  isController: boolean;
  onToggleAllowTakeControl: (allow: boolean) => void;
  onToggleRequireName: (require: boolean) => void;
  onPrev: () => void;
  onNext: () => void;
};

function IconQr() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 14h2v2h-2zM18 14h3v3h-3zM14 18h2v3h-2z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function PresenterView({
  title,
  pdfUrl,
  currentPage,
  pageCount,
  connected,
  shareUrl,
  pin,
  presence,
  clientId,
  allowTakeControl,
  requireName,
  isController,
  onToggleAllowTakeControl,
  onToggleRequireName,
  onPrev,
  onNext,
}: Props) {
  const [showQr, setShowQr] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState<"pin" | "url" | null>(null);
  const activeCount = presence.length;

  function formatPin(value: string): string {
    return value.length === 6 ? `${value.slice(0, 3)} ${value.slice(3)}` : value;
  }

  async function copyToClipboard(text: string, kind: "pin" | "url") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      /* clipboard refused — silent */
    }
  }

  useEffect(() => {
    if (!isController) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        onNext();
      }
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        onPrev();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isController, onPrev, onNext]);

  return (
    <div className="presenter-dashboard">
      <PresenterHeader />

      <div className="presenter-body">
        <aside className="presenter-sidebar">
          <div className="presenter-sidebar-head">
            <h2>Participants</h2>
            <span className="chip chip-active">{activeCount} actifs</span>
          </div>

          <ul className="participant-list">
            {presence.map((p) => {
              const isSelf = p.id === clientId;
              const isMod = p.role === "presenter" || p.isController;
              return (
                <li
                  key={p.id}
                  className={`participant-row ${isMod ? "participant-row--active" : ""}`}
                >
                  <span className="participant-avatar" aria-hidden>
                    {initialsFromName(p.name)}
                  </span>
                  <div className="participant-info">
                    <span className="participant-name">{p.name}</span>
                    <span className="participant-role">
                      {p.role === "presenter"
                        ? "Modérateur"
                        : p.isController
                          ? "Contrôle la session"
                          : "Participant"}
                      {isSelf ? " · vous" : ""}
                    </span>
                  </div>
                </li>
              );
            })}
            {presence.length === 0 && (
              <li className="participant-empty">En attente de participants…</li>
            )}
          </ul>

          {pin && (
            <div className="presenter-share-card">
              <span className="field-label">Code de session</span>
              <div className="presenter-share-pin">
                <span className="presenter-share-pin-value">{formatPin(pin)}</span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => copyToClipboard(pin, "pin")}
                >
                  {copied === "pin" ? "Copié ✓" : "Copier"}
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            className="btn btn-share-qr"
            onClick={() => setShowQr(true)}
          >
            <IconQr />
            Partager QR
          </button>
        </aside>

        <div className="presenter-stage-wrap">
          <div className="presenter-stage">
            <span
              className={
                connected ? "badge badge-live-stage" : "badge badge-connecting"
              }
            >
              {connected ? "En direct" : "Connexion"}
            </span>
            <div className="presenter-slide-frame">
              <PdfViewer url={pdfUrl} page={currentPage} />
            </div>
          </div>

          <div className="presenter-controls">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={!isController || currentPage <= 1}
              onClick={onPrev}
            >
              ← Précédent
            </button>
            <span className="slide-pill">
              Slide {currentPage} / {pageCount}
            </span>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!isController || currentPage >= pageCount}
              onClick={onNext}
            >
              Suivant →
            </button>
            <div className="presenter-controls-tools">
              <button
                type="button"
                className={`presenter-tool ${showSettings ? "presenter-tool--active" : ""}`}
                onClick={() => {
                  setShowSettings((s) => !s);
                  setShowQr(false);
                }}
                aria-expanded={showSettings}
              >
                <IconSettings />
                <span>Réglages</span>
              </button>
            </div>
          </div>

          {showSettings && (
            <div className="presenter-settings-panel">
              <p className="text-body">
                Session : <strong>{title}</strong>
              </p>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={allowTakeControl}
                  onChange={(e) => onToggleAllowTakeControl(e.target.checked)}
                />
                Autoriser la prise de main
              </label>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={requireName}
                  onChange={(e) => onToggleRequireName(e.target.checked)}
                />
                Exiger un nom à la connexion
              </label>
            </div>
          )}
        </div>
      </div>

      <footer className="site-footer presenter-site-footer">
        <p className="site-footer-copy">© {new Date().getFullYear()} Share Slides. Tous droits réservés.</p>
        <nav className="site-footer-nav" aria-label="Legal">
          <a href="#terms">Conditions</a>
          <a href="#privacy">Confidentialité</a>
          <a href="#security">Sécurité</a>
          <a href="#contact">Contact</a>
        </nav>
      </footer>

      {showQr && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal
          aria-labelledby="qr-title"
          onClick={() => setShowQr(false)}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 id="qr-title">Partager avec l&apos;audience</h3>
            <p className="text-body">
              Scannez le QR ou partagez le code ci-dessous.
            </p>
            <div className="qr-wrap">
              <QRCodeSVG value={shareUrl} size={200} level="M" fgColor="#4f46e5" />
            </div>

            {pin && (
              <div className="modal-pin">
                <span className="field-label">Code de session</span>
                <div className="modal-pin-row">
                  <span className="modal-pin-value">{formatPin(pin)}</span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => copyToClipboard(pin, "pin")}
                  >
                    {copied === "pin" ? "Copié ✓" : "Copier"}
                  </button>
                </div>
              </div>
            )}

            <div className="modal-share-url">
              <span className="modal-share-url-text">{shareUrl}</span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => copyToClipboard(shareUrl, "url")}
              >
                {copied === "url" ? "Copié ✓" : "Copier le lien"}
              </button>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => setShowQr(false)}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

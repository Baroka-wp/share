import { useEffect, useRef, useState } from "react";
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
  presence: PresenceClient[];
  clientId: string | null;
  allowTakeControl: boolean;
  isController: boolean;
  onToggleAllowTakeControl: (allow: boolean) => void;
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

function IconUsers() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M17 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
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
  presence,
  clientId,
  allowTakeControl,
  isController,
  onToggleAllowTakeControl,
  onPrev,
  onNext,
}: Props) {
  const [showQr, setShowQr] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const activeCount = presence.length;

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
        <aside className="presenter-sidebar" ref={sidebarRef}>
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
                className="presenter-tool"
                onClick={() => {
                  setShowSettings(false);
                  setShowQr(false);
                  sidebarRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }}
              >
                <IconUsers />
                <span>Participants</span>
              </button>
              <button
                type="button"
                className={`presenter-tool ${showSettings ? "presenter-tool--active" : ""}`}
                onClick={() => {
                  setShowSettings((s) => !s);
                  setShowQr(false);
                }}
                aria-expanded={showSettings}
              >
                <span aria-hidden>⚙</span>
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
            </div>
          )}
        </div>
      </div>

      <footer className="site-footer presenter-site-footer">
        <p className="site-footer-copy">© 2024 Share Slides. All rights reserved.</p>
        <nav className="site-footer-nav" aria-label="Legal">
          <a href="#terms">Terms</a>
          <a href="#privacy">Privacy</a>
          <a href="#security">Security</a>
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
            <p className="text-body">Scannez pour rejoindre — sans secret présentateur.</p>
            <div className="qr-wrap">
              <QRCodeSVG value={shareUrl} size={200} level="M" fgColor="#4f46e5" />
            </div>
            <p className="share-url">
              <a href={shareUrl} target="_blank" rel="noreferrer">
                {shareUrl}
              </a>
            </p>
            <button type="button" className="btn btn-primary btn-block" onClick={() => setShowQr(false)}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

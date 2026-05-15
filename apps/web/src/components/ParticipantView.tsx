import { FormEvent, useEffect, useState } from "react";
import PdfViewer from "./PdfViewer";
import type { PresenceClient } from "@share-slides/shared";

type Props = {
  pdfUrl: string;
  currentPage: number;
  pageCount: number;
  connected: boolean;
  controllerName: string;
  isController: boolean;
  allowTakeControl: boolean;
  presence: PresenceClient[];
  myName: string;
  onPrev: () => void;
  onNext: () => void;
  onTakeControl: () => void;
  onChangeName: (name: string) => void;
};

function IconUsers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M17 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function ParticipantView({
  pdfUrl,
  currentPage,
  pageCount,
  connected,
  controllerName,
  isController,
  allowTakeControl,
  presence,
  myName,
  onPrev,
  onNext,
  onTakeControl,
  onChangeName,
}: Props) {
  const [showSettings, setShowSettings] = useState(false);
  const [showZoomHint, setShowZoomHint] = useState(true);
  const [nameDraft, setNameDraft] = useState(myName);
  const [nameSaved, setNameSaved] = useState(false);

  useEffect(() => {
    if (!showSettings) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setShowSettings(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showSettings]);

  function submitName(e: FormEvent) {
    e.preventDefault();
    const trimmed = nameDraft.trim();
    onChangeName(trimmed);
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 1800);
  }

  return (
    <div className="participant-room">
      <div className="live-bar">
        <span className={connected ? "badge badge-live" : "badge badge-connecting"}>
          {connected ? "En direct" : "Connexion"}
        </span>
        <span className="live-bar-follow">
          Vous suivez <strong>{controllerName}</strong>
        </span>
        <span className="live-bar-count">
          <IconUsers />
          {presence.length}
        </span>
      </div>

      <main className="participant-stage">
        <div className="participant-pdf-wrap">
          <PdfViewer url={pdfUrl} page={currentPage} />
          {showZoomHint && (
            <button
              type="button"
              className="zoom-hint"
              onClick={() => setShowZoomHint(false)}
              aria-label="Fermer l'indication"
            >
              <span className="zoom-hint-icon" aria-hidden>
                ⤢
              </span>
              Pincez pour zoomer sur le contenu
            </button>
          )}
        </div>
        {!isController && allowTakeControl && (
          <button
            type="button"
            className="btn-take-control"
            onClick={onTakeControl}
          >
            <span aria-hidden>▢</span>
            Prendre la main
          </button>
        )}
      </main>

      {showSettings && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal
          aria-labelledby="settings-modal-title"
          onClick={() => setShowSettings(false)}
        >
          <div className="modal-card modal-card--sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-card-header">
              <h2 id="settings-modal-title" className="text-headline">
                Réglages
              </h2>
              <button
                type="button"
                className="modal-close"
                aria-label="Fermer"
                onClick={() => setShowSettings(false)}
              >
                ×
              </button>
            </div>
            <p className="text-body modal-card-lead">
              Page {currentPage} sur {pageCount}. Les slides suivent{" "}
              {controllerName} tant que vous n&apos;avez pas la main.
            </p>

            <form className="form" onSubmit={submitName}>
              <div className="field">
                <span className="field-label">Votre nom</span>
                <input
                  type="text"
                  value={nameDraft}
                  onChange={(e) => {
                    setNameDraft(e.target.value);
                    setNameSaved(false);
                  }}
                  placeholder="ex: Camille"
                  maxLength={40}
                />
              </div>
              <button
                className="btn btn-primary btn-block"
                type="submit"
                disabled={nameDraft.trim() === myName.trim()}
              >
                {nameSaved ? "Enregistré ✓" : "Enregistrer"}
              </button>
            </form>
          </div>
        </div>
      )}

      <nav className="bottom-nav" aria-label="Navigation">
        <button
          type="button"
          className="bottom-nav-item"
          disabled={!isController || currentPage <= 1}
          onClick={onPrev}
        >
          <span aria-hidden>←</span>
          Précédent
        </button>
        <button
          type="button"
          className="bottom-nav-item"
          disabled={!isController || currentPage >= pageCount}
          onClick={onNext}
        >
          <span aria-hidden>→</span>
          Suivant
        </button>
        <button
          type="button"
          className={`bottom-nav-item ${showSettings ? "bottom-nav-item--active" : ""}`}
          onClick={() => setShowSettings((open) => !open)}
          aria-expanded={showSettings}
        >
          <span aria-hidden>⚙</span>
          Réglages
        </button>
      </nav>
    </div>
  );
}

import { useState } from "react";
import PdfViewer from "./PdfViewer";
import type { PresenceClient } from "@share-slides/shared";

type Props = {
  title: string;
  pdfUrl: string;
  currentPage: number;
  pageCount: number;
  connected: boolean;
  controllerName: string;
  isController: boolean;
  allowTakeControl: boolean;
  presence: PresenceClient[];
  onPrev: () => void;
  onNext: () => void;
  onTakeControl: () => void;
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
  title,
  pdfUrl,
  currentPage,
  pageCount,
  connected,
  controllerName,
  isController,
  allowTakeControl,
  presence,
  onPrev,
  onNext,
  onTakeControl,
}: Props) {
  const [tab, setTab] = useState<"slides" | "people" | "settings">("slides");
  const [showZoomHint, setShowZoomHint] = useState(true);

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

      {tab === "slides" && (
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
      )}

      {tab === "people" && (
        <main className="participant-panel">
          <h2 className="text-headline">Participants</h2>
          <p className="text-muted">{title}</p>
          <ul className="presence-list presence-list--panel">
            {presence.map((c) => (
              <li key={c.id}>
                <span>{c.name}</span>
                {c.isController && <span className="chip">Contrôle</span>}
              </li>
            ))}
          </ul>
        </main>
      )}

      {tab === "settings" && (
        <main className="participant-panel">
          <h2 className="text-headline">Réglages</h2>
          <p className="text-body">
            Page {currentPage} sur {pageCount}. Les slides suivent{" "}
            {controllerName} tant que vous n&apos;avez pas la main.
          </p>
        </main>
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
          className={`bottom-nav-item ${tab === "people" ? "bottom-nav-item--active" : ""}`}
          onClick={() => setTab("people")}
        >
          <IconUsers />
          Participants
        </button>
        <button
          type="button"
          className={`bottom-nav-item ${tab === "settings" ? "bottom-nav-item--active" : ""}`}
          onClick={() => setTab("settings")}
        >
          <span aria-hidden>⚙</span>
          Réglages
        </button>
      </nav>
    </div>
  );
}

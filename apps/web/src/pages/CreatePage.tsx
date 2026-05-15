import { FormEvent, useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MAX_PDF_BYTES } from "@share-slides/shared";
import AppShell from "../components/AppShell";
import SiteFooter from "../components/SiteFooter";
import { apiUrl } from "../config";
import { generateSessionPin, pinForApi } from "../utils/pin";

function IconUpload() {
  return (
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none" aria-hidden>
      <rect x="10" y="6" width="28" height="36" rx="4" fill="#e9edff" />
      <path
        d="M24 20v12M18 26l6-6 6 6"
        stroke="#4f46e5"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 38h20"
        stroke="#4f46e5"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconRefresh() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 12a9 9 0 11-2.64-6.36M21 3v6h-6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const MAX_MB = MAX_PDF_BYTES / (1024 * 1024);

export default function CreatePage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [pin, setPin] = useState(() => generateSessionPin());
  const [requireName, setRequireName] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickFile = useCallback((next: File | null) => {
    if (!next) {
      setFile(null);
      return;
    }
    if (next.type !== "application/pdf") {
      setError("Seuls les fichiers PDF sont acceptés.");
      return;
    }
    if (next.size > MAX_PDF_BYTES) {
      setError(`Fichier trop volumineux (max. ${MAX_MB} Mo).`);
      return;
    }
    setError(null);
    setFile(next);
  }, []);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) pickFile(dropped);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Ajoutez un fichier PDF pour continuer.");
      return;
    }

    setLoading(true);
    setError(null);

    const body = new FormData();
    body.append("pdf", file);
    if (title.trim()) body.append("title", title.trim());
    body.append("pin", pinForApi(pin));
    body.append("requireName", requireName ? "true" : "false");

    try {
      const res = await fetch(apiUrl("/api/rooms"), { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Impossible de créer la salle");

      sessionStorage.setItem(`presenter:${data.roomId}`, data.presenterToken);
      navigate(`/j/${data.roomId}?t=${data.presenterToken}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell showFooter footer={<SiteFooter />}>
      <div className="create-page">
        <div className="session-card">
          <header className="session-card-header">
            <h1 className="text-headline">Nouvelle session</h1>
            <p className="text-body session-subtitle">
              Préparez votre espace de présentation en quelques secondes.
            </p>
          </header>

          <form className="session-form" onSubmit={onSubmit}>
            <div
              className={`dropzone ${dragOver ? "dropzone--over" : ""} ${file ? "dropzone--filled" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  inputRef.current?.click();
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Déposer ou choisir un PDF"
            >
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                className="dropzone-input"
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              />
              <IconUpload />
              {file ? (
                <>
                  <p className="dropzone-title">{file.name}</p>
                  <p className="dropzone-hint">
                    {(file.size / (1024 * 1024)).toFixed(1)} Mo — cliquez pour
                    remplacer
                  </p>
                </>
              ) : (
                <>
                  <p className="dropzone-title">Déposez votre PDF ici</p>
                  <p className="dropzone-hint">
                    Glissez votre fichier ou cliquez pour parcourir vos dossiers
                    locaux (Max {MAX_MB} Mo)
                  </p>
                </>
              )}
            </div>

            <div className="field">
              <span className="field-label">Titre de la session (optionnel)</span>
              <input
                type="text"
                placeholder="ex: Réunion Stratégique Q3"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={80}
              />
            </div>

            <div className="field">
              <span className="field-label">PIN de session</span>
              <div className="pin-field">
                <input
                  type="text"
                  className="pin-input"
                  value={pin}
                  readOnly
                  aria-readonly
                  aria-label="PIN de session"
                />
                <button
                  type="button"
                  className="pin-refresh"
                  onClick={() => setPin(generateSessionPin())}
                  aria-label="Générer un nouveau PIN"
                >
                  <IconRefresh />
                </button>
              </div>
            </div>

            <label className="toggle">
              <input
                type="checkbox"
                checked={requireName}
                onChange={(e) => setRequireName(e.target.checked)}
              />
              Exiger un nom à la connexion des participants
            </label>

            {error && <p className="form-error">{error}</p>}

            <button
              className="btn btn-primary btn-block"
              type="submit"
              disabled={loading}
            >
              {loading ? "Création…" : "Créer la salle →"}
            </button>

            <p className="legal-note">
              En créant cette salle, vous acceptez nos{" "}
              <a href="#terms">conditions d&apos;utilisation</a>.
            </p>
          </form>
        </div>
      </div>
    </AppShell>
  );
}

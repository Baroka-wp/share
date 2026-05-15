import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import JoinFooter from "../components/JoinFooter";
import PinInput from "../components/PinInput";
import { apiUrl } from "../config";

function IconSession() {
  return (
    <div className="join-icon" aria-hidden>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3v12M8 11l4 4 4-4M5 19h14"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function IconQr() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 14h2v2h-2zM18 14h3v3h-3zM14 18h2v3h-2zM18 18v3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export default function JoinPage() {
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (pin.length < 6) {
      setError(true);
      setMessage("Entrez les 6 chiffres du code.");
      return;
    }

    setLoading(true);
    setError(false);
    setMessage(null);

    try {
      const res = await fetch(apiUrl("/api/rooms/join-by-pin"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(true);
        setMessage("Session introuvable, vérifiez le code");
        return;
      }
      sessionStorage.setItem(`pin:${data.roomId}`, pin);
      navigate(`/j/${data.roomId}`);
    } catch {
      setError(true);
      setMessage("Session introuvable, vérifiez le code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell showFooter footer={<JoinFooter />}>
      <div className="join-page">
        <div className="join-hero">
          <IconSession />
          <h1 className="text-headline">Rejoindre une session</h1>
          <p className="text-body join-subtitle">
            Entrez le code à 6 chiffres pour commencer
          </p>
        </div>

        <form className="join-form" onSubmit={onSubmit}>
          <div className="field">
            <span className="field-label">PIN de session</span>
            <PinInput
              value={pin}
              onChange={(v) => {
                setPin(v);
                setError(false);
                setMessage(null);
              }}
              error={error}
              disabled={loading}
              autoFocus
            />
            {message && (
              <p className="pin-error-msg" role="alert">
                <span className="pin-error-icon" aria-hidden>
                  !
                </span>
                {message}
              </p>
            )}
          </div>

          <button
            className="btn btn-primary btn-block"
            type="submit"
            disabled={loading || pin.length < 6}
          >
            Rejoindre la présentation →
          </button>

          <div className="join-divider">
            <span>OU</span>
          </div>

          <p className="join-qr-link">
            <IconQr />
            <span>Scannez le QR code affiché par le présentateur</span>
          </p>
        </form>

        <article className="promo-card">
          <div className="promo-card-image" role="img" aria-label="Audience en conférence" />
          <p className="promo-card-text">
            Prêt pour votre événement ? Connectez-vous et interagissez en direct.
          </p>
        </article>
      </div>
    </AppShell>
  );
}

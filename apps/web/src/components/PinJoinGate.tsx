import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "./AppShell";
import PinInput from "./PinInput";
import { apiUrl } from "../config";

type Props = {
  roomId: string;
  title: string;
  onSuccess: (pin: string) => void;
};

export default function PinJoinGate({ roomId, title, onSuccess }: Props) {
  const stored = sessionStorage.getItem(`pin:${roomId}`) ?? "";
  const [pin, setPin] = useState(stored);
  const [error, setError] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (stored.length >= 6) {
      void verify(stored);
    }
  }, []);

  async function verify(code: string) {
    setLoading(true);
    setError(false);
    setMessage(null);
    try {
      const res = await fetch(apiUrl(`/api/rooms/${roomId}/verify-pin`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: code }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(true);
        setMessage("Session introuvable, vérifiez le code");
        return;
      }
      sessionStorage.setItem(`pin:${roomId}`, code);
      sessionStorage.setItem(`role:${roomId}`, "viewer");
      onSuccess(code);
    } catch {
      setError(true);
      setMessage("Session introuvable, vérifiez le code");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (pin.length < 6) {
      setError(true);
      setMessage("Entrez les 6 chiffres du code.");
      return;
    }
    void verify(pin);
  }

  return (
    <AppShell>
      <div className="join-page join-page--compact">
        <div className="join-hero">
          <h1 className="text-headline">Rejoindre {title}</h1>
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

          <p className="join-alt">
            <Link to="/join">Utiliser un autre code</Link>
          </p>
        </form>
      </div>
    </AppShell>
  );
}

import { FormEvent, useState } from "react";
import AppShell from "./AppShell";

type Props = {
  roomId: string;
  title: string;
  requireName: boolean;
  onSubmit: (name: string) => void;
};

function IconUser() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="4" stroke="white" strokeWidth="1.75" />
      <path
        d="M4 20c1.5-4 6-5 8-5s6.5 1 8 5"
        stroke="white"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function NameGate({ roomId, title, requireName, onSubmit }: Props) {
  const stored = sessionStorage.getItem(`name:${roomId}`) ?? "";
  const [name, setName] = useState(stored);
  const [error, setError] = useState<string | null>(null);

  function submit(value: string) {
    const trimmed = value.trim();
    if (requireName && !trimmed) {
      setError("Le présentateur demande un nom pour rejoindre.");
      return;
    }
    if (trimmed) sessionStorage.setItem(`name:${roomId}`, trimmed);
    onSubmit(trimmed);
  }

  function onFormSubmit(e: FormEvent) {
    e.preventDefault();
    submit(name);
  }

  return (
    <AppShell>
      <div className="join-page join-page--compact">
        <div className="join-hero">
          <div className="join-icon" aria-hidden>
            <IconUser />
          </div>
          <h1 className="text-headline">Comment vous appelez-vous ?</h1>
          <p className="text-body join-subtitle">
            {title ? <>Vous rejoignez <strong>{title}</strong>.</> : null} Votre nom
            apparaît dans la liste des participants.
          </p>
        </div>

        <form className="join-form" onSubmit={onFormSubmit}>
          <div className="field">
            <span className="field-label">Votre nom</span>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="ex: Camille"
              maxLength={40}
              autoFocus
            />
            {error && <p className="form-error">{error}</p>}
          </div>

          <button
            className="btn btn-primary btn-block"
            type="submit"
            disabled={requireName && !name.trim()}
          >
            Continuer →
          </button>

          {!requireName && (
            <button
              type="button"
              className="btn btn-ghost btn-block"
              onClick={() => submit("")}
            >
              Continuer en anonyme
            </button>
          )}
        </form>
      </div>
    </AppShell>
  );
}

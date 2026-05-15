import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiUrl } from "../config";

export default function CreatePage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Choose a PDF file");
      return;
    }

    setLoading(true);
    setError(null);

    const body = new FormData();
    body.append("pdf", file);
    if (title.trim()) body.append("title", title.trim());
    if (pin.trim()) body.append("pin", pin.trim());

    try {
      const res = await fetch(apiUrl("/api/rooms"), { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create room");

      sessionStorage.setItem(`presenter:${data.roomId}`, data.presenterToken);
      navigate(`/j/${data.roomId}?t=${data.presenterToken}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page narrow">
      <Link className="back" to="/">
        ← Back
      </Link>
      <h1>New presentation</h1>
      <p className="lead">Upload a PDF to generate a shareable room and QR code.</p>

      <form className="card form" onSubmit={onSubmit}>
        <label>
          PDF file
          <input
            type="file"
            accept="application/pdf"
            required
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <label>
          Title (optional)
          <input
            type="text"
            placeholder="My talk"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
          />
        </label>
        <label>
          Room PIN (optional)
          <input
            type="text"
            placeholder="e.g. 4821"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            maxLength={12}
            autoComplete="off"
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Creating…" : "Create room"}
        </button>
      </form>
    </div>
  );
}

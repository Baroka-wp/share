import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import PdfViewer from "../components/PdfViewer";
import { apiUrl, joinUrl } from "../config";
import { useRoomSocket } from "../hooks/useRoomSocket";

export default function RoomPage() {
  const { roomId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get("t");
  const storedToken = sessionStorage.getItem(`presenter:${roomId}`);
  const presenterToken = tokenFromUrl ?? storedToken;

  const [roomMeta, setRoomMeta] = useState<{
    hasPin: boolean;
    title: string;
    pageCount: number;
  } | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [pinOk, setPinOk] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [checkingRoom, setCheckingRoom] = useState(true);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (presenterToken) {
      sessionStorage.setItem(`presenter:${roomId}`, presenterToken);
    }
  }, [presenterToken, roomId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(apiUrl(`/api/rooms/${roomId}`));
        const text = await res.text();
        let data: {
          room?: { hasPin: boolean; title: string; pageCount: number };
          error?: string;
        };
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(
            res.status === 429
              ? "Too many requests — wait a moment and refresh"
              : "Server unavailable",
          );
        }
        if (!res.ok) throw new Error(data.error ?? "Room not found");
        if (!data.room) throw new Error("Room not found");
        if (cancelled) return;
        setRoomMeta({
          hasPin: data.room.hasPin,
          title: data.room.title,
          pageCount: data.room.pageCount,
        });
        if (!data.room.hasPin || presenterToken) setPinOk(true);
      } catch (err) {
        if (!cancelled) setPinError(err instanceof Error ? err.message : "Room not found");
      } finally {
        if (!cancelled) setCheckingRoom(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roomId, presenterToken]);

  async function verifyPin(e: FormEvent) {
    e.preventDefault();
    setPinError(null);
    const res = await fetch(apiUrl(`/api/rooms/${roomId}/verify-pin`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: pinInput }),
    });
    const data = await res.json();
    if (data.ok) {
      setPinOk(true);
    } else {
      setPinError("Wrong PIN");
    }
  }

  const isPresenter = Boolean(presenterToken);
  const enabled = pinOk && !checkingRoom;

  const socket = useRoomSocket({
    roomId,
    presenterToken: isPresenter ? presenterToken : null,
    pin: roomMeta?.hasPin && !isPresenter ? pinInput : null,
    name: displayName || undefined,
    enabled,
  });

  const pdfUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (isPresenter && presenterToken) params.set("t", presenterToken);
    else if (pinInput) params.set("pin", pinInput);
    const qs = params.toString();
    return apiUrl(`/api/rooms/${roomId}/pdf${qs ? `?${qs}` : ""}`);
  }, [roomId, isPresenter, presenterToken, pinInput]);

  const shareUrl = joinUrl(roomId);
  const pageCount = socket.room?.pageCount ?? roomMeta?.pageCount ?? 1;

  function prev() {
    socket.goToPage(Math.max(1, socket.currentPage - 1));
  }

  function next() {
    socket.goToPage(Math.min(pageCount, socket.currentPage + 1));
  }

  useEffect(() => {
    if (!socket.isController) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        socket.goToPage(Math.min(pageCount, socket.currentPage + 1));
      }
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        socket.goToPage(Math.max(1, socket.currentPage - 1));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [socket.isController, socket.currentPage, pageCount, socket.goToPage]);

  if (checkingRoom) {
    return (
      <div className="room-loading">
        <p>Loading room…</p>
      </div>
    );
  }

  if (pinError && !roomMeta) {
    return (
      <div className="page narrow">
        <p className="form-error">{pinError}</p>
        <Link to="/">Go home</Link>
      </div>
    );
  }

  if (roomMeta?.hasPin && !pinOk && !isPresenter) {
    return (
      <div className="page narrow">
        <h1>Join {roomMeta.title}</h1>
        <form className="card form" onSubmit={verifyPin}>
          <label>
            Room PIN
            <input
              type="password"
              inputMode="numeric"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              required
              autoFocus
            />
          </label>
          {pinError && <p className="form-error">{pinError}</p>}
          <button className="btn btn-primary" type="submit">
            Join
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="room">
      <header className="room-bar">
        <div className="room-bar-left">
          <strong>{socket.room?.title ?? roomMeta?.title}</strong>
          <span className="badge">
            {socket.connected ? "Live" : "Connecting…"}
          </span>
          {!socket.isController && (
            <span className="muted">
              Following {socket.controllerName}
            </span>
          )}
        </div>
        <div className="room-bar-right">
          <span className="page-indicator">
            {socket.currentPage} / {pageCount}
          </span>
          {isPresenter && (
            <label className="toggle">
              <input
                type="checkbox"
                checked={socket.room?.allowTakeControl ?? true}
                onChange={(e) =>
                  socket.send({
                    type: "SET_ALLOW_TAKE_CONTROL",
                    allow: e.target.checked,
                  })
                }
              />
              Allow take control
            </label>
          )}
          {!socket.isController && (socket.room?.allowTakeControl || isPresenter) && (
            <button
              className="btn btn-secondary btn-sm"
              type="button"
              onClick={() => socket.send({ type: "REQUEST_CONTROL" })}
            >
              Take control
            </button>
          )}
          {socket.isController && socket.role !== "presenter" && (
            <button
              className="btn btn-secondary btn-sm"
              type="button"
              onClick={() => socket.send({ type: "RELEASE_CONTROL" })}
            >
              Release control
            </button>
          )}
        </div>
      </header>

      <main className="room-main">
        <PdfViewer url={pdfUrl} page={socket.currentPage} />
      </main>

      <footer className="room-footer">
        <div className="nav-controls">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={!socket.isController || socket.currentPage <= 1}
            onClick={prev}
          >
            ← Previous
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!socket.isController || socket.currentPage >= pageCount}
            onClick={next}
          >
            Next →
          </button>
        </div>

        {isPresenter && (
          <aside className="presenter-panel">
            <h3>Share with audience</h3>
            <QRCodeSVG value={shareUrl} size={160} level="M" includeMargin />
            <p className="share-url">
              <a href={shareUrl} target="_blank" rel="noreferrer">
                {shareUrl}
              </a>
            </p>
            <p className="hint">
              QR code has no presenter secret — only participants should scan it.
            </p>
            <details>
              <summary>People in room ({socket.presence.length})</summary>
              <ul className="presence-list">
                {socket.presence.map((c) => (
                  <li key={c.id}>
                    {c.name}
                    {c.isController ? " · controlling" : ""}
                  </li>
                ))}
              </ul>
            </details>
          </aside>
        )}
      </footer>

      {(socket.error || pinError) && (
        <p className="toast form-error">{socket.error ?? pinError}</p>
      )}
    </div>
  );
}

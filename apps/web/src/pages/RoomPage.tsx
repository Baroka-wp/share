import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import ParticipantView from "../components/ParticipantView";
import PresenterView from "../components/PresenterView";
import PinJoinGate from "../components/PinJoinGate";
import { apiUrl, joinUrl } from "../config";
import { useRoomSocket } from "../hooks/useRoomSocket";

export default function RoomPage() {
  const { roomId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get("t");
  const storedToken = sessionStorage.getItem(`presenter:${roomId}`);
  const presenterToken = tokenFromUrl ?? storedToken;
  const storedPin = sessionStorage.getItem(`pin:${roomId}`) ?? "";

  const [roomMeta, setRoomMeta] = useState<{
    hasPin: boolean;
    title: string;
    pageCount: number;
  } | null>(null);
  const [pinInput, setPinInput] = useState(storedPin);
  const [pinOk, setPinOk] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [checkingRoom, setCheckingRoom] = useState(true);

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
              ? "Trop de requêtes — patientez puis réessayez"
              : "Serveur indisponible",
          );
        }
        if (!res.ok) throw new Error(data.error ?? "Session introuvable");
        if (!data.room) throw new Error("Session introuvable");
        if (cancelled) return;
        setRoomMeta({
          hasPin: data.room.hasPin,
          title: data.room.title,
          pageCount: data.room.pageCount,
        });
        if (!data.room.hasPin || presenterToken) setPinOk(true);
        else if (storedPin.length >= 6) {
          const verifyRes = await fetch(apiUrl(`/api/rooms/${roomId}/verify-pin`), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pin: storedPin }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.ok) setPinOk(true);
        }
      } catch (err) {
        if (!cancelled) {
          setPinError(err instanceof Error ? err.message : "Session introuvable");
        }
      } finally {
        if (!cancelled) setCheckingRoom(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roomId, presenterToken, storedPin]);

  const isPresenter = Boolean(presenterToken);
  const enabled = pinOk && !checkingRoom;

  const socket = useRoomSocket({
    roomId,
    presenterToken: isPresenter ? presenterToken : null,
    pin: roomMeta?.hasPin && !isPresenter ? pinInput : null,
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

  if (checkingRoom) {
    return (
      <div className="room-loading">
        <p>Chargement de la session…</p>
      </div>
    );
  }

  if (pinError && !roomMeta) {
    return (
      <div className="page narrow page-center">
        <p className="form-error">{pinError}</p>
        <Link className="btn btn-secondary" to="/join">
          Rejoindre une session
        </Link>
      </div>
    );
  }

  if (roomMeta?.hasPin && !pinOk && !isPresenter) {
    return (
      <PinJoinGate
        roomId={roomId}
        title={roomMeta.title}
        onSuccess={(pin) => {
          setPinInput(pin);
          setPinOk(true);
        }}
      />
    );
  }

  if (!isPresenter) {
    return (
      <>
        <ParticipantView
          title={socket.room?.title ?? roomMeta?.title ?? ""}
          pdfUrl={pdfUrl}
          currentPage={socket.currentPage}
          pageCount={pageCount}
          connected={socket.connected}
          controllerName={socket.controllerName}
          isController={socket.isController}
          allowTakeControl={socket.room?.allowTakeControl ?? true}
          presence={socket.presence}
          onPrev={() => socket.goToPage(Math.max(1, socket.currentPage - 1))}
          onNext={() =>
            socket.goToPage(Math.min(pageCount, socket.currentPage + 1))
          }
          onTakeControl={() => socket.send({ type: "REQUEST_CONTROL" })}
        />
        {socket.error && <p className="toast form-error">{socket.error}</p>}
      </>
    );
  }

  return (
    <>
      <PresenterView
        title={socket.room?.title ?? roomMeta?.title ?? ""}
        pdfUrl={pdfUrl}
        currentPage={socket.currentPage}
        pageCount={pageCount}
        connected={socket.connected}
        shareUrl={shareUrl}
        presence={socket.presence}
        clientId={socket.clientId}
        allowTakeControl={socket.room?.allowTakeControl ?? true}
        isController={socket.isController}
        onToggleAllowTakeControl={(allow) =>
          socket.send({ type: "SET_ALLOW_TAKE_CONTROL", allow })
        }
        onPrev={() => socket.goToPage(Math.max(1, socket.currentPage - 1))}
        onNext={() =>
          socket.goToPage(Math.min(pageCount, socket.currentPage + 1))
        }
      />
      {socket.error && <p className="toast form-error">{socket.error}</p>}
    </>
  );
}
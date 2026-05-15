import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import ParticipantView from "../components/ParticipantView";
import PresenterView from "../components/PresenterView";
import PinJoinGate from "../components/PinJoinGate";
import NameGate from "../components/NameGate";
import { apiUrl, joinUrl } from "../config";
import { useRoomSocket } from "../hooks/useRoomSocket";

export default function RoomPage() {
  const { roomId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get("t");
  const pinFromUrl = (searchParams.get("pin") ?? "").replace(/\D/g, "");
  const storedRole = sessionStorage.getItem(`role:${roomId}`);
  const storedToken = sessionStorage.getItem(`presenter:${roomId}`);
  // The presenter token is only honored when it comes from the URL
  // (presenter link) or when the stored role for this room is explicitly
  // "presenter". Otherwise a user who happens to have an old token in
  // sessionStorage but joined via PIN must stay a viewer.
  const presenterToken =
    tokenFromUrl ?? (storedRole === "presenter" ? storedToken : null);
  const storedPin = sessionStorage.getItem(`pin:${roomId}`) ?? "";
  const initialPin = pinFromUrl || storedPin;
  const storedName = sessionStorage.getItem(`name:${roomId}`) ?? "";

  const [roomMeta, setRoomMeta] = useState<{
    hasPin: boolean;
    title: string;
    pageCount: number;
    requireName: boolean;
  } | null>(null);
  const [pinInput, setPinInput] = useState(initialPin);
  const [pinOk, setPinOk] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [checkingRoom, setCheckingRoom] = useState(true);
  const [name, setName] = useState(storedName);
  const [nameStepDone, setNameStepDone] = useState(Boolean(storedName));

  useEffect(() => {
    if (tokenFromUrl) {
      sessionStorage.setItem(`presenter:${roomId}`, tokenFromUrl);
      sessionStorage.setItem(`role:${roomId}`, "presenter");
    }
  }, [tokenFromUrl, roomId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(apiUrl(`/api/rooms/${roomId}`));
        const text = await res.text();
        let data: {
          room?: {
            hasPin: boolean;
            title: string;
            pageCount: number;
            requireName?: boolean;
          };
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
          requireName: Boolean(data.room.requireName),
        });
        if (!data.room.hasPin || presenterToken) setPinOk(true);
        else if (initialPin.length >= 6) {
          const verifyRes = await fetch(apiUrl(`/api/rooms/${roomId}/verify-pin`), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pin: initialPin }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.ok) {
            setPinOk(true);
            sessionStorage.setItem(`pin:${roomId}`, initialPin);
            if (storedRole !== "presenter") {
              sessionStorage.setItem(`role:${roomId}`, "viewer");
            }
          }
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
  }, [roomId, presenterToken, initialPin, storedRole]);

  const isPresenter = Boolean(presenterToken);
  const needsNameStep = !isPresenter && pinOk && !nameStepDone;
  const enabled = pinOk && !checkingRoom && (isPresenter || nameStepDone);

  const socket = useRoomSocket({
    roomId,
    presenterToken: isPresenter ? presenterToken : null,
    pin: roomMeta?.hasPin && !isPresenter ? pinInput : null,
    name: isPresenter ? undefined : name || undefined,
    enabled,
  });

  const pdfUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (isPresenter && presenterToken) params.set("t", presenterToken);
    else if (pinInput) params.set("pin", pinInput);
    const qs = params.toString();
    return apiUrl(`/api/rooms/${roomId}/pdf${qs ? `?${qs}` : ""}`);
  }, [roomId, isPresenter, presenterToken, pinInput]);

  const shareUrl = joinUrl(roomId, socket.presenterPin);
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

  if (needsNameStep && roomMeta) {
    return (
      <NameGate
        roomId={roomId}
        title={roomMeta.title}
        requireName={roomMeta.requireName}
        onSubmit={(submitted) => {
          setName(submitted);
          setNameStepDone(true);
        }}
      />
    );
  }

  if (!isPresenter) {
    const myFromPresence = socket.presence.find((p) => p.id === socket.clientId);
    const myName = myFromPresence?.name ?? name ?? "";
    return (
      <>
        <ParticipantView
          pdfUrl={pdfUrl}
          currentPage={socket.currentPage}
          pageCount={pageCount}
          connected={socket.connected}
          controllerName={socket.controllerName}
          isController={socket.isController}
          allowTakeControl={socket.room?.allowTakeControl ?? false}
          presence={socket.presence}
          myName={myName}
          onPrev={() => socket.goToPage(Math.max(1, socket.currentPage - 1))}
          onNext={() =>
            socket.goToPage(Math.min(pageCount, socket.currentPage + 1))
          }
          onTakeControl={() => socket.send({ type: "REQUEST_CONTROL" })}
          onChangeName={(next) => {
            const trimmed = next.trim();
            if (!trimmed) return;
            setName(trimmed);
            sessionStorage.setItem(`name:${roomId}`, trimmed);
            socket.send({ type: "SET_NAME", name: trimmed });
          }}
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
        pin={socket.presenterPin}
        presence={socket.presence}
        clientId={socket.clientId}
        allowTakeControl={socket.room?.allowTakeControl ?? false}
        requireName={socket.room?.requireName ?? roomMeta?.requireName ?? false}
        isController={socket.isController}
        onToggleAllowTakeControl={(allow) =>
          socket.send({ type: "SET_ALLOW_TAKE_CONTROL", allow })
        }
        onToggleRequireName={(require) =>
          socket.send({ type: "SET_REQUIRE_NAME", require })
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
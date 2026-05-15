import { useEffect, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

function isRenderCancelled(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const name = "name" in err ? String((err as { name: string }).name) : "";
  return name === "RenderingCancelledException" || name === "AbortException";
}

type Props = {
  url: string;
  page: number;
  className?: string;
};

export default function PdfViewer({ url, page, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const docRef = useRef<pdfjs.PDFDocumentProxy | null>(null);
  const renderTaskRef = useRef<pdfjs.RenderTask | null>(null);
  const [docReady, setDocReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDocReady(false);
    setErr(null);

    (async () => {
      try {
        docRef.current?.destroy();
        docRef.current = null;

        const doc = await pdfjs.getDocument({ url, withCredentials: true }).promise;
        if (cancelled) {
          await doc.destroy();
          return;
        }
        docRef.current = doc;
        setDocReady(true);
      } catch (e) {
        if (cancelled) return;
        console.error("PDF load error:", e);
        setErr("Could not load PDF");
      }
    })();

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
      renderTaskRef.current = null;
      docRef.current?.destroy();
      docRef.current = null;
    };
  }, [url]);

  useEffect(() => {
    if (!docReady) return;

    const doc = docRef.current;
    const canvas = canvasRef.current;
    if (!doc || !canvas) return;

    let cancelled = false;

    const cancelRender = () => {
      renderTaskRef.current?.cancel();
      renderTaskRef.current = null;
    };

    (async () => {
      try {
        cancelRender();

        const pageIndex = Math.max(1, Math.min(doc.numPages, page));
        const pdfPage = await doc.getPage(pageIndex);
        if (cancelled) return;

        const base = pdfPage.getViewport({ scale: 1 });
        const container = canvas.parentElement;
        const maxWidth = Math.max(container?.clientWidth ?? 0, 320);
        const scale = Math.max(maxWidth / base.width, 0.25);
        const viewport = pdfPage.getViewport({ scale });

        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas unavailable");

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        const task = pdfPage.render({ canvasContext: ctx, viewport });
        renderTaskRef.current = task;
        await task.promise;

        if (!cancelled) setErr(null);
      } catch (e) {
        if (cancelled || isRenderCancelled(e)) return;
        console.error("PDF render error:", e);
        setErr("Could not render page");
      }
    })();

    return () => {
      cancelled = true;
      cancelRender();
    };
  }, [docReady, page]);

  if (err) {
    return <div className="pdf-error">{err}</div>;
  }

  return (
    <div className={`pdf-viewer ${className ?? ""}`}>
      {!docReady && <p className="pdf-loading">Loading presentation…</p>}
      <canvas ref={canvasRef} className={!docReady ? "hidden" : ""} />
    </div>
  );
}

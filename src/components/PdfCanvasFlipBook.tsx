import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { getDocument } from "pdfjs-dist";
import "../lib/configurePdfWorker";

function toAbsolutePdfUrl(pdfUrl: string): string {
  if (typeof window === "undefined") return pdfUrl;
  if (pdfUrl.startsWith("http://") || pdfUrl.startsWith("https://") || pdfUrl.startsWith("blob:")) return pdfUrl;
  return new URL(pdfUrl, window.location.href).toString();
}

type Props = {
  pdfUrl: string;
  page: number;
  maxWidth: number;
  onLoadSuccess: (numPages: number) => void;
  onLoadError: (message: string) => void;
  className?: string;
};

/**
 * Renders one PDF page to canvas (pdf.js). Canvas is always mounted so paint effects never see a null ref.
 */
export default function PdfCanvasFlipBook({ pdfUrl, page, maxWidth, onLoadSuccess, onLoadError, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadHint, setLoadHint] = useState("");

  useEffect(() => {
    let cancelled = false;
    let loaded: PDFDocumentProxy | null = null;
    setPdfDoc(null);
    setLoading(true);
    setLoadHint("");

    const absUrl = toAbsolutePdfUrl(pdfUrl);
    const publicHint = pdfUrl.startsWith("/") ? `请将 PDF 放到 public 目录对应路径：public${pdfUrl}` : "";

    const run = async () => {
      let bytes: Uint8Array;
      try {
        const res = await fetch(absUrl, { credentials: "same-origin" });
        if (!res.ok) {
          throw new Error(
            res.status === 404
              ? `未找到 PDF 文件（404）。${publicHint || "请检查 pdfUrl 与服务器静态资源路径。"}`
              : `无法下载 PDF（HTTP ${res.status}）。`,
          );
        }
        bytes = new Uint8Array(await res.arrayBuffer());
      } catch (e) {
        if (cancelled) return;
        onLoadError(e instanceof Error ? e.message : String(e));
        setLoading(false);
        return;
      }

      const loadWithTimeout = async (disableWorker: boolean, timeoutMs: number) => {
        const params: Record<string, unknown> = {
          data: bytes,
          disableRange: true,
          disableStream: true,
          disableWorker,
        };
        const task = getDocument(params as Parameters<typeof getDocument>[0]);

        let timeoutId: number | null = null;
        try {
          const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = window.setTimeout(() => {
              try {
                task.destroy();
              } catch {
                // ignore
              }
              reject(new Error(`PDF 加载超时（>${Math.round(timeoutMs / 1000)}s）`));
            }, timeoutMs);
          });
          const pdf = (await Promise.race([task.promise, timeoutPromise])) as PDFDocumentProxy;
          return pdf;
        } finally {
          if (timeoutId !== null) window.clearTimeout(timeoutId);
        }
      };

      const finish = (pdf: PDFDocumentProxy, hint?: string) => {
        if (cancelled) {
          pdf.destroy?.();
          return;
        }
        loaded = pdf;
        setPdfDoc(pdf);
        onLoadSuccess(pdf.numPages);
        setLoading(false);
        if (hint) setLoadHint(hint);
      };

      const fail = (e: unknown) => {
        if (cancelled) return;
        onLoadError(e instanceof Error ? e.message : String(e));
        setLoading(false);
      };

      try {
        const pdf = await loadWithTimeout(false, 12000);
        finish(pdf);
      } catch (e) {
        if (cancelled) return;
        try {
          const pdf = await loadWithTimeout(true, 15000);
          finish(pdf, "（已启用兼容模式加载）");
        } catch (fallbackErr) {
          fail(fallbackErr instanceof Error ? fallbackErr : e);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
      loaded?.destroy?.();
      loaded = null;
    };
  }, [pdfUrl, onLoadSuccess, onLoadError]);

  useEffect(() => {
    const pdf = pdfDoc;
    const canvas = canvasRef.current;
    if (!pdf || !canvas) return;
    const safePage = Math.min(Math.max(1, page), pdf.numPages);
    const wMax = Math.max(120, maxWidth);
    let cancelled = false;
    (async () => {
      try {
        const pdfPage = await pdf.getPage(safePage);
        const base = pdfPage.getViewport({ scale: 1 });
        const scale = Math.min(Math.max(wMax / base.width, 0.2), 3);
        const viewport = pdfPage.getViewport({ scale });
        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx || cancelled) return;
        const dpr = Math.min(2.5, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
        const w = Math.floor(viewport.width);
        const h = Math.floor(viewport.height);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        canvas.style.display = "block";
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        ctx.fillStyle = "#faf8f5";
        ctx.fillRect(0, 0, w, h);
        await pdfPage.render({ canvasContext: ctx, viewport, canvas }).promise;
      } catch (e) {
        if (!cancelled) onLoadError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pdfDoc, page, maxWidth, onLoadError]);

  return (
    <div className={`relative ${className ?? ""}`}>
      {loading ? (
        <div className="absolute inset-0 z-10 flex min-h-[320px] items-center justify-center rounded-lg bg-[#faf8f5]/95 text-sm text-neutral-600">
          正在加载 PDF…
        </div>
      ) : null}
      {loadHint ? <p className="absolute bottom-1 left-0 right-0 z-10 text-center text-[10px] text-neutral-500">{loadHint}</p> : null}
      <div className="flex justify-center py-2">
        <canvas ref={canvasRef} className="max-w-full rounded-md shadow-md" style={{ background: "#faf8f5" }} />
      </div>
    </div>
  );
}

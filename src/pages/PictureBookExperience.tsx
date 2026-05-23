import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, Hand, Sparkles } from "lucide-react";
import { useI18n } from "../i18n";
import { useScrollRestore } from "../hooks/useScrollRestore";
import { useGesturePageTurn } from "../hooks/useGesturePageTurn";
import PdfCanvasFlipBook from "../components/PdfCanvasFlipBook";

type CluesFile = {
  pdfUrl: string;
  bookTitle: { zh: string; en: string };
  intro: { zh: string; en: string };
  pageNotes: Array<{ fromPage: number; toPage: number; zh: string; en: string }>;
  riddles: Array<{
    id: string;
    showFromPage: number;
    promptZh: string;
    promptEn: string;
    accept: string[];
    hintZh: string;
    hintEn: string;
  }>;
};

function normalizeAnswer(s: string) {
  return s.trim().replace(/\s+/g, "");
}

const BOOK_SLUG = "socks-detective";

type WorksNavState = {
  worksCarouselPage?: number;
  worksCategory?: string;
};

export default function PictureBookExperience() {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams<{ slug: string }>();
  useScrollRestore();
  const { lang } = useI18n();
  const isEn = lang === "en";

  useEffect(() => {
    if (slug && slug !== BOOK_SLUG) {
      navigate(slug ? `/works/${slug}` : "/", { replace: true });
    }
  }, [slug, navigate]);

  const [clues, setClues] = useState<CluesFile | null>(null);
  const [cluesErr, setCluesErr] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [pageTurn, setPageTurn] = useState<{ id: number; dir: "next" | "prev" } | null>(null);
  const [gestureOn, setGestureOn] = useState(false);
  const [solved, setSolved] = useState<Record<string, boolean>>({});
  const [riddleInputs, setRiddleInputs] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [pdfLoadErr, setPdfLoadErr] = useState<string | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [pageWidth, setPageWidth] = useState(() =>
    typeof window !== "undefined" ? Math.max(320, Math.min(720, Math.floor(window.innerWidth * 0.48))) : 560,
  );
  const touchRef = useRef<{ x: number; t: number } | null>(null);

  const pdfUrl = clues?.pdfUrl ?? "/works/socks-detective/book.pdf";

  const onPdfLoadSuccess = useCallback((n: number) => {
    setNumPages(n);
    setPdfLoadErr(null);
  }, []);

  const onPdfLoadError = useCallback((msg: string) => {
    setPdfLoadErr(msg);
    setNumPages(0);
  }, []);

  const retryCamera = useCallback(() => {
    setGestureOn(false);
    window.setTimeout(() => setGestureOn(true), 120);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/works/socks-detective/clues.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: CluesFile | null) => {
        if (cancelled) return;
        if (data?.pdfUrl) setClues(data);
        else setCluesErr("clues");
      })
      .catch(() => {
        if (!cancelled) setCluesErr("clues");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = Math.max(260, Math.min(780, Math.floor(el.clientWidth - 32)));
      setPageWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const goPrev = useCallback(() => {
    setPageTurn((t) => ({ id: (t?.id ?? 0) + 1, dir: "prev" }));
    setPage((p) => Math.max(1, p - 1));
  }, []);

  const goNext = useCallback(() => {
    setPageTurn((t) => ({ id: (t?.id ?? 0) + 1, dir: "next" }));
    setPage((p) => (numPages ? Math.min(numPages, p + 1) : p + 1));
  }, [numPages]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  const { ready: gestureReady, error: gestureError } = useGesturePageTurn({
    enabled: gestureOn,
    videoRef,
    onNext: goNext,
    onPrev: goPrev,
  });

  const activeNotes = useMemo(() => {
    if (!clues) return [];
    return clues.pageNotes.filter((n) => page >= n.fromPage && page <= n.toPage);
  }, [clues, page]);

  const visibleRiddles = useMemo(() => {
    if (!clues) return [];
    return clues.riddles.filter((r) => page >= r.showFromPage);
  }, [clues, page]);

  const bookTitle = clues ? (isEn ? clues.bookTitle.en : clues.bookTitle.zh) : isEn ? "Picture book" : "互动绘本";
  const introLine = clues ? (isEn ? clues.intro.en : clues.intro.zh) : "";

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  const trySolve = (id: string, raw: string, accept: string[]) => {
    const n = normalizeAnswer(raw);
    if (!n) return;
    const ok = accept.some((a) => normalizeAnswer(a) === n);
    if (ok) {
      setSolved((s) => ({ ...s, [id]: true }));
      showToast(isEn ? "Nice — clue logged." : "对了，线索已记下 ✓");
    } else {
      showToast(isEn ? "Not quite—look again or use the hint." : "再想想看，或点提示～");
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.changedTouches[0];
    if (!t) return;
    touchRef.current = { x: t.clientX, t: Date.now() };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchRef.current;
    touchRef.current = null;
    const t = e.changedTouches[0];
    if (!start || !t) return;
    const dx = t.clientX - start.x;
    const dt = Date.now() - start.t;
    if (dt > 900 || Math.abs(dx) < 56) return;
    if (dx < 0) goNext();
    else goPrev();
  };

  if (slug && slug !== BOOK_SLUG) {
    return null;
  }

  return (
    <main className="relative min-h-screen bg-[#e8e4dc] text-neutral-900">
      {gestureOn ? (
        <video
          ref={videoRef}
          muted
          playsInline
          className="fixed z-40 rounded-2xl border border-neutral-900/10 object-cover shadow-[0_12px_40px_rgba(0,0,0,0.18)] transition-[width,height,opacity,bottom,right] duration-300"
          style={{
            width: "min(240px, 34vw)",
            height: "min(168px, 24vw)",
            opacity: 1,
            bottom: 28,
            right: 28,
            pointerEvents: "none",
          }}
          aria-hidden
        />
      ) : null}

      {toast ? (
        <div className="fixed left-1/2 top-24 z-[60] -translate-x-1/2 rounded-full border border-neutral-200 bg-white/95 px-5 py-2 text-sm text-neutral-800 shadow-lg backdrop-blur-sm">
          {toast}
        </div>
      ) : null}

      <div className="mx-auto flex max-w-[1200px] flex-col px-5 pb-36 pt-8 sm:px-10 sm:pt-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 max-w-xl">
            <button
              type="button"
              onClick={() => {
                const st = location.state as WorksNavState | null;
                navigate("/", {
                  state: {
                    __fromWorkReturn: true,
                    worksCarouselPage: typeof st?.worksCarouselPage === "number" ? st.worksCarouselPage : undefined,
                    worksCategory: typeof st?.worksCategory === "string" ? st.worksCategory : undefined,
                  },
                });
              }}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-900/10 bg-white/60 px-3 py-1.5 text-sm text-neutral-800 shadow-sm backdrop-blur-sm transition hover:bg-white"
            >
              <ArrowLeft size={16} />
              {isEn ? "Works" : "返回作品区"}
            </button>
            <h1 className="mt-6 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              {isEn ? "Tan Kaixun" : "谭凯洵"}
            </h1>
            <p className="mt-2 text-lg font-normal text-neutral-600">
              {isEn ? `Interactive picture book · ${bookTitle}` : `《${bookTitle}》· 互动数字绘本`}
            </p>
            {cluesErr ? (
              <p className="mt-4 text-sm text-amber-800">{isEn ? "Could not load clues.json" : "未能加载 clues.json"}</p>
            ) : introLine ? (
              <p className="mt-5 max-w-prose text-sm leading-relaxed text-neutral-600">{introLine}</p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-500">
              <span className="inline-flex items-center gap-1">
                <BookOpen size={12} />
                {isEn ? "← → keys · edge tap · gestures" : "键盘 ← → · 点边缘 · 手势翻页"}
              </span>
            </div>
          </div>
          <div className="shrink-0 pt-2 text-right text-sm text-neutral-500 lg:max-w-[220px]">
            {isEn ? "Picture book design · portfolio" : "绘本设计 · 个人习作"}
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <div
            ref={wrapRef}
            className="relative w-full max-w-[min(960px,96vw)] rounded-[20px] bg-[#d7ccbb] p-3 shadow-[0_28px_80px_rgba(0,0,0,0.14)] ring-1 ring-black/8 sm:p-5"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div
              className="relative overflow-hidden rounded-[16px] bg-[#cfc4b2] px-3 py-4 sm:px-5 sm:py-6"
              style={{ minHeight: "min(74vh, 780px)" }}
            >
              <p className="mb-2 text-center text-[10px] uppercase tracking-[0.2em] text-neutral-700/80">
                {isEn ? "Collection preview" : "数字绘本阅览"}
              </p>

              <button
                type="button"
                onClick={goPrev}
                disabled={page <= 1 || numPages === 0}
                className="absolute left-0 top-10 z-10 flex h-[calc(100%-5.2rem)] w-[min(12%,84px)] items-center justify-center rounded-l-lg bg-gradient-to-r from-black/26 to-transparent text-white transition hover:from-black/38 disabled:opacity-20"
                aria-label={isEn ? "Previous page" : "上一页"}
              >
                <ChevronLeft size={30} strokeWidth={2.1} />
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={numPages > 0 && page >= numPages}
                className="absolute right-0 top-10 z-10 flex h-[calc(100%-5.2rem)] w-[min(12%,84px)] items-center justify-end rounded-r-lg bg-gradient-to-l from-black/26 to-transparent pr-0.5 text-white transition hover:from-black/38 disabled:opacity-20"
                aria-label={isEn ? "Next page" : "下一页"}
              >
                <ChevronRight size={30} strokeWidth={2.1} />
              </button>

              <div
                key={pageTurn ? `${page}-${pageTurn.id}` : `p-${page}`}
                className={pageTurn ? (pageTurn.dir === "next" ? "book-page-flip-next" : "book-page-flip-prev") : ""}
                style={{ perspective: "1400px" }}
              >
                <PdfCanvasFlipBook
                  pdfUrl={pdfUrl}
                  page={page}
                  maxWidth={pageWidth}
                  onLoadSuccess={onPdfLoadSuccess}
                  onLoadError={onPdfLoadError}
                />
              </div>

              {pdfLoadErr ? (
                <p className="mt-2 text-center text-xs text-red-800/90">
                  {isEn ? "PDF: " : "PDF 加载错误："}
                  {pdfLoadErr}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-900/10 pt-3">
                <span className="text-xs font-medium text-neutral-700">
                  {numPages ? `${page} / ${numPages}` : "—"}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={goPrev}
                    disabled={page <= 1 || numPages === 0}
                    className="inline-flex items-center gap-1 rounded-full border border-neutral-900/10 bg-white/50 px-3 py-1.5 text-xs font-semibold text-neutral-800 disabled:opacity-35"
                  >
                    <ChevronLeft size={16} />
                    {isEn ? "Prev" : "上一页"}
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={numPages > 0 && page >= numPages}
                    className="inline-flex items-center gap-1 rounded-full border border-neutral-900/10 bg-white/50 px-3 py-1.5 text-xs font-semibold text-neutral-800 disabled:opacity-35"
                  >
                    {isEn ? "Next" : "下一页"}
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-6 max-w-[min(1040px,96vw)] rounded-xl border border-neutral-900/8 bg-white/50 px-4 py-3 text-xs text-neutral-600 backdrop-blur-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p>
                {isEn
                  ? "This page requests the camera for thumbs-up / thumbs-down page turns. If blocked, use keys or edge taps."
                  : "进入本页会尝试打开摄像头（点赞 = 下一页，倒赞 = 上一页）。若浏览器拦截权限，可用键盘或点书页左右边缘。"}
              </p>
              {gestureReady ? (
                <p className="font-medium text-emerald-800">{isEn ? "Camera ready." : "摄像头已就绪。"}</p>
              ) : gestureOn ? (
                <p>{isEn ? "Starting camera…" : "正在启动摄像头…"}</p>
              ) : (
                <p>{isEn ? "Camera off." : "摄像头已关闭。"}</p>
              )}
              {gestureError ? <p className="text-amber-900">{gestureError}</p> : null}
              {gestureError ? (
                <button
                  type="button"
                  onClick={retryCamera}
                  className="mt-1 rounded-lg border border-neutral-900/15 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900 hover:bg-neutral-50"
                >
                  {isEn ? "Retry camera" : "重试开启摄像头"}
                </button>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setGestureOn((v) => !v)}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition"
              style={{
                borderColor: gestureOn ? "rgba(22,101,52,0.35)" : "rgba(0,0,0,0.12)",
                background: gestureOn ? "rgba(22,101,52,0.08)" : "rgba(255,255,255,0.7)",
              }}
            >
              <Hand size={15} />
              {isEn ? (gestureOn ? "Camera on" : "Camera off") : gestureOn ? "摄像头开" : "摄像头关"}
            </button>
          </div>
        </div>

        <div className="fixed bottom-6 left-5 z-30 sm:bottom-8 sm:left-8">
          <button
            type="button"
            onClick={() => setNotesOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full border border-neutral-900/10 bg-white/90 px-4 py-2 text-xs font-semibold text-neutral-800 shadow-md backdrop-blur-sm"
          >
            <Sparkles size={14} />
            {isEn ? (notesOpen ? "Hide notes" : "Detective notes") : notesOpen ? "收起笔记" : "侦探笔记"}
          </button>
        </div>

        {notesOpen ? (
          <div className="fixed inset-x-4 bottom-20 z-30 max-h-[50vh] overflow-y-auto rounded-2xl border border-neutral-900/10 bg-[#faf9f6]/98 p-4 text-sm text-neutral-800 shadow-2xl backdrop-blur-md sm:inset-x-auto sm:right-8 sm:bottom-24 sm:left-auto sm:w-[min(400px,92vw)]">
            {activeNotes.length ? (
              <ul className="space-y-3 leading-relaxed">
                {activeNotes.map((n, i) => (
                  <li key={i}>{isEn ? n.en : n.zh}</li>
                ))}
              </ul>
            ) : (
              <p className="text-neutral-500">{isEn ? "No note for this page." : "这一页暂无分段提示。"}</p>
            )}
            {visibleRiddles.length ? (
              <div className="mt-5 space-y-4 border-t border-neutral-200 pt-4">
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-500">{isEn ? "Riddles" : "谜面"}</div>
                {visibleRiddles.map((r) => (
                  <div key={r.id} className="space-y-2 rounded-xl border border-neutral-200 bg-white/80 p-3">
                    <p className="text-sm leading-relaxed">{isEn ? r.promptEn : r.promptZh}</p>
                    {solved[r.id] ? (
                      <div className="text-xs font-bold text-emerald-700">{isEn ? "Solved ✓" : "已解开 ✓"}</div>
                    ) : (
                      <>
                        <details className="text-xs text-neutral-600">
                          <summary className="cursor-pointer font-medium">{isEn ? "Hint" : "提示"}</summary>
                          <p className="mt-2">{isEn ? r.hintEn : r.hintZh}</p>
                        </details>
                        <div className="flex gap-2">
                          <input
                            value={riddleInputs[r.id] ?? ""}
                            onChange={(e) => setRiddleInputs((m) => ({ ...m, [r.id]: e.target.value }))}
                            className="min-w-0 flex-1 rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-emerald-600/40"
                            placeholder={isEn ? "Your answer…" : "输入谜底…"}
                          />
                          <button
                            type="button"
                            onClick={() => trySolve(r.id, riddleInputs[r.id] ?? "", r.accept)}
                            className="shrink-0 rounded-lg border border-emerald-800/20 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-900"
                          >
                            {isEn ? "Check" : "验证"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}

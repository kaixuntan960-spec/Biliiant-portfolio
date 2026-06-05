import React from "react";
import HTMLFlipBook from "react-pageflip";
import styled from "styled-components";
import { ArrowLeft, ArrowRight, Hand } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useI18n, useSiteContent } from "../i18n";
import { useGesturePageTurn } from "../hooks/useGesturePageTurn";
import MusicPlayer from "../components/MusicPlayer";

const IMAGE_TOTAL = 23;
const IMAGE_PAGES = Array.from({ length: IMAGE_TOTAL }, (_, idx) => {
  const fileNo = String(idx + 1).padStart(3, "0");
  return `/works/socks-detective/images/${fileNo}.webp`;
});
const WIDE_IMAGE_RATIO_THRESHOLD = 2.2;
// Explicit spread pages: keep these as 2-page panoramas.
const FORCED_WIDE_PAGES = new Set<number>([12, 13, 14, 17, 22]);
type DisplaySlot = {
  pageNo: number;
  imageUrl: string;
  part: "full" | "left" | "right";
};


type FlipBookBoundaryState = {
  hasError: boolean;
  message: string;
};
type WorksReturnState = {
  scrollTo?: string;
  worksCarouselPage?: number;
  worksCategory?: string;
};

class FlipBookBoundary extends React.Component<{ children: React.ReactNode }, FlipBookBoundaryState> {
  state: FlipBookBoundaryState = { hasError: false, message: "" };

  static getDerivedStateFromError(error: unknown): FlipBookBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : "翻书组件运行异常",
    };
  }

  render() {
    if (this.state.hasError) {
      return <ErrorCard>翻书组件加载失败：{this.state.message}</ErrorCard>;
    }
    return this.props.children;
  }
}

const ImagePage = React.forwardRef<
  HTMLDivElement,
  {
    imageUrl: string;
    pageNumber: number;
    part?: "full" | "left" | "right";
  }
>(({ imageUrl, pageNumber, part = "full" }, ref) => {
    return (
      <PageShell ref={ref}>
        <PagePaper>
          <BookImage
            role="img"
            aria-label={`绘本第 ${pageNumber} 页`}
            $part={part}
            $imageUrl={imageUrl}
          />
        </PagePaper>
      </PageShell>
    );
  });

ImagePage.displayName = "ImagePage";

const BookComponent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useI18n();
  const siteContent = useSiteContent();
  const bookRef = React.useRef<any>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const gestureOverlayRef = React.useRef<HTMLCanvasElement | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isMobile, setIsMobile] = React.useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );
  const [wideImagePageNumbers, setWideImagePageNumbers] = React.useState<Set<number>>(new Set());
  const [canRenderFlipBook, setCanRenderFlipBook] = React.useState(false);
  const [wideDetectDone, setWideDetectDone] = React.useState(false);
  const [readyForFirstRender, setReadyForFirstRender] = React.useState(false);
  const [gestureOn, setGestureOn] = React.useState(true);
  const [viewport, setViewport] = React.useState(() => ({
    w: typeof window !== "undefined" ? window.innerWidth : 1280,
    h: typeof window !== "undefined" ? window.innerHeight : 900,
  }));
  const [musicPlaying, setMusicPlaying] = React.useState(false);

  React.useEffect(() => {
    try {
      setMusicPlaying(localStorage.getItem("bgm_preferred") === "1");
    } catch {
      setMusicPlaying(false);
    }
  }, []);

  const handleMusicToggle = (next: boolean) => {
    setMusicPlaying(next);
    try {
      localStorage.setItem("bgm_preferred", next ? "1" : "0");
    } catch {}
  };

  React.useEffect(() => {
    setCanRenderFlipBook(true);
  }, []);

  React.useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(media.matches);
    update();
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }
    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  React.useEffect(() => {
    const onResize = () =>
      setViewport({
        w: window.innerWidth,
        h: window.innerHeight,
      });
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    const detectWidePages = async () => {
      const checks = await Promise.all(
        IMAGE_PAGES.map(
          (src, idx) =>
            new Promise<number | null>((resolve) => {
              const img = new Image();
              img.onload = () => {
                const ratio = img.naturalWidth / Math.max(img.naturalHeight, 1);
                resolve(ratio >= WIDE_IMAGE_RATIO_THRESHOLD ? idx + 1 : null);
              };
              img.onerror = () => resolve(null);
              img.src = src;
            }),
        ),
      );
      if (cancelled) return;
      setWideImagePageNumbers(new Set(checks.filter((v): v is number => v !== null)));
      setWideDetectDone(true);
    };
    void detectWidePages();
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!wideDetectDone) return;
    const preloadTargets = IMAGE_PAGES.slice(0, 2);
    let done = 0;
    let cancelled = false;
    const finishOne = () => {
      done += 1;
      if (!cancelled && done >= preloadTargets.length) {
        setReadyForFirstRender(true);
      }
    };
    preloadTargets.forEach((src) => {
      const img = new Image();
      img.onload = finishOne;
      img.onerror = finishOne;
      img.src = src;
    });
    return () => {
      cancelled = true;
    };
  }, [wideDetectDone]);

  const displaySlots = React.useMemo<DisplaySlot[]>(() => {
    const slots: DisplaySlot[] = [];
    IMAGE_PAGES.forEach((imageUrl, idx) => {
      const pageNo = idx + 1;
      const shouldSpread = FORCED_WIDE_PAGES.has(pageNo) || wideImagePageNumbers.has(pageNo);
      if (pageNo !== 1 && pageNo !== IMAGE_TOTAL && shouldSpread) {
        slots.push({ pageNo, imageUrl, part: "left" });
        slots.push({ pageNo, imageUrl, part: "right" });
      } else {
        slots.push({ pageNo, imageUrl, part: "full" });
      }
    });
    return slots;
  }, [wideImagePageNumbers]);

  const totalPages = IMAGE_TOTAL;
  const sizePreset = React.useMemo(() => {
    if (isMobile) {
      const availW = Math.max(260, viewport.w - 16);
      const availH = Math.max(340, viewport.h - 200);
      const perPageW = Math.max(140, Math.min(380, Math.min(availW / 2, availH * 0.74)));
      const w = Math.round(perPageW);
      const h = Math.round(perPageW / 0.74);
      return {
        width: w,
        height: h,
        minWidth: 140,
        maxWidth: 380,
        minHeight: 190,
        maxHeight: 520,
      };
    }
    // Fit spread to both viewport width and height at any screen size.
    const availW = Math.max(560, viewport.w - 360);
    const availH = Math.max(420, viewport.h - 250);
    const perPageW = Math.max(280, Math.min(620, Math.min(availW / 2, availH * 0.74)));
    const w = Math.round(perPageW);
    const h = Math.round(perPageW / 0.74);
    return {
      width: w,
      height: h,
      minWidth: 280,
      maxWidth: 680,
      minHeight: 320,
      maxHeight: 650,
    };
  }, [isMobile, viewport.h]);

  const playFlipSound = React.useCallback(() => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(290, ctx.currentTime + 0.07);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.028, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.11);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
    window.setTimeout(() => ctx.close(), 180);
  }, []);

  const handleFlip = React.useCallback(
    (e: { data: number }) => {
      const nextFlipIndex = e.data;
      setCurrentPage(displaySlots[nextFlipIndex]?.pageNo ?? nextFlipIndex + 1);
      playFlipSound();
    },
    [displaySlots, playFlipSound],
  );

  const goPrev = React.useCallback(() => {
    bookRef.current?.pageFlip()?.flipPrev();
  }, []);

  const goNext = React.useCallback(() => {
    bookRef.current?.pageFlip()?.flipNext();
  }, []);

  const { ready: gestureReady, error: gestureError, activeGesture, guideMessage } = useGesturePageTurn({
    enabled: gestureOn,
    videoRef,
    overlayRef: gestureOverlayRef,
    onNext: goNext,
    onPrev: goPrev,
  });

  const flipbookRenderKey = React.useMemo(
    () => displaySlots.map((s) => `${s.pageNo}-${s.part}`).join("|"),
    [displaySlots],
  );
  const worksWithSlug = React.useMemo(
    () => siteContent.works.items.filter((w) => Boolean(w.slug)),
    [siteContent.works.items],
  );
  const nextWork = React.useMemo(() => {
    const curIdx = worksWithSlug.findIndex((w) => w.slug === "socks-detective");
    if (curIdx < 0) return null;
    return worksWithSlug[(curIdx + 1) % worksWithSlug.length] ?? null;
  }, [worksWithSlug]);
  const prevWork = React.useMemo(() => {
    const curIdx = worksWithSlug.findIndex((w) => w.slug === "socks-detective");
    if (curIdx < 0) return null;
    return worksWithSlug[(curIdx - 1 + worksWithSlug.length) % worksWithSlug.length] ?? null;
  }, [worksWithSlug]);

  return (
    <Container>
      <MusicPlayer playing={musicPlaying} onToggle={handleMusicToggle} />
      <TopHomeButton
        type="button"
        onClick={() => {
          try { sessionStorage.setItem("return-to-works", "1"); } catch {}
          navigate("/");
        }}
      >
        <ArrowLeft size={14} />
        {lang === "en" ? "Home" : "返回主页"}
      </TopHomeButton>

      <Title>
        <span className="title-label">{lang === 'en' ? '✦ PICTURE BOOK ✦' : '✦ 绘本阅读 ✦'}</span>
        <span className="title-main">{lang === 'en' ? 'Sock Detective' : '袜子侦探社'}</span>
        <span className="title-sub">{lang === 'en' ? '3D Flip Book' : '3D 翻书阅读'}</span>
      </Title>

      <TopRightGestureDock>
        {gestureOn ? (
          <div className="gesture-preview-wrap" aria-hidden>
            <video
              ref={videoRef}
              muted
              playsInline
              className="gesture-preview"
            />
            <canvas ref={gestureOverlayRef} className="gesture-overlay" />
          </div>
        ) : null}
      </TopRightGestureDock>

      <CenteredGestureBar>
        <GesturePanel>
          <p>
            {gestureReady
              ? "摄像头已就绪"
              : gestureOn
                ? "正在启动摄像头..."
                : "手势已关闭"}
          </p>
          {gestureReady ? (
            <span>
              {activeGesture === "next"
                ? "识别到：翻下一页"
                : activeGesture === "prev"
                  ? "识别到：翻上一页"
                  : activeGesture === "arming"
                    ? "已捏合，继续左右滑动触发翻页"
                    : guideMessage}
            </span>
          ) : null}
          {gestureError ? <em>{gestureError}</em> : null}
          <GestureToggle type="button" onClick={() => setGestureOn((v) => !v)}>
            <Hand size={14} />
            {gestureOn ? "摄像头开" : "摄像头关"}
          </GestureToggle>
        </GesturePanel>
      </CenteredGestureBar>

      <BookWrap>
        <FlipBookBoundary>
          {canRenderFlipBook && wideDetectDone && readyForFirstRender ? (
            <FlipViewport>
              <HTMLFlipBook
                key={flipbookRenderKey}
                ref={bookRef}
                style={{}}
                startPage={0}
                width={sizePreset.width}
                height={sizePreset.height}
                size="stretch"
                minWidth={sizePreset.minWidth}
                maxWidth={sizePreset.maxWidth}
                minHeight={sizePreset.minHeight}
                maxHeight={sizePreset.maxHeight}
                drawShadow
                flippingTime={980}
                usePortrait={false}
                startZIndex={0}
                autoSize
                maxShadowOpacity={0.38}
                showCover
                mobileScrollSupport={false}
                clickEventForward
                useMouseEvents
                swipeDistance={1}
                showPageCorners
                disableFlipByClick={false}
                onFlip={handleFlip}
                className="sock-detective-book"
              >
                {displaySlots.map((slot, idx) => (
                  <ImagePage
                    key={`${slot.pageNo}-${slot.part}-${idx}`}
                    imageUrl={slot.imageUrl}
                    pageNumber={slot.pageNo}
                    part={slot.part}
                  />
                ))}
              </HTMLFlipBook>
            </FlipViewport>
          ) : (
            <ErrorCard>正在准备绘本页面...</ErrorCard>
          )}
        </FlipBookBoundary>
      </BookWrap>

      <Toolbar>
        <NavButton type="button" onClick={goPrev}>
          上一页
        </NavButton>
        <PageIndicator>{`${currentPage} / ${totalPages}`}</PageIndicator>
        <NavButton type="button" onClick={goNext}>
          下一页
        </NavButton>
      </Toolbar>

      {prevWork?.slug ? (
        <button
          type="button"
          onClick={() => navigate(`/works/${prevWork.slug}`)}
          className="fixed z-[9000] flex items-center transition-all duration-300 hover:scale-[1.02]"
          style={{
            left: "120px",
            bottom: "20px",
            gap: "10px",
            padding: "12px 18px",
            borderRadius: "999px",
            background: "rgba(255,248,235,0.75)",
            border: "1px solid rgba(160,130,100,0.15)",
            color: "rgba(60,40,25,0.85)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 2px 8px rgba(140,110,80,0.08)",
          }}
          title={lang === "en" ? `Previous: ${prevWork.title}` : `上一个作品：${prevWork.title}`}
        >
          <ArrowLeft size={16} />
          <span style={{ fontSize: "14px", fontWeight: 700 }}>
            {lang === "en" ? "Prev Project" : "上一个项目"}
          </span>
        </button>
      ) : null}
      {nextWork?.slug ? (
        <button
          type="button"
          onClick={() => navigate(`/works/${nextWork.slug}`)}
          className="fixed z-[9000] flex items-center transition-all duration-300 hover:scale-[1.02]"
          style={{
            right: "40px",
            bottom: "20px",
            gap: "10px",
            padding: "12px 18px",
            borderRadius: "999px",
            background: "rgba(255,248,235,0.75)",
            border: "1px solid rgba(160,130,100,0.15)",
            color: "rgba(60,40,25,0.85)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 2px 8px rgba(140,110,80,0.08)",
          }}
          title={lang === "en" ? `Next: ${nextWork.title}` : `下一个作品：${nextWork.title}`}
        >
          <span style={{ fontSize: "14px", fontWeight: 700 }}>
            {lang === "en" ? "Next Project" : "下一个项目"}
          </span>
          <ArrowRight size={16} />
        </button>
      ) : null}
    </Container>
  );
};

export default BookComponent;

const Container = styled.section`
  min-height: 100dvh;
  height: 100dvh;
  overflow: hidden;
  padding: 14px 12px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  background:
    /* 淡淡黄色光晕 - 右上角 */
    radial-gradient(800px 600px at 82% 12%, rgba(255,210,150,0.18) 0%, transparent 55%),
    /* 淡紫色点缀 - 延续海报板视觉 */
    radial-gradient(700px 550px at 18% 8%, rgba(200,165,245,0.15) 0%, transparent 55%),
    radial-gradient(600px 450px at 88% 85%, rgba(200,180,230,0.10) 0%, transparent 50%),
    radial-gradient(500px 400px at 42% 50%, rgba(230,210,240,0.08) 0%, transparent 48%),
    radial-gradient(400px 350px at 12% 72%, rgba(180,200,240,0.07) 0%, transparent 48%),
    #FCF9F6;
  color: rgba(0,0,0,0.8);

  .gesture-preview-wrap {
    position: relative;
    width: min(220px, 30vw);
    height: min(152px, 22vw);
    border-radius: 14px;
    overflow: hidden;
    pointer-events: none;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
    background: #1d1d1d;
  }

  @media (max-width: 980px) {
    .gesture-preview-wrap {
      width: min(220px, 44vw);
      height: min(150px, 30vw);
    }
  }

  .gesture-preview {
    position: absolute;
    inset: 0;
    border-radius: 14px;
    border: 1px solid rgba(95, 71, 46, 0.24);
    object-fit: cover;
    width: 100%;
    height: 100%;
  }

  .gesture-overlay {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
`;

const Title = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 24px 12px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  position: relative;
  z-index: 10;

  .title-label {
    font-size: 10px;
    letter-spacing: 0.3em;
    font-weight: 600;
    color: rgba(0,0,0,0.35);
  }

  .title-main {
    font-family: "Playfair Display", Georgia, serif;
    font-style: italic;
    font-size: clamp(1rem, 2.2vw, 1.6rem);
    color: rgba(0,0,0,0.85);
    letter-spacing: 0.02em;
    line-height: 1.2;
  }

  .title-sub {
    font-size: 10px;
    letter-spacing: 0.12em;
    font-weight: 500;
    color: rgba(0,0,0,0.35);
  }
`;

const BookWrap = styled.div`
  width: min(96vw, 980px);
  max-width: calc(100vw - 16px);
  flex: 1 1 auto;
  min-height: 0;
  margin-top: 6px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border-radius: 18px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.5);
  box-shadow:
    0 4px 24px rgba(0,0,0,0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  perspective: 2400px;
  backdrop-filter: blur(4px);

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 18px;
    border: 1px solid rgba(0,0,0,0.06);
    pointer-events: none;
  }

  @media (max-width: 980px) {
    max-width: min(98vw, 980px);
    padding: 4px;
  }

  .sock-detective-book {
    filter: none;
    transform-style: preserve-3d;
  }

  /* Remove default pageflip middle seam/shadow layers */
  .stf__outerShadow,
  .stf__innerShadow,
  .stf__hardShadow,
  .stf__hardInnerShadow,
  .stf__hardOuterShadow {
    display: none !important;
  }
`;

const FlipViewport = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  border-radius: 12px;
  overflow: hidden;
  isolation: isolate;

  /* Remove any possible center gap between spread pages */
  .stf__parent,
  .stf__block,
  .stf__item {
    gap: 0 !important;
  }
`;

const PageShell = styled.div`
  background: #ffffff;
  border: 0;
  position: relative;
  overflow: visible;
  box-shadow: none !important;
`;

const PagePaper = styled.article`
  height: 100%;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #ffffff;
  position: relative;
  overflow: hidden;
`;

const BookImage = styled.div<{ $part: "full" | "left" | "right"; $imageUrl: string }>`
  width: 100%;
  height: 100%;
  background-image: ${({ $imageUrl }) => `url("${$imageUrl}")`};
  background-repeat: no-repeat;
  background-size: ${({ $part }) => ($part === "full" ? "contain" : "200% 100%")};
  background-position: ${({ $part }) =>
    $part === "left" ? "0% center" : $part === "right" ? "100% center" : "center center"};
  border-radius: 0;
  box-shadow: none !important;
`;


const Toolbar = styled.div`
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 248, 235, 0.65);
  border: 1px solid rgba(160, 130, 100, 0.18);
  box-shadow: 0 2px 8px rgba(140, 110, 80, 0.08);
  flex-shrink: 0;
  backdrop-filter: blur(8px);
`;

const NavButton = styled.button`
  height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(160, 130, 100, 0.2);
  background: rgba(255, 248, 235, 0.75);
  color: rgba(60, 40, 25, 0.85);
  cursor: pointer;
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 0.04em;
  transition: all 0.2s ease;
  box-shadow: 0 1px 4px rgba(140, 110, 80, 0.08);

  &:hover {
    transform: translateY(-2px);
    background: rgba(255, 242, 222, 0.9);
    box-shadow: 0 4px 14px rgba(140, 110, 80, 0.14);
  }

  &:active {
    transform: translateY(0);
  }
`;

const PageIndicator = styled.p`
  margin: 0;
  min-width: 72px;
  text-align: center;
  font-weight: 800;
  font-size: 14px;
  color: rgba(0,0,0,0.7);
  letter-spacing: 0.06em;
  font-variant-numeric: tabular-nums;
`;


const ErrorCard = styled.div`
  min-height: 220px;
  min-width: min(90vw, 680px);
  display: grid;
  place-items: center;
  color: rgba(0,0,0,0.6);
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
`;

const TopHomeButton = styled.button`
  position: fixed;
  z-index: 9000;
  left: 16px;
  top: 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 999px;
  border: 1px solid rgba(160, 130, 100, 0.15);
  background: rgba(255, 248, 235, 0.75);
  color: rgba(60, 40, 25, 0.85);
  backdrop-filter: blur(10px);
  cursor: pointer;
  font-weight: 700;
  font-size: 13px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(140, 110, 80, 0.08);

  &:hover {
    transform: translateY(-1px);
    background: rgba(255, 242, 222, 0.9);
    box-shadow: 0 4px 14px rgba(140, 110, 80, 0.14);
  }
`;

const GesturePanel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: min(92vw, 430px);
  min-height: 40px;
  padding: 6px 10px;
  border-radius: 12px;
  background: rgba(255, 248, 235, 0.65);
  border: 1px solid rgba(160, 130, 100, 0.16);
  box-shadow: 0 2px 8px rgba(140, 110, 80, 0.06);
  color: rgba(60, 40, 25, 0.75);
  font-size: 11px;
  backdrop-filter: blur(6px);

  p {
    margin: 0;
    line-height: 1.25;
  }

  span {
    font-size: 11px;
    color: rgba(60, 40, 25, 0.6);
    line-height: 1.25;
  }

  em {
    font-style: normal;
    color: #c05530;
  }
`;

const GestureToggle = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(160, 130, 100, 0.18);
  background: rgba(255, 248, 235, 0.75);
  color: rgba(60, 40, 25, 0.75);
  cursor: pointer;
  font-size: 11px;
  font-weight: 700;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 242, 222, 0.9);
  }
`;

const TopRightGestureDock = styled.div`
  position: fixed;
  top: 12px;
  right: 12px;
  z-index: 8800;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  max-width: min(36vw, 430px);

  @media (max-width: 980px) {
    top: 8px;
    right: 8px;
    max-width: min(52vw, 360px);
  }

  @media (max-width: 767px) {
    top: 6px;
    max-width: min(68vw, 320px);
  }
`;

const CenteredGestureBar = styled.div`
  width: min(92vw, 980px);
  display: flex;
  justify-content: center;
  margin-bottom: 6px;
  z-index: 20;
`;



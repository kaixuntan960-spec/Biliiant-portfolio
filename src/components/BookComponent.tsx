import React from "react";
import HTMLFlipBook from "react-pageflip";
import styled from "styled-components";
import { ArrowLeft, ArrowRight, Hand } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useI18n, useSiteContent } from "../i18n";
import { useGesturePageTurn } from "../hooks/useGesturePageTurn";

const IMAGE_TOTAL = 23;
const IMAGE_PAGES = Array.from({ length: IMAGE_TOTAL }, (_, idx) => {
  const fileNo = String(idx + 1).padStart(3, "0");
  return `/works/socks-detective/images/${fileNo}.jpg`;
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
      const availW = Math.max(260, viewport.w - 24);
      const availH = Math.max(340, viewport.h - 360);
      const w = Math.max(220, Math.min(390, Math.min(availW, availH * 0.72)));
      const h = Math.round(w / 0.72);
      return {
        width: Math.round(w),
        height: h,
        minWidth: 220,
        maxWidth: 390,
        minHeight: 300,
        maxHeight: 500,
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

  return (
    <Container>
      <TopHomeButton
        type="button"
        onClick={() => {
          const st = location.state as WorksReturnState | null;
          navigate("/", {
            state: {
              scrollTo: "works",
              worksCarouselPage: typeof st?.worksCarouselPage === "number" ? st.worksCarouselPage : undefined,
              worksCategory: typeof st?.worksCategory === "string" ? st.worksCategory : undefined,
            },
          });
        }}
      >
        <ArrowLeft size={14} />
        {lang === "en" ? "Home" : "返回主页"}
      </TopHomeButton>

      <Title>谭凯洵绘本 · 3D 翻书阅读</Title>

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
                usePortrait={isMobile}
                startZIndex={0}
                autoSize
                maxShadowOpacity={0.38}
                showCover
                mobileScrollSupport
                clickEventForward
                useMouseEvents
                swipeDistance={8}
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

      {nextWork?.slug ? (
        <NextWorkButton
          type="button"
          onClick={() => navigate(`/works/${nextWork.slug}`)}
          title={lang === "en" ? `Next: ${nextWork.title}` : `下一个作品：${nextWork.title}`}
        >
          <span>
            <strong>{lang === "en" ? "Next work" : "下一个作品"}</strong>
            <small>{nextWork.title}</small>
          </span>
          <ArrowRight size={14} />
        </NextWorkButton>
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
    radial-gradient(circle at 20% 10%, #fff9ea 0%, transparent 28%),
    radial-gradient(circle at 80% 90%, #f9edd6 0%, transparent 28%),
    #f4e8d1;
  color: #402818;

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

const Title = styled.h1`
  margin: 2px 0 8px;
  text-align: center;
  font-size: clamp(1.12rem, 2.1vw, 1.75rem);
  letter-spacing: 0.04em;
  font-weight: 800;
  color: #553722;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.38);

  &::before {
    content: "PORTFOLIO BOOK";
    display: block;
    margin-bottom: 6px;
    font-size: 0.66rem;
    letter-spacing: 0.2em;
    font-weight: 700;
    color: rgba(122, 87, 52, 0.72);
  }
`;

const BookWrap = styled.div`
  width: min(92vw, 980px);
  max-width: calc(100vw - 300px);
  flex: 1 1 auto;
  min-height: 0;
  margin-top: 10px;
  padding: 8px 0 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border-radius: 14px;
  padding: 0;
  background: transparent;
  box-shadow: none;
  perspective: 2400px;

  @media (max-width: 980px) {
    max-width: min(94vw, 980px);
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
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(255, 247, 230, 0.66);
  border: 1px solid rgba(165, 127, 89, 0.26);
  box-shadow: 0 8px 18px rgba(121, 88, 53, 0.12);
  flex-shrink: 0;
`;

const NavButton = styled.button`
  height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(138, 99, 61, 0.36);
  background: linear-gradient(135deg, #fff6e6 0%, #f2dec0 100%);
  color: #5a3a23;
  cursor: pointer;
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 0.02em;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
  transition: all 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    background: linear-gradient(135deg, #fff8eb 0%, #efd6b0 100%);
  }
`;

const PageIndicator = styled.p`
  margin: 0;
  min-width: 64px;
  text-align: center;
  font-weight: 800;
  font-size: 13px;
  color: #684527;
  letter-spacing: 0.04em;
`;


const ErrorCard = styled.div`
  min-height: 220px;
  min-width: min(90vw, 680px);
  display: grid;
  place-items: center;
  color: #5c3b22;
  background: rgba(255, 248, 232, 0.92);
  border: 1px solid rgba(111, 77, 47, 0.35);
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
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid rgba(95, 71, 46, 0.35);
  background: rgba(255, 248, 233, 0.9);
  color: #52351f;
  backdrop-filter: blur(8px);
  cursor: pointer;
  font-weight: 700;
`;

const NextWorkButton = styled.button`
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 8900;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid rgba(95, 71, 46, 0.35);
  background: rgba(255, 248, 233, 0.92);
  color: #52351f;
  backdrop-filter: blur(8px);
  cursor: pointer;
  box-shadow: 0 10px 26px rgba(85, 62, 38, 0.18);

  span {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    line-height: 1.2;
  }

  strong {
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  small {
    font-size: 12px;
    max-width: 180px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const GesturePanel = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  max-width: min(92vw, 430px);
  min-height: 40px;
  padding: 6px 8px;
  border-radius: 12px;
  background: rgba(255, 248, 233, 0.86);
  border: 1px solid rgba(95, 71, 46, 0.2);
  box-shadow: 0 8px 16px rgba(85, 62, 38, 0.1);
  color: #5a3a23;
  font-size: 11px;

  p {
    margin: 0;
    line-height: 1.25;
  }

  span {
    font-size: 11px;
    color: #6c4b2e;
    line-height: 1.25;
  }

  em {
    font-style: normal;
    color: #8a4120;
  }
`;

const GestureToggle = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 26px;
  padding: 0 8px;
  border-radius: 999px;
  border: 1px solid rgba(95, 71, 46, 0.28);
  background: #fff7e8;
  color: #5a3a23;
  cursor: pointer;
  font-size: 11px;
  font-weight: 700;
`;

const TopRightGestureDock = styled.div`
  position: fixed;
  top: 8px;
  right: 8px;
  z-index: 8800;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  max-width: min(36vw, 430px);

  @media (max-width: 980px) {
    top: 6px;
    right: 6px;
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
  margin-bottom: 4px;
  z-index: 20;
`;


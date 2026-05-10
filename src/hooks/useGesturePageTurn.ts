import { useEffect, useRef, useState } from "react";
import { FilesetResolver, GestureRecognizer } from "@mediapipe/tasks-vision";

const GESTURE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task";
const LOCAL_GESTURE_MODEL = "/mediapipe/models/gesture_recognizer.task";
const PINCH_DISTANCE_THRESHOLD = 0.1;
const PINCH_DISTANCE_RATIO_THRESHOLD = 0.58;
const SWIPE_TRIGGER_DISTANCE = 0.12;
const SWIPE_TRIGGER_Y_MIN = 0.03;
const NEXT_START_EDGE_MIN_X = 0.62;
const PREV_START_EDGE_MAX_X = 0.38;
const ACTION_PROGRESS_THRESHOLD = 0.62;
const SWIPE_COOLDOWN_MS = 700;
const MIN_HANDEDNESS_SCORE = 0.72;
const MIN_HAND_SPAN = 0.075;
const MAX_HAND_SPAN = 0.5;
const MIN_HAND_BBOX_SIZE = 0.12;
const PINCH_STABLE_FRAMES = 3;
const MIRROR_X_FOR_GESTURE = true;

function visionWasmBaseUrl(): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const raw = import.meta.env.BASE_URL || "/";
  const segs = raw.split("/").filter(Boolean);
  const prefix = segs.length ? `/${segs.join("/")}` : "";
  return `${origin}${prefix}/mediapipe/tasks-vision/wasm`;
}

async function waitForVideoEl(videoRef: React.RefObject<HTMLVideoElement | null>, timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const v = videoRef.current;
    if (v) return v;
    await new Promise((r) => setTimeout(r, 40));
  }
  return null;
}

async function hasUsableLocalGestureModel() {
  try {
    const res = await fetch(LOCAL_GESTURE_MODEL, { method: "HEAD", cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

async function createCameraStream() {
  const candidates: MediaStreamConstraints[] = [
    {
      video: { facingMode: "user", width: { ideal: 960 }, height: { ideal: 540 }, frameRate: { ideal: 30, max: 30 } },
      audio: false,
    },
    {
      video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    },
    {
      video: true,
      audio: false,
    },
  ];
  let lastErr: unknown = null;
  for (const c of candidates) {
    try {
      return await navigator.mediaDevices.getUserMedia(c);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("Could not start video source");
}

type Args = {
  enabled: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  overlayRef?: React.RefObject<HTMLCanvasElement | null>;
  onNext: () => void;
  onPrev: () => void;
};

/**
 * Gesture rule:
 * 1) Pinch thumb+index to arm.
 * 2) Keep pinched and swipe left/right to flip pages.
 */
export function useGesturePageTurn({ enabled, videoRef, overlayRef, onNext, onPrev }: Args) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeGesture, setActiveGesture] = useState<"next" | "prev" | "arming" | "none">("none");
  const [guideMessage, setGuideMessage] = useState("手放中间");
  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const swipeStartXRef = useRef<number | null>(null);
  const swipeStartYRef = useRef<number | null>(null);
  const swipeModeRef = useRef<"next" | "prev" | null>(null);
  const pinchStableFramesRef = useRef(0);
  const cooldownUntilRef = useRef(0);
  const rafRef = useRef(0);
  const onNextRef = useRef(onNext);
  const onPrevRef = useRef(onPrev);
  const failedFrameCountRef = useRef(0);
  onNextRef.current = onNext;
  onPrevRef.current = onPrev;

  const drawLandmarks = (video: HTMLVideoElement, landmarks?: Array<{ x: number; y: number; z: number }>) => {
    const canvas = overlayRef?.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    ctx.clearRect(0, 0, width, height);
    if (!landmarks || landmarks.length === 0) return;

    const edges: Array<[number, number]> = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 8],
      [5, 9], [9, 10], [10, 11], [11, 12],
      [9, 13], [13, 14], [14, 15], [15, 16],
      [13, 17], [17, 18], [18, 19], [19, 20], [0, 17],
    ];

    ctx.lineWidth = 3.2;
    ctx.strokeStyle = "rgba(125, 255, 233, 0.9)";
    for (const [a, b] of edges) {
      const pa = landmarks[a];
      const pb = landmarks[b];
      if (!pa || !pb) continue;
      ctx.beginPath();
      ctx.moveTo(pa.x * width, pa.y * height);
      ctx.lineTo(pb.x * width, pb.y * height);
      ctx.stroke();
    }

    for (let i = 0; i < landmarks.length; i += 1) {
      const p = landmarks[i];
      if (!p) continue;
      ctx.beginPath();
      ctx.fillStyle = i === 4 || i === 8 ? "rgba(255, 214, 102, 0.95)" : "rgba(255, 255, 255, 0.95)";
      ctx.arc(p.x * width, p.y * height, i === 4 || i === 8 ? 7.2 : 5.3, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  useEffect(() => {
    if (!enabled) {
      setReady(false);
      setError(null);
      setActiveGesture("none");
      setGuideMessage("手势已关闭");
      swipeStartXRef.current = null;
      swipeStartYRef.current = null;
      swipeModeRef.current = null;
      pinchStableFramesRef.current = 0;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      recognizerRef.current?.close?.();
      recognizerRef.current = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      const v = videoRef.current;
      if (v) {
        v.srcObject = null;
      }
      if (overlayRef?.current) {
        const ctx = overlayRef.current.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
      }
      return;
    }

    let cancelled = false;

    const loop = () => {
      if (cancelled) return;
      const video = videoRef.current;
      const gr = recognizerRef.current;
      if (!video || !gr || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      const now = performance.now();
      const result = gr.recognizeForVideo(video, now);
      const landmarks = result.landmarks?.[0];
      const handednessScore = result.handedness?.[0]?.[0]?.score ?? 0;
      drawLandmarks(video, landmarks);

      // Recover from camera black frame / stalled stream without manual refresh.
      if (video.videoWidth <= 2 || video.videoHeight <= 2 || video.readyState < 2) {
        failedFrameCountRef.current += 1;
      } else {
        if (failedFrameCountRef.current > 0) setError(null);
        failedFrameCountRef.current = 0;
      }
      if (failedFrameCountRef.current > 36) {
        setError("摄像头画面中断，正在自动恢复...");
        const playAgain = video.play();
        if (playAgain && typeof playAgain.catch === "function") {
          void playAgain.catch(() => {});
        }
      }

      const t = Date.now();
      if (!landmarks || landmarks.length < 9) {
        swipeStartXRef.current = null;
        swipeStartYRef.current = null;
        swipeModeRef.current = null;
        pinchStableFramesRef.current = 0;
        setActiveGesture("none");
        setGuideMessage("手放中间");
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      if (handednessScore < MIN_HANDEDNESS_SCORE) {
        swipeStartXRef.current = null;
        swipeStartYRef.current = null;
        swipeModeRef.current = null;
        pinchStableFramesRef.current = 0;
        setActiveGesture("none");
        setGuideMessage("识别不稳，换角度");
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const wrist = landmarks[0];
      const middleMcp = landmarks[9];
      const thumb = landmarks[4];
      const index = landmarks[8];
      const xs = landmarks.map((p) => p.x);
      const ys = landmarks.map((p) => p.y);
      const bboxW = Math.max(...xs) - Math.min(...xs);
      const bboxH = Math.max(...ys) - Math.min(...ys);
      const pinchDistance = Math.hypot(thumb.x - index.x, thumb.y - index.y);
      const handScale = Math.max(Math.hypot(wrist.x - middleMcp.x, wrist.y - middleMcp.y), 0.0001);
      const handSpanOk =
        handScale >= MIN_HAND_SPAN &&
        handScale <= MAX_HAND_SPAN &&
        bboxW >= MIN_HAND_BBOX_SIZE &&
        bboxH >= MIN_HAND_BBOX_SIZE;
      const pinched =
        handSpanOk &&
        (pinchDistance <= PINCH_DISTANCE_THRESHOLD ||
          pinchDistance / handScale <= PINCH_DISTANCE_RATIO_THRESHOLD);
      if (pinched) {
        pinchStableFramesRef.current += 1;
      } else {
        pinchStableFramesRef.current = 0;
      }

      if (!pinched || pinchStableFramesRef.current < PINCH_STABLE_FRAMES) {
        swipeStartXRef.current = null;
        swipeStartYRef.current = null;
        swipeModeRef.current = null;
        setActiveGesture("none");
        if (!handSpanOk) {
          if (handScale < MIN_HAND_SPAN || bboxW < MIN_HAND_BBOX_SIZE || bboxH < MIN_HAND_BBOX_SIZE) {
            setGuideMessage("手太远，靠近些");
          } else {
            setGuideMessage("手太近，后退些");
          }
        } else {
          setGuideMessage("先捏合拇指+食指");
        }
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const rawPinchCenterX = (thumb.x + index.x) / 2;
      const pinchCenterX = MIRROR_X_FOR_GESTURE ? 1 - rawPinchCenterX : rawPinchCenterX;
      const pinchCenterY = (thumb.y + index.y) / 2;
      if (swipeStartXRef.current === null) {
        let mode: "next" | "prev" | null = null;
        if (pinchCenterX >= NEXT_START_EDGE_MIN_X) {
          mode = "next";
        } else if (pinchCenterX <= PREV_START_EDGE_MAX_X) {
          mode = "prev";
        }
        if (!mode) {
          setActiveGesture("none");
          setGuideMessage("从边缘开始滑");
          rafRef.current = requestAnimationFrame(loop);
          return;
        }
        swipeStartXRef.current = pinchCenterX;
        swipeStartYRef.current = pinchCenterY;
        swipeModeRef.current = mode;
        setActiveGesture("arming");
        setGuideMessage("已捏合，继续滑动");
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const dx = pinchCenterX - swipeStartXRef.current;
      const dy = pinchCenterY - (swipeStartYRef.current ?? pinchCenterY);
      const absDy = Math.abs(dy);
      const mode = swipeModeRef.current;
      if (!mode) {
        swipeStartXRef.current = null;
        swipeStartYRef.current = null;
        setActiveGesture("none");
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const nextProgress = Math.min(1, Math.max(0, (-dx) / SWIPE_TRIGGER_DISTANCE));
      const prevProgress = Math.min(1, Math.max(0, dx / SWIPE_TRIGGER_DISTANCE));
      const progress = mode === "next" ? nextProgress : prevProgress;
      const curveOk = absDy >= SWIPE_TRIGGER_Y_MIN;
      if (progress > 0.2) {
        setActiveGesture("arming");
        if (!curveOk) {
          setGuideMessage("滑动不够，再滑远一点");
        } else {
          setGuideMessage("继续滑动");
        }
      }

      if (t > cooldownUntilRef.current) {
        // Must start near page edge and perform a curved drag gesture.
        if (mode === "next" && progress >= ACTION_PROGRESS_THRESHOLD && curveOk) {
          setActiveGesture("next");
          setGuideMessage("已翻下一页");
          onNextRef.current();
          cooldownUntilRef.current = t + SWIPE_COOLDOWN_MS;
          swipeStartXRef.current = null;
          swipeStartYRef.current = null;
          swipeModeRef.current = null;
        } else if (mode === "prev" && progress >= ACTION_PROGRESS_THRESHOLD && curveOk) {
          setActiveGesture("prev");
          setGuideMessage("已翻上一页");
          onPrevRef.current();
          cooldownUntilRef.current = t + SWIPE_COOLDOWN_MS;
          swipeStartXRef.current = null;
          swipeStartYRef.current = null;
          swipeModeRef.current = null;
        } else {
          setActiveGesture("arming");
          if (!curveOk) {
            setGuideMessage("加一点弧线动作");
          } else {
            setGuideMessage("再滑一点就触发");
          }
        }
      } else {
        setActiveGesture("arming");
        setGuideMessage("冷却中，稍后再试");
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    (async () => {
      try {
        setError(null);
        setReady(false);
        const video = await waitForVideoEl(videoRef);
        if (cancelled) return;
        if (!video) {
          setError("视频元素未就绪。请刷新页面或稍后重试。");
          return;
        }
        let stream: MediaStream;
        try {
          stream = await createCameraStream();
        } catch (e) {
          const name = e instanceof DOMException ? e.name : "";
          if (name === "NotAllowedError" || name === "PermissionDeniedError") {
            setError("摄像头被拒绝：请在浏览器地址栏左侧允许摄像头，或轻点页面后再试。");
          } else if (name === "NotFoundError") {
            setError("未检测到摄像头设备。");
          } else {
            setError(e instanceof Error ? e.message : String(e));
          }
          return;
        }
        if (cancelled) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        streamRef.current = stream;
        stream.getVideoTracks().forEach((tr) => {
          tr.onended = () => {
            setReady(false);
            setError("摄像头连接中断，请保持摄像头可用。");
          };
          tr.onmute = () => {
            setError("摄像头画面暂时不可用，正在尝试恢复...");
          };
          tr.onunmute = () => {
            setError(null);
          };
        });
        video.srcObject = stream;
        video.playsInline = true;
        video.muted = true;
        await video.play().catch(async () => {
          await new Promise((r) => setTimeout(r, 120));
          await video.play();
        });

        let wasm;
        try {
          wasm = await FilesetResolver.forVisionTasks(visionWasmBaseUrl());
        } catch {
          setError("手势模型加载失败：请确认已联网，或检查 /mediapipe/tasks-vision/wasm 是否部署。");
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        let gr: GestureRecognizer | null = null;
        let lastErr: unknown = null;
        const candidates: string[] = [];
        if (await hasUsableLocalGestureModel()) candidates.push(LOCAL_GESTURE_MODEL);
        candidates.push(GESTURE_MODEL);

        for (const modelAssetPath of candidates) {
          try {
            gr = await GestureRecognizer.createFromOptions(wasm, {
              baseOptions: {
                modelAssetPath,
                delegate: "CPU",
              },
              runningMode: "VIDEO",
              numHands: 1,
            });
            break;
          } catch (e) {
            lastErr = e;
          }
        }
        if (!gr) {
          setError(
            lastErr instanceof Error
              ? `手势模型加载失败：${lastErr.message}。已自动尝试本地与远程模型。`
              : "手势模型加载失败。已自动尝试本地与远程模型。",
          );
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        if (cancelled) {
          gr.close();
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        recognizerRef.current = gr;
        setReady(true);
        setGuideMessage("手放中间，先捏合再滑动");
        rafRef.current = requestAnimationFrame(loop);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        setReady(false);
      }
    })();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      recognizerRef.current?.close?.();
      recognizerRef.current = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      const v = videoRef.current;
      if (v) v.srcObject = null;
      if (overlayRef?.current) {
        const ctx = overlayRef.current.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
      }
    };
  }, [enabled, videoRef, overlayRef]);

  return { ready, error, activeGesture, guideMessage };
}

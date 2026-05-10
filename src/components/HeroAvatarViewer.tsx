import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Environment, Html, OrbitControls, useGLTF } from "@react-three/drei";
import {
  AdditiveBlending,
  Box3,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PointLight,
  Vector3,
} from "three";

const MODEL_URL = "/models/house-final.glb";

// Add CSS animation for clicked label
if (typeof document !== 'undefined') {
  const styleId = 'clicked-label-animation';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes fadeInScale {
        from {
          opacity: 0;
          transform: scale(0.8) translateY(10px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
  }
}

const Loader = ({ theme = "light" }: { theme?: "light" | "dark" }) => {
  const PET_SIZE = 108;
  const [petPos, setPetPos] = useState({ x: 0, y: 0 });
  const stateRef = useRef({ x: window.innerWidth * 0.4, y: window.innerHeight * 0.25, vx: 0, vy: 0, popT: 0 });
  const mouseRef = useRef({ x: window.innerWidth * 0.4, y: window.innerHeight * 0.25 });
  const lastMouseAt = useRef(Date.now());
  const petVideoRef = useRef<HTMLVideoElement | null>(null);
  const petCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const s = stateRef.current;
    setPetPos({ x: s.x, y: s.y });
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      lastMouseAt.current = Date.now();
    };
    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  useEffect(() => {
    const state = stateRef.current;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const idle = now - lastMouseAt.current > 1200;
      const w = window.innerWidth;
      const h = window.innerHeight;

      const targetX = idle
        ? w * (0.3 + Math.cos(now * 0.0008) * 0.2)
        : Math.max(54, Math.min(w - 54, mx + 12));
      const targetY = idle
        ? h * (0.3 + Math.sin(now * 0.001) * 0.15)
        : Math.max(54, Math.min(h - 54, my + 18));

      const k = 26, c = 9.5;
      const ax = (targetX - state.x) * k - state.vx * c;
      const ay = (targetY - state.y) * k - state.vy * c;
      state.vx += ax * dt;
      state.vy += ay * dt;
      state.x += state.vx * dt;
      state.y += state.vy * dt;

      const dist = Math.hypot(targetX - state.x, targetY - state.y);
      state.popT = dist < 26 ? Math.min(1, state.popT + dt * 0.7) : Math.max(0, state.popT - dt * 1.2);

      setPetPos({ x: state.x, y: state.y });
      frameRef.current = raf;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const video = petVideoRef.current;
    const canvas = petCanvasRef.current;
    if (!video || !canvas) {
      console.log("[Loader] Missing refs:", { video: !!video, canvas: !!canvas });
      return;
    }
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      console.log("[Loader] Failed to get canvas context");
      return;
    }

    console.log("[Loader] Starting canvas rendering");

    let raf = 0;
    const render = () => {
      raf = window.requestAnimationFrame(render);
      if (video.readyState < 2) return;

      const vw = video.videoWidth || 0;
      const vh = video.videoHeight || 0;
      if (!vw || !vh) return;

      const size = 320;
      if (canvas.width !== size || canvas.height !== size) {
        canvas.width = size;
        canvas.height = size;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.clearRect(0, 0, size, size);

      const scale = Math.min(size / vw, size / vh);
      const dw = Math.round(vw * scale);
      const dh = Math.round(vh * scale);
      const dx = Math.round((size - dw) / 2);
      const dy = Math.round((size - dh) / 2);
      ctx.drawImage(video, 0, 0, vw, vh, dx, dy, dw, dh);

      const img = ctx.getImageData(0, 0, size, size);
      const d = img.data;

      // Sample edge colors - same as WelcomeGate
      const edgeSamples: number[] = [];
      const sample = (x: number, y: number) => edgeSamples.push((y * size + x) * 4);
      const step = Math.max(1, Math.floor(size / 24));
      for (let x = 0; x < size; x += step) {
        sample(x, 0);
        sample(x, size - 1);
      }
      for (let y = 0; y < size; y += step) {
        sample(0, y);
        sample(size - 1, y);
      }

      let br = 0, bg = 0, bb = 0;
      for (const p of edgeSamples) {
        br += d[p];
        bg += d[p + 1];
        bb += d[p + 2];
      }
      br /= edgeSamples.length;
      bg /= edgeSamples.length;
      bb /= edgeSamples.length;

      let dev = 0;
      for (const p of edgeSamples) {
        dev += Math.abs(d[p] - br) + Math.abs(d[p + 1] - bg) + Math.abs(d[p + 2] - bb);
      }
      dev /= edgeSamples.length;

      // Adaptive threshold - same as WelcomeGate
      const isDarkTheme = theme === "dark";
      const thr = (isDarkTheme ? 62 : 54) + Math.min(36, dev * 0.65);
      const distAt = (p: number) => Math.abs(d[p] - br) + Math.abs(d[p + 1] - bg) + Math.abs(d[p + 2] - bb);
      const bgL = br * 0.2126 + bg * 0.7152 + bb * 0.0722;
      const lumaAt = (p: number) => d[p] * 0.2126 + d[p + 1] * 0.7152 + d[p + 2] * 0.0722;

      const isSmoothBg = (x: number, y: number) => {
        const idx = (y * size + x) * 4;
        const base = lumaAt(idx);
        let maxDiff = 0;
        if (x > 0) maxDiff = Math.max(maxDiff, Math.abs(lumaAt(idx - 4) - base));
        if (x < size - 1) maxDiff = Math.max(maxDiff, Math.abs(lumaAt(idx + 4) - base));
        if (y > 0) maxDiff = Math.max(maxDiff, Math.abs(lumaAt(idx - size * 4) - base));
        if (y < size - 1) maxDiff = Math.max(maxDiff, Math.abs(lumaAt(idx + size * 4) - base));
        return maxDiff < (isDarkTheme ? 22 : 18);
      };

      // Flood fill from edges
      const visited = new Uint8Array(size * size);
      const qx = new Int16Array(size * size);
      const qy = new Int16Array(size * size);
      let qs = 0;
      let qe = 0;

      const push = (x: number, y: number) => {
        const idx = y * size + x;
        if (visited[idx]) return;
        const p = idx * 4;
        if (d[p + 3] === 0) return;
        if (Math.abs(lumaAt(p) - bgL) > (isDarkTheme ? 78 : 70)) return;
        if (distAt(p) > thr) return;
        visited[idx] = 1;
        qx[qe] = x;
        qy[qe] = y;
        qe++;
      };

      for (let x = 0; x < size; x++) {
        push(x, 0);
        push(x, size - 1);
      }
      for (let y = 0; y < size; y++) {
        push(0, y);
        push(size - 1, y);
      }

      while (qs < qe) {
        const x = qx[qs];
        const y = qy[qs];
        qs++;
        if (x > 0) push(x - 1, y);
        if (x < size - 1) push(x + 1, y);
        if (y > 0) push(x, y - 1);
        if (y < size - 1) push(x, y + 1);
      }

      // Second pass - watermark removal (same as WelcomeGate)
      const thrLoose = thr + (isDarkTheme ? 14 : 12);
      const canBeLooseBg = (x: number, y: number) => {
        const idx = y * size + x;
        if (visited[idx]) return false;
        const p = idx * 4;
        if (d[p + 3] === 0) return false;
        if (!isSmoothBg(x, y)) return false;
        if (Math.abs(lumaAt(p) - bgL) > (isDarkTheme ? 82 : 72)) return false;
        return distAt(p) <= thrLoose;
      };

      const mark = new Uint8Array(size * size);
      const hasVisitedNeighbor = (x: number, y: number) => {
        const idx = y * size + x;
        const left = x > 0 ? visited[idx - 1] : 0;
        const right = x < size - 1 ? visited[idx + 1] : 0;
        const up = y > 0 ? visited[idx - size] : 0;
        const down = y < size - 1 ? visited[idx + size] : 0;
        return left || right || up || down;
      };

      for (let round = 0; round < 2; round++) {
        mark.fill(0);
        for (let y = 1; y < size - 1; y++) {
          for (let x = 1; x < size - 1; x++) {
            const idx = y * size + x;
            if (visited[idx]) continue;
            if (!hasVisitedNeighbor(x, y)) continue;
            if (!canBeLooseBg(x, y)) continue;
            mark[idx] = 1;
          }
        }
        let any = false;
        for (let i = 0; i < mark.length; i++) {
          if (!mark[i]) continue;
          visited[i] = 1;
          any = true;
        }
        if (!any) break;
      }

      for (let i = 0; i < visited.length; i++) {
        if (visited[i]) d[i * 4 + 3] = 0;
      }

      ctx.putImageData(img, 0, 0);
    };

    const onPlay = () => {
      console.log("[Loader] Video started playing");
      if (!raf) render();
    };

    const onLoadedData = () => {
      console.log("[Loader] Video loaded, dimensions:", video.videoWidth, "x", video.videoHeight);
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("loadeddata", onLoadedData);
    void video.play().catch((err) => {
      console.error("[Loader] Video play failed:", err);
    });
    if (!video.paused) render();

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("loadeddata", onLoadedData);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [theme]);

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <style>
        {`
          @keyframes kzSparkFloat {
            0% { transform: translate(-50%, -50%) translateY(0px) scale(0.8); opacity: 0; }
            15% { opacity: 1; }
            100% { transform: translate(-50%, -50%) translateY(-22px) scale(1.1); opacity: 0; }
          }
        `}
      </style>
      <div
        style={{
          position: "absolute",
          left: `${petPos.x - PET_SIZE / 2}px`,
          top: `${petPos.y - PET_SIZE / 2}px`,
          width: `${PET_SIZE}px`,
          height: `${PET_SIZE}px`,
          borderRadius: "999px",
          overflow: "hidden",
          transform: `scale(${1 + stateRef.current.popT * 0.06})`,
          transition: "transform 140ms ease",
          boxShadow: theme === "dark" ? "0 22px 42px rgba(0,0,0,0.24)" : "0 18px 36px rgba(15,23,42,0.16)",
          background: "transparent",
          pointerEvents: "none",
        }}
      >
        <canvas
          ref={petCanvasRef}
          style={{
            width: "100%",
            height: "100%",
            display: "block"
          }}
        />
        <video
          ref={petVideoRef}
          muted
          playsInline
          autoPlay
          loop
          style={{
            position: "absolute",
            width: 1,
            height: 1,
            opacity: 0,
            pointerEvents: "none"
          }}
          src={theme === "dark" ? "/welcome-pet-night.mp4" : "/welcome-pet.mp4"}
        />
      </div>
    </div>
  );
};

type HeroAvatarViewerProps = {
  onNavigate?: (targetId: string) => void;
  lang?: "zh" | "en";
  onHoverLabelChange?: (label: string | null) => void;
  theme?: "light" | "dark";
  calibrationEnabled?: boolean;
};

type TargetId = "experience" | "education" | "home" | "works" | "skills" | "contact" | "life";

type Interaction = {
  id: TargetId;
  labelZh: string;
  labelEn: string;
  color: string;
  keywords: string[];
};

const interactions: Interaction[] = [
  { id: "experience", labelZh: "????", labelEn: "Experience", color: "#f3b08d", keywords: ["ladder", "??", "?"] },
  { id: "education", labelZh: "????", labelEn: "Education", color: "#c98262", keywords: ["bag", "??", "?"] },
  { id: "home", labelZh: "??", labelEn: "Home", color: "#f5cf7d", keywords: ["chair", "??", "?"] },
  { id: "works", labelZh: "????", labelEn: "Works", color: "#7bb6d8", keywords: ["flower", "pot", "flowerpot", "plant", "??", "?", "?"] },
  { id: "skills", labelZh: "??", labelEn: "Skills", color: "#8b9dc3", keywords: ["computer", "pc", "laptop", "??"] },
  { id: "life", labelZh: "????", labelEn: "Life", color: "#f3a777", keywords: ["toy", "toys", "doll", "??"] },
  { id: "contact", labelZh: "???", labelEn: "Contact", color: "#9ec99a", keywords: ["sign", "??", "??"] },
];

const LABELS: Record<TargetId, { zh: string; en: string }> = {
  experience: { zh: "????", en: "Experience" },
  education: { zh: "????", en: "Education" },
  home: { zh: "??", en: "Home" },
  works: { zh: "????", en: "Works" },
  skills: { zh: "??", en: "Skills" },
  life: { zh: "????", en: "Life" },
  contact: { zh: "???", en: "Contact" },
};

type InteractiveSpot = {
  mesh: Mesh | null;
  meshKey: string | null;
  id: TargetId;
  labelZh: string;
  labelEn: string;
  color: string;
  position: [number, number, number];
  hitCenter: [number, number, number];
  hitRadius: number;
};

const LIGHT_BASE = new Color("#f5f0e8");
const LIGHT_SHADE = new Color("#e8dfd0");
const DARK_BASE = new Color("#9ca3af");
const DARK_SHADE = new Color("#6b7280");
const BINDINGS_KEY = "hero_house_bindings_v1";
const ANCHORS_KEY = "hero_house_anchors_v1";

type ManualBindings = Partial<Record<TargetId, string>>;
type ManualAnchors = Partial<Record<TargetId, [number, number, number]>>;
const BINDING_FLOW: TargetId[] = ["home", "experience", "education", "works", "skills", "contact", "life"];

type LoosePartitionResult = {
  parts: Partial<Record<TargetId, { geometry: BufferGeometry; center: [number, number, number] }>>;
  staticGeometry: BufferGeometry;
  componentCount: number;
};

const sqr = (n: number) => n * n;

const defaultRadiusFactor: Record<TargetId, number> = {
  home: 0.085,
  experience: 0.11,
  education: 0.095,
  works: 0.11,
  skills: 0.11,
  contact: 0.095,
  life: 0.15,
};

const buildSubsetGeometry = (src: BufferGeometry, subsetIndices: Uint32Array) => {
  const posAttr = src.getAttribute("position");
  if (!posAttr) throw new Error("Missing position attribute.");
  const srcPos = posAttr.array as Float32Array;
  const srcNormalAttr = src.getAttribute("normal");
  const srcUvAttr = src.getAttribute("uv");
  const srcNormal = srcNormalAttr ? (srcNormalAttr.array as Float32Array) : null;
  const srcUv = srcUvAttr ? (srcUvAttr.array as Float32Array) : null;

  const vertexCount = posAttr.count;
  const remap = new Int32Array(vertexCount);
  remap.fill(-1);
  const oldForNew: number[] = [];

  for (let i = 0; i < subsetIndices.length; i++) {
    const oldIdx = subsetIndices[i];
    if (remap[oldIdx] !== -1) continue;
    remap[oldIdx] = oldForNew.length;
    oldForNew.push(oldIdx);
  }

  const newVertexCount = oldForNew.length;
  const newPos = new Float32Array(newVertexCount * 3);
  const newNormal = srcNormal ? new Float32Array(newVertexCount * 3) : null;
  const newUv = srcUv ? new Float32Array(newVertexCount * 2) : null;

  for (let newIdx = 0; newIdx < newVertexCount; newIdx++) {
    const oldIdx = oldForNew[newIdx];
    const p0 = oldIdx * 3;
    const np0 = newIdx * 3;
    newPos[np0] = srcPos[p0];
    newPos[np0 + 1] = srcPos[p0 + 1];
    newPos[np0 + 2] = srcPos[p0 + 2];
    if (newNormal && srcNormal) {
      newNormal[np0] = srcNormal[p0];
      newNormal[np0 + 1] = srcNormal[p0 + 1];
      newNormal[np0 + 2] = srcNormal[p0 + 2];
    }
    if (newUv && srcUv) {
      const u0 = oldIdx * 2;
      const nu0 = newIdx * 2;
      newUv[nu0] = srcUv[u0];
      newUv[nu0 + 1] = srcUv[u0 + 1];
    }
  }

  const newIndex = newVertexCount <= 65535 ? new Uint16Array(subsetIndices.length) : new Uint32Array(subsetIndices.length);
  for (let i = 0; i < subsetIndices.length; i++) {
    newIndex[i] = remap[subsetIndices[i]];
  }

  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(newPos, 3));
  if (newNormal) g.setAttribute("normal", new BufferAttribute(newNormal, 3));
  if (newUv) g.setAttribute("uv", new BufferAttribute(newUv, 2));
  g.setIndex(new BufferAttribute(newIndex, 1));
  if (!newNormal) g.computeVertexNormals();
  g.computeBoundingBox();
  g.computeBoundingSphere();
  return g;
};

const partitionLooseParts = (
  src: BufferGeometry,
  anchors: Record<TargetId, [number, number, number]>,
  diag: number,
): LoosePartitionResult => {
  const ids = interactions.map((i) => i.id);
  const posAttr = src.getAttribute("position");
  if (!posAttr) throw new Error("Missing position attribute.");
  const position = posAttr.array as Float32Array;

  const vertexCount = posAttr.count;
  let indexAttr = src.getIndex();
  if (!indexAttr) {
    const idx = new (vertexCount <= 65535 ? Uint16Array : Uint32Array)(vertexCount);
    for (let i = 0; i < vertexCount; i++) idx[i] = i;
    src.setIndex(new BufferAttribute(idx, 1));
    indexAttr = src.getIndex();
  }
  const index = indexAttr!.array as Uint32Array | Uint16Array;
  const triCount = Math.floor(index.length / 3);

  const parent = new Int32Array(vertexCount);
  const rank = new Uint8Array(vertexCount);
  for (let i = 0; i < vertexCount; i++) parent[i] = i;

  const find = (x0: number) => {
    let x = x0;
    let p = parent[x];
    while (p !== parent[p]) p = parent[p];
    while (x !== p) {
      const n = parent[x];
      parent[x] = p;
      x = n;
    }
    return p;
  };

  const union = (a: number, b: number) => {
    let ra = find(a);
    let rb = find(b);
    if (ra === rb) return;
    const rka = rank[ra];
    const rkb = rank[rb];
    if (rka < rkb) parent[ra] = rb;
    else if (rka > rkb) parent[rb] = ra;
    else {
      parent[rb] = ra;
      rank[ra] = rka + 1;
    }
  };

  for (let i = 0; i < index.length; i += 3) {
    const a = index[i];
    const b = index[i + 1];
    const c = index[i + 2];
    union(a, b);
    union(a, c);
  }

  const compIndexByRoot = new globalThis.Map<number, number>();
  const triComp = new Uint32Array(triCount);
  const sumX: number[] = [];
  const sumY: number[] = [];
  const sumZ: number[] = [];
  const sumCount: number[] = [];

  for (let t = 0; t < triCount; t++) {
    const i0 = index[t * 3];
    const i1 = index[t * 3 + 1];
    const i2 = index[t * 3 + 2];
    const root = find(i0);
    let ci = compIndexByRoot.get(root);
    if (ci === undefined) {
      ci = sumCount.length;
      compIndexByRoot.set(root, ci);
      sumX.push(0);
      sumY.push(0);
      sumZ.push(0);
      sumCount.push(0);
    }
    triComp[t] = ci;

    const p0 = i0 * 3;
    const p1 = i1 * 3;
    const p2 = i2 * 3;
    sumX[ci] += (position[p0] + position[p1] + position[p2]) / 3;
    sumY[ci] += (position[p0 + 1] + position[p1 + 1] + position[p2 + 1]) / 3;
    sumZ[ci] += (position[p0 + 2] + position[p1 + 2] + position[p2 + 2]) / 3;
    sumCount[ci] += 1;
  }

  const compCount = sumCount.length;
  const centroidX = new Float32Array(compCount);
  const centroidY = new Float32Array(compCount);
  const centroidZ = new Float32Array(compCount);
  for (let ci = 0; ci < compCount; ci++) {
    const c = Math.max(1, sumCount[ci]);
    centroidX[ci] = sumX[ci] / c;
    centroidY[ci] = sumY[ci] / c;
    centroidZ[ci] = sumZ[ci] / c;
  }

  const radius: Record<TargetId, number> = {
    home: diag * defaultRadiusFactor.home,
    experience: diag * defaultRadiusFactor.experience,
    education: diag * defaultRadiusFactor.education,
    works: diag * defaultRadiusFactor.works,
    skills: diag * defaultRadiusFactor.skills,
    contact: diag * defaultRadiusFactor.contact,
    life: diag * defaultRadiusFactor.life,
  };
  const radius2: Record<TargetId, number> = {
    home: sqr(radius.home),
    experience: sqr(radius.experience),
    education: sqr(radius.education),
    works: sqr(radius.works),
    skills: sqr(radius.skills),
    contact: sqr(radius.contact),
    life: sqr(radius.life),
  };

  const compToGroup = new Int16Array(compCount);
  compToGroup.fill(-1);

  for (let ci = 0; ci < compCount; ci++) {
    const cx = centroidX[ci];
    const cy = centroidY[ci];
    const cz = centroidZ[ci];
    let best = -1;
    let bestD = Number.POSITIVE_INFINITY;
    for (let gi = 0; gi < ids.length; gi++) {
      const id = ids[gi];
      const a = anchors[id];
      const dx = cx - a[0];
      const dy = cy - a[1];
      const dz = cz - a[2];
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 > radius2[id]) continue;
      if (d2 < bestD) {
        bestD = d2;
        best = gi;
      }
    }
    compToGroup[ci] = best;
  }

  const staticGroup = ids.length;
  const counts = new Uint32Array(ids.length + 1);
  for (let t = 0; t < triCount; t++) {
    const ci = triComp[t];
    const g = compToGroup[ci] >= 0 ? compToGroup[ci] : staticGroup;
    counts[g] += 3;
  }

  const groups: Uint32Array[] = [];
  for (let gi = 0; gi < counts.length; gi++) groups.push(new Uint32Array(counts[gi]));
  const write = new Uint32Array(counts.length);

  for (let t = 0; t < triCount; t++) {
    const ci = triComp[t];
    const g = compToGroup[ci] >= 0 ? compToGroup[ci] : staticGroup;
    const w = write[g];
    groups[g][w] = index[t * 3];
    groups[g][w + 1] = index[t * 3 + 1];
    groups[g][w + 2] = index[t * 3 + 2];
    write[g] = w + 3;
  }

  const parts: Partial<Record<TargetId, { geometry: BufferGeometry; center: [number, number, number] }>> = {};
  for (let gi = 0; gi < ids.length; gi++) {
    if (groups[gi].length === 0) continue;
    const g = buildSubsetGeometry(src, groups[gi]);
    g.computeBoundingBox();
    const bb = g.boundingBox;
    if (bb) {
      const center = new Vector3();
      bb.getCenter(center);
      g.translate(-center.x, -center.y, -center.z);
      g.computeBoundingBox();
      g.computeBoundingSphere();
      parts[ids[gi]] = { geometry: g, center: [center.x, center.y, center.z] };
    } else {
      parts[ids[gi]] = { geometry: g, center: [0, 0, 0] };
    }
  }

  const staticGeometry = groups[staticGroup].length ? buildSubsetGeometry(src, groups[staticGroup]) : new BufferGeometry();

  return { parts, staticGeometry, componentCount: compCount };
};

const HouseModelMultiMesh = ({
  onNavigate,
  lang = "zh",
  onHoverLabelChange,
  theme = "light",
  calibrationEnabled = false,
}: HeroAvatarViewerProps) => {
  const gltf = useGLTF(MODEL_URL);
  const sceneTemplate = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoveredMeshKey, setHoveredMeshKey] = useState<string | null>(null); // Track specific mesh being hovered
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [clickedLabel, setClickedLabel] = useState<{ label: string; position: [number, number, number] } | null>(null);
  const spotsRef = useRef<InteractiveSpot[]>([]);
  const [calibrationTarget, setCalibrationTarget] = useState<TargetId>("experience");
  const [manualBindings, setManualBindings] = useState<ManualBindings>({});
  const [lastHitName, setLastHitName] = useState("");
  const [bindingStep, setBindingStep] = useState(0);
  const [bindSuccessTarget, setBindSuccessTarget] = useState<TargetId | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const pointerMovedRef = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(BINDINGS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ManualBindings;
      setManualBindings(parsed);
    } catch {
      // ignore corrupted data
    }
  }, []);

  const saveBindings = (next: ManualBindings) => {
    setManualBindings(next);
    try {
      localStorage.setItem(BINDINGS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!calibrationEnabled) return;
    const nextTarget = BINDING_FLOW[Math.min(bindingStep, BINDING_FLOW.length - 1)];
    setCalibrationTarget(nextTarget);
  }, [bindingStep, calibrationEnabled]);

  useEffect(() => {
    if (!calibrationEnabled) return;
    const firstMissing = BINDING_FLOW.findIndex((id) => !manualBindings[id]);
    setBindingStep(firstMissing === -1 ? BINDING_FLOW.length : firstMissing);
  }, [calibrationEnabled, manualBindings]);

  const { normalizedScene, spots, hoverScene } = useMemo(() => {
    const scene = sceneTemplate.clone(true);
    const box = new Box3().setFromObject(scene);
    const center = new Vector3();
    const size = new Vector3();
    box.getCenter(center);
    box.getSize(size);
    scene.position.set(-center.x, -center.y, -center.z);

    const meshEntries: Array<{ mesh: Mesh; key: string; name: string; names: string[]; volume: number; center: Vector3; topY: number }> = [];
    const clayBase = theme === "dark" ? new Color("#9ca3af") : new Color("#f5f0e8");
    const clayHover = theme === "dark" ? new Color("#d1d5db") : new Color("#fffbf5");

    scene.traverse((obj) => {
      const mesh = obj as Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.visible = true; // Ensure all meshes are visible by default

      const key = `${mesh.uuid}:${mesh.name ?? ""}:${mesh.parent?.name ?? ""}`;
      mesh.userData.__spotKey = key;

      const names = new Set<string>();
      let ancestor: any = mesh;
      while (ancestor) {
        if (typeof ancestor.name === "string" && ancestor.name.trim()) {
          names.add(ancestor.name.toLowerCase().trim());
        }
        ancestor = ancestor.parent;
      }
      const n = [...names].join(" ");

      // Ignore original texture materials: keep a clean clay render like plantpot.
      const baseMat = new MeshStandardMaterial({
        color: clayBase.clone(),
        roughness: 0.95,
        metalness: 0.0,
        emissive: new Color("#000000"),
        emissiveIntensity: 0,
        side: DoubleSide,
        flatShading: false,
        envMapIntensity: 0.0, // Disable environment map reflection completely
      });
      // Used for hiding the base mesh while still allowing raycast hits.
      baseMat.userData.__isBaseClay = true;
      mesh.material = baseMat;

      console.log("[HouseModelMultiMesh] Mesh setup:", mesh.name, "visible:", mesh.visible, "color:", baseMat.color.getHexString());

      const meshBox = new Box3().setFromObject(mesh);
      const meshSize = new Vector3();
      const meshCenter = new Vector3();
      meshBox.getSize(meshSize);
      meshBox.getCenter(meshCenter);
      const volume = Math.max(0.00001, meshSize.x * meshSize.y * meshSize.z);
      meshEntries.push({ mesh, key, name: n, volume, center: meshCenter, topY: meshBox.max.y, names: [...names] });
    });

    // Some exports contain an outer "container" cube/box around the whole model.
    // Hide the largest mesh if it looks like that container, so the house itself remains visible.
    const allByVolume = [...meshEntries].sort((a, b) => b.volume - a.volume);
    const largestMesh = allByVolume[0];
    const secondMesh = allByVolume[1];
    if (largestMesh?.mesh && secondMesh?.mesh) {
      const ratio = secondMesh ? largestMesh.volume / Math.max(0.00001, secondMesh.volume) : Number.POSITIVE_INFINITY;
      const nameHint = /bounds|bound|collider|collision|proxy|box|cube|frame|helper/.test(largestMesh.name);
      // More conservative: only hide if there's a very strong signal it's a container
      // Increased threshold to avoid hiding actual model parts
      if ((nameHint && ratio >= 8) || ratio >= 15) {
        largestMesh.mesh.visible = false;
        console.log("[HouseModelMultiMesh] Hiding container mesh:", largestMesh.mesh.name, "ratio:", ratio);
      }
    }

    const used = new Set<string>();
    const orderedMeshes = meshEntries
      .filter((item) => item.center.y > 0.03)
      .sort((a, b) => b.volume - a.volume);
    const largestVolume = orderedMeshes[0]?.volume ?? 1;
    const clickCandidates = orderedMeshes.filter((item) => item.volume < largestVolume * 0.18 && item.volume > largestVolume * 0.0005);

    const fallbackAnchors = [
      new Vector3(-size.x * 0.18, size.y * 0.23, size.z * 0.32), // ladder -> experience
      new Vector3(size.x * 0.29, size.y * 0.2, size.z * 0.26), // bag -> education
      new Vector3(-size.x * 0.32, size.y * 0.11, size.z * 0.35), // chair -> home
      new Vector3(-size.x * 0.08, size.y * 0.16, size.z * 0.25), // flower pot -> works
      new Vector3(size.x * 0.22, size.y * 0.2, size.z * 0.3), // computer -> skills
      new Vector3(-size.x * 0.21, size.y * 0.2, size.z * 0.23), // sign -> contact
      new Vector3(size.x * 0.02, size.y * 0.42, -size.z * 0.06), // toy/life
    ];

    const spots: InteractiveSpot[] = [];

    interactions.forEach((rule, idx) => {
      const manualName = manualBindings[rule.id]?.toLowerCase?.() ?? "";

      // Find all meshes that match this rule (not just one)
      const matchingMeshes: typeof meshEntries = [];

      if (manualName) {
        // Manual binding: find all meshes with matching names
        matchingMeshes.push(
          ...meshEntries.filter(
            (item) => !used.has(item.mesh.uuid) && item.names.some((name) => name.includes(manualName))
          )
        );
      }

      if (matchingMeshes.length === 0) {
        // Keyword exact match: find all meshes with exact keyword match
        matchingMeshes.push(
          ...meshEntries.filter(
            (item) =>
              !used.has(item.mesh.uuid) &&
              (item.names.includes(rule.id) || rule.keywords.some((word) => item.names.includes(word)))
          )
        );
      }

      if (matchingMeshes.length === 0) {
        // Keyword loose match: find all meshes with partial keyword match
        matchingMeshes.push(
          ...meshEntries.filter(
            (item) =>
              !used.has(item.mesh.uuid) &&
              (item.names.includes(rule.id) || rule.keywords.some((word) => item.names.some((name) => name.includes(word))))
          )
        );
      }

      const anchor = fallbackAnchors[idx];

      if (matchingMeshes.length === 0) {
        // Fallback: find closest candidate
        const fallback = clickCandidates
          .filter((item) => !used.has(item.mesh.uuid))
          .sort((a, b) => a.center.distanceTo(anchor) - b.center.distanceTo(anchor))[0];
        const backupUnique = orderedMeshes
          .filter((item) => !used.has(item.mesh.uuid))
          .sort((a, b) => a.center.distanceTo(anchor) - b.center.distanceTo(anchor))[0];
        const chosen = fallback ?? backupUnique;
        if (chosen) matchingMeshes.push(chosen);
      }

      // Create a spot for each matching mesh
      matchingMeshes.forEach((chosen) => {
        used.add(chosen.mesh.uuid);

        // Special handling for flower_pot: split into 2 virtual spots (left and right)
        const meshName = chosen.mesh.name.toLowerCase();
        if ((meshName.includes('flower') || meshName.includes('pot')) && rule.id === 'works') {
          // Get mesh bounding box to determine split positions
          const bbox = new Box3().setFromObject(chosen.mesh);
          const center = new Vector3();
          bbox.getCenter(center);
          const size = new Vector3();
          bbox.getSize(size);

          // Create two spots: left and right
          const offset = size.x * 0.25; // 25% of width from center

          // Left pot
          spots.push({
            mesh: chosen.mesh,
            meshKey: `${chosen.key}_left`,
            id: rule.id,
            labelZh: rule.labelZh,
            labelEn: rule.labelEn,
            color: rule.color,
            position: [center.x - offset, chosen.topY + 0.08, center.z],
            hitCenter: [center.x - offset, center.y, center.z],
            hitRadius: 0.15,
          });

          // Right pot
          spots.push({
            mesh: chosen.mesh,
            meshKey: `${chosen.key}_right`,
            id: rule.id,
            labelZh: rule.labelZh,
            labelEn: rule.labelEn,
            color: rule.color,
            position: [center.x + offset, chosen.topY + 0.08, center.z],
            hitCenter: [center.x + offset, center.y, center.z],
            hitRadius: 0.15,
          });

          console.log(`[Debug] Split flower_pot into 2 virtual spots at x: ${center.x - offset} and ${center.x + offset}`);
        } else {
          // Normal single spot
          spots.push({
            mesh: chosen.mesh,
            meshKey: chosen.key,
            id: rule.id,
            labelZh: rule.labelZh,
            labelEn: rule.labelEn,
            color: rule.color,
            position: [chosen.center.x, chosen.topY + 0.08, chosen.center.z],
            hitCenter: [chosen.center.x, chosen.center.y, chosen.center.z],
            hitRadius: 0.15,
          });
        }
      });

      // If no meshes were found, create a fallback spot at the anchor position
      if (matchingMeshes.length === 0) {
        spots.push({
          mesh: null,
          meshKey: null,
          id: rule.id,
          labelZh: rule.labelZh,
          labelEn: rule.labelEn,
          color: rule.color,
          position: [anchor.x, anchor.y, anchor.z],
          hitCenter: [anchor.x, anchor.y, anchor.z],
          hitRadius: 0.15,
        });
      }

      // Debug: log how many meshes were found for this rule
      console.log(`[Spots] ${rule.id} (${rule.labelEn}): found ${matchingMeshes.length} meshes`);

      // Debug: for works, show all mesh names that contain flower or pot
      if (rule.id === 'works') {
        const allMeshNames: string[] = [];
        scene.traverse((obj) => {
          if ((obj as Mesh).isMesh) {
            const name = obj.name.toLowerCase();
            if (name.includes('flower') || name.includes('pot')) {
              allMeshNames.push(obj.name);
            }
          }
        });
        console.log(`[Debug] All meshes with 'flower' or 'pot' in name:`, allMeshNames);
        console.log(`[Debug] Total spots created for works:`, spots.filter(s => s.id === 'works').length);
        console.log(`[Debug] Works spots details:`, spots.filter(s => s.id === 'works').map(s => ({
          meshKey: s.meshKey,
          position: s.position
        })));
      }
    });

    const overlay = scene.clone(true) as Group;
    overlay.traverse((obj) => {
      const mesh = obj as Mesh;
      if (!mesh.isMesh) return;
      // Never let the overlay steal pointer hits.
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      (mesh as unknown as { raycast: () => void }).raycast = () => {};
      mesh.castShadow = true;
      mesh.receiveShadow = false;
      mesh.visible = false;
      const hoverMat = new MeshStandardMaterial({
        color: (theme === "dark" ? new Color("#fef3c7") : new Color("#fffef9")).clone(),
        roughness: 0.85,
        metalness: 0.0,
        emissive: (theme === "dark" ? new Color("#fbbf24") : new Color("#fef3c7")).clone(),
        emissiveIntensity: theme === "dark" ? 0.15 : 0.18,
        side: DoubleSide,
        flatShading: false,
        envMapIntensity: 0.0,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      });
      mesh.material = hoverMat;
      mesh.renderOrder = 2;
    });

    return { normalizedScene: scene, spots, hoverScene: overlay };
  }, [sceneTemplate, manualBindings, theme]);
  useEffect(() => {
    spotsRef.current = spots;
  }, [spots]);

  const hoverMeshById = useMemo(() => {
    const keyToMesh = new globalThis.Map<string, Mesh>();
    hoverScene.traverse((obj) => {
      const mesh = obj as Mesh;
      if (!mesh.isMesh) return;
      const key = (mesh.userData as any)?.__spotKey;
      if (typeof key === "string") keyToMesh.set(key, mesh);
    });
    // Map each spot to its hover mesh
    // For virtual spots (like flower_pot_left/right), they share the same physical mesh
    const map = new globalThis.Map<string, Mesh>();
    spots.forEach((spot) => {
      if (!spot.meshKey) return;
      // Extract base key (remove _left/_right suffix)
      const baseKey = spot.meshKey.replace(/_left$|_right$/, '');
      const m = keyToMesh.get(baseKey);
      if (m) map.set(spot.meshKey, m);
    });
    return map;
  }, [hoverScene, spots]);

  const baseMeshById = useMemo(() => {
    const keyToMesh = new globalThis.Map<string, Mesh>();
    normalizedScene.traverse((obj) => {
      const mesh = obj as Mesh;
      if (!mesh.isMesh) return;
      const key = (mesh.userData as any)?.__spotKey;
      if (typeof key === "string") keyToMesh.set(key, mesh);
    });
    // Map each spot to its base mesh
    // For virtual spots (like flower_pot_left/right), they share the same physical mesh
    const map = new globalThis.Map<string, Mesh>();
    spots.forEach((spot) => {
      if (!spot.meshKey) return;
      // Extract base key (remove _left/_right suffix)
      const baseKey = spot.meshKey.replace(/_left$|_right$/, '');
      const m = keyToMesh.get(baseKey);
      if (m) map.set(spot.meshKey, m);
    });
    return map;
  }, [normalizedScene, spots]);

  useEffect(() => {
    document.body.style.cursor = hoveredId ? "pointer" : "";
    const hoverSpot = spots.find((s) => s.id === hoveredId) ?? null;
    onHoverLabelChange?.(hoverSpot ? (lang === "en" ? `Go to ${hoverSpot.labelEn}` : `åæ¢å?{hoverSpot.labelZh}`) : null);
    return () => {
      document.body.style.cursor = "";
      onHoverLabelChange?.(null);
    };
  }, [hoveredId, lang, onHoverLabelChange, spots]);

  // Store original scales for each mesh
  const originalScalesRef = useRef(new globalThis.Map<string, Vector3>());
  const hoverScaleRef = useRef(new Vector3(1, 1, 1));

  useFrame(() => {
    // Keep hover overlay aligned with the base mesh to avoid double-image artifacts when zooming.
    // The hover overlay material uses polygonOffset so it can draw cleanly on top of the base surface.
    const targetScaleMultiplier = 1.0;
    // Iterate through all spots (not just interactions) to handle each mesh independently
    spots.forEach((spot) => {
      if (!spot.meshKey) return;

      const mesh = hoverMeshById.get(spot.meshKey);
      const baseMesh = baseMeshById.get(spot.meshKey);
      // Check if THIS specific mesh is hovered (not just the ID group)
      const isHovered = hoveredMeshKey === spot.meshKey;

      if (baseMesh) {
        baseMesh.castShadow = true;
        baseMesh.receiveShadow = true;
        baseMesh.visible = true;
      }

      if (mesh) {
        // Save original scale on first encounter
        if (!originalScalesRef.current.has(spot.meshKey)) {
          originalScalesRef.current.set(spot.meshKey, mesh.scale.clone());
        }

        const originalScale = originalScalesRef.current.get(spot.meshKey)!;
        mesh.visible = isHovered;
        mesh.castShadow = isHovered;

        // Scale relative to original size
        if (isHovered) {
          hoverScaleRef.current.set(
            originalScale.x * targetScaleMultiplier,
            originalScale.y * targetScaleMultiplier,
            originalScale.z * targetScaleMultiplier
          );
        } else {
          hoverScaleRef.current.copy(originalScale);
        }
        mesh.scale.lerp(hoverScaleRef.current, 0.38);
      }
    });
  });

  const meshToSpot = useMemo(() => {
    const map = new globalThis.Map<string, InteractiveSpot>();
    spots.forEach((spot) => {
      if (!spot.mesh) return;
      // Keep first binding to avoid later slots (e.g. life) overriding the same mesh.
      if (!map.has(spot.mesh.uuid)) map.set(spot.mesh.uuid, spot);
    });
    return map;
  }, [spots]);

  const resolveSpotByObject = (obj: Mesh | null): InteractiveSpot | null => {
    if (!obj) return null;
    let cursor: Mesh | null = obj;
    while (cursor) {
      const spot = meshToSpot.get(cursor.uuid);
      if (spot) return spot;
      cursor = (cursor.parent as Mesh | null) ?? null;
    }
    return null;
  };

  const resolveSpot = (e: ThreeEvent<PointerEvent | MouseEvent>) => {
    const hit = e.object as Mesh;
    const direct = resolveSpotByObject(hit);

    // For meshes that need position-based splitting (like flower_pot with 2 pots)
    if (direct && direct.mesh) {
      const meshName = direct.mesh.name.toLowerCase();

      // Check if this is a mesh that should be split by position
      if (meshName.includes('flower') || meshName.includes('pot')) {
        // Get the hit point in world coordinates
        const hitPoint = e.point;

        // Find all spots that share this mesh
        const spotsForThisMesh = spots.filter(s => s.mesh?.uuid === direct.mesh?.uuid);

        console.log(`[resolveSpot] Flower/pot mesh detected: ${meshName}`);
        console.log(`[resolveSpot] Hit point x: ${hitPoint.x}`);
        console.log(`[resolveSpot] Spots sharing this mesh: ${spotsForThisMesh.length}`);
        console.log(`[resolveSpot] Spot positions:`, spotsForThisMesh.map(s => ({ meshKey: s.meshKey, x: s.position[0] })));

        if (spotsForThisMesh.length > 1) {
          // Multiple spots share this mesh - determine which one based on hit position
          // Sort by x position and find closest
          let closestSpot = spotsForThisMesh[0];
          let minDistance = Infinity;

          spotsForThisMesh.forEach(spot => {
            const spotX = spot.position[0];
            const distance = Math.abs(hitPoint.x - spotX);
            if (distance < minDistance) {
              minDistance = distance;
              closestSpot = spot;
            }
          });

          console.log(`[resolveSpot] Selected spot: ${closestSpot.meshKey} at x: ${closestSpot.position[0]}`);
          return closestSpot;
        }
      }
    }

    if (direct) return direct;
    const intersection = e.intersections?.[0]?.object as Mesh | undefined;
    return resolveSpotByObject(intersection ?? null);
  };

  return (
    <group>
      <group
        onPointerDown={(e) => {
          pointerStartRef.current = { x: e.clientX, y: e.clientY };
          pointerMovedRef.current = false;
        }}
        onPointerMove={(e) => {
          const start = pointerStartRef.current;
          if (start) {
            const dx = e.clientX - start.x;
            const dy = e.clientY - start.y;
            if (Math.hypot(dx, dy) > 10) pointerMovedRef.current = true;
          }
          const spot = resolveSpot(e);
          setHoveredId(spot?.id ?? null);
          setHoveredMeshKey(spot?.meshKey ?? null); // Track specific mesh
        }}
        onPointerUp={() => {
          pointerStartRef.current = null;
        }}
        onPointerOut={() => {
          setHoveredId(null);
          setHoveredMeshKey(null); // Clear specific mesh hover
        }}
        onClick={(e) => {
          e.stopPropagation();
          console.log("[DEBUG] Click detected, pointerMoved:", pointerMovedRef.current, "calibrationEnabled:", calibrationEnabled);
          if (!calibrationEnabled && pointerMovedRef.current) return;
          const mesh = e.object as Mesh;
          const meshName = `${mesh.name ?? ""} ${mesh.parent?.name ?? ""}`.trim();
          console.log("[DEBUG] Clicked mesh:", meshName);
          console.log("[DEBUG] Mesh UUID:", mesh.uuid);
          setLastHitName(meshName);

          if (calibrationEnabled) {
            const target = BINDING_FLOW[Math.min(bindingStep, BINDING_FLOW.length - 1)];
            const nextBindings = { ...manualBindings, [target]: meshName };
            saveBindings(nextBindings);
            setSelectedId(target);
            setBindSuccessTarget(target);
            window.setTimeout(() => {
              setBindSuccessTarget((prev) => (prev === target ? null : prev));
            }, 900);
            setBindingStep((s) => Math.min(BINDING_FLOW.length, s + 1));
            return;
          }

          const spot = resolveSpot(e) ?? (hoveredId ? spots.find((s) => s.id === hoveredId) : null);
          console.log("[DEBUG] Resolved spot:", spot ? spot.id : "null");
          console.log("[DEBUG] Available spots:", spots.map(s => ({ id: s.id, meshName: s.mesh?.name, meshUUID: s.mesh?.uuid })));
          console.log("[DEBUG] onNavigate exists:", !!onNavigate);
          if (!spot) {
            console.log("[DEBUG] No spot found for this mesh");
            return;
          }
          setSelectedId(spot.id);

          // Show clicked label
          const labelText = LABELS[spot.id]?.[lang] || spot.id;
          const worldPos = new Vector3();
          mesh.getWorldPosition(worldPos);
          setClickedLabel({ label: labelText, position: [worldPos.x, worldPos.y + 0.3, worldPos.z] });

          // Hide label after 2 seconds
          setTimeout(() => {
            setClickedLabel(null);
          }, 2000);

          console.log("[DEBUG] Calling onNavigate with:", spot.id);
          onNavigate?.(spot.id);
        }}
      >
        <primitive object={normalizedScene} />
      </group>

      <group>
        <primitive object={hoverScene} />
      </group>

      <Html fullscreen style={{ pointerEvents: "none" }}>
        {calibrationEnabled ? (
          <div style={{ position: "absolute", right: "12px", top: "12px", pointerEvents: "auto", zIndex: 8 }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                padding: "8px",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(9,10,18,0.5)",
                backdropFilter: "blur(8px)",
                minWidth: "188px",
              }}
            >
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.94)", lineHeight: 1.5 }}>
                {bindingStep >= BINDING_FLOW.length
                  ? (lang === "en"
                      ? "Binding completed. Toggle off Bind to test hover/click."
                      : "\u7ed1\u5b9a\u5b8c\u6210\u3002\u8bf7\u5173\u95ed\u201c\u7ed1\u5b9a\u201d\u540e\u6d4b\u8bd5\u60ac\u505c/\u70b9\u51fb\u3002")
                  : (lang === "en"
                      ? "Click the object for each step."
                      : "\u8bf7\u6839\u636e\u6b65\u9aa4\u63d0\u793a\u70b9\u51fb\u5bf9\u5e94\u7269\u4ef6\u3002")}
              </div>

              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.82)", lineHeight: 1.5 }}>
                {lang === "en" ? "Progress" : "\u8fdb\u5ea6"}:{" "}
                <b>
                  {Math.min(bindingStep, BINDING_FLOW.length)}/{BINDING_FLOW.length}
                </b>
                <br />
                {lang === "en" ? "Current target" : "\u5f53\u524d\u76ee\u6807"}:{" "}
                <b>
                  {bindingStep >= BINDING_FLOW.length
                    ? (lang === "en" ? "Done" : "\u5b8c\u6210")
                    : (lang === "en"
                        ? interactions.find((x) => x.id === calibrationTarget)?.labelEn
                        : interactions.find((x) => x.id === calibrationTarget)?.labelZh)}
                </b>
                <br />
                {lang === "en" ? "Last mesh" : "\u6700\u8fd1\u7f51\u683c"}: <b>{lastHitName || "-"}</b>
              </div>

              <button
                type="button"
                onClick={() => {
                  saveBindings({});
                  setBindingStep(0);
                  setCalibrationTarget(BINDING_FLOW[0]);
                }}
                style={{
                  height: "30px",
                  borderRadius: "999px",
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.92)",
                  cursor: "pointer",
                  fontSize: "11px",
                  letterSpacing: "0.02em",
                }}
              >
                {lang === "en" ? "Reset binding" : "\u91cd\u7f6e\u7ed1\u5b9a"}
              </button>
            </div>
          </div>
        ) : null}
      </Html>
    </group>
  );
};

// Fallback: if a model is exported as a single merged mesh, the original intent was to split it into loose parts.
// The loose-parts implementation was removed/invalidated; keep the app functional by delegating to the multi-mesh path.
const HouseModelLooseParts = (props: HeroAvatarViewerProps) => {
  return <HouseModelMultiMesh {...props} />;
};

const HouseModelRouter = (props: HeroAvatarViewerProps) => {
  const gltf = useGLTF(MODEL_URL);
  const meshCount = useMemo(() => {
    let count = 0;
    gltf.scene.traverse((obj) => {
      const mesh = obj as Mesh;
      if (mesh && (mesh as any).isMesh) count += 1;
    });
    console.log("[HouseModelRouter] Model loaded, mesh count:", count);
    return count;
  }, [gltf.scene]);

  console.log("[HouseModelRouter] Rendering with meshCount:", meshCount);
  // If the model is a single merged mesh, split it by loose parts (connected components) at runtime.
  if (meshCount <= 1) return <HouseModelLooseParts {...props} />;
  return <HouseModelMultiMesh {...props} />;
};

const SceneRoom = ({ onNavigate, lang, onHoverLabelChange, theme, calibrationEnabled }: HeroAvatarViewerProps) => {
  const groupRef = useRef<Group | null>(null);

  console.log("[SceneRoom] Rendering");

  useFrame((state) => {
    if (!groupRef.current) return;
    // è½»å¾®çå·¦å³æå¨å¨ç»ï¼ä½å§ç»ä¿ææ­£é¢æåç¨æ?
    // åºç¡æè½¬è§åº¦ä¸?Math.PI/2ï¼?90åº¦ï¼ï¼ç¡®ä¿æ­£é¢æåç¸æ?
    groupRef.current.rotation.y = -Math.PI / 2 + Math.sin(state.clock.elapsedTime * 0.2) * 0.06;
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.004;
  });

  return (
    <group ref={groupRef} scale={[1.1, 1.1, 1.1]} position={[0, -0.08, 0]} rotation={[0, -Math.PI / 2, 0]}>
      <HouseModelRouter
        onNavigate={onNavigate}
        lang={lang}
        onHoverLabelChange={onHoverLabelChange}
        theme={theme}
        calibrationEnabled={calibrationEnabled}
      />
    </group>
  );
};

const ControlsRig = () => {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  useEffect(() => {
    if (!controlsRef.current) return;

    // è®¾ç½®ç¸æºçåæ¨¡åä¸­å¿
    controlsRef.current.target.set(0, 0.02, 0);

    // éç½®ç¸æºå°åå§æ­£é¢ä½ç½?
    camera.position.set(0, 0.42, 3.0);

    // æ´æ°æ§å¶å?
    controlsRef.current.update();
  }, [camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      minDistance={2.0}
      maxDistance={5.5}
      minPolarAngle={Math.PI / 3.2}
      maxPolarAngle={Math.PI / 1.45}
      autoRotate={false}
      enableDamping
      dampingFactor={0.08}
    />
  );
};

const CozyLamp = ({ enabled }: { enabled: boolean }) => {
  const warmLightRef = useRef<PointLight | null>(null);
  useFrame((state) => {
    if (!enabled || !warmLightRef.current) return;
    const t = state.clock.elapsedTime;
    warmLightRef.current.intensity = 1.2 + Math.sin(t * 3.4) * 0.18 + Math.sin(t * 7.1) * 0.08 + Math.sin(t * 13.2) * 0.04;
  });

  if (!enabled) return null;
  return (
    <group position={[0.03, 0.33, 0.18]}>
      <pointLight
        ref={warmLightRef}
        color={"#ffcc88"}
        intensity={1.35}
        distance={2.8}
        decay={1.4}
      />
      <pointLight
        color={"#ffb15e"}
        intensity={0.56}
        distance={1.35}
        decay={2.3}
        position={[0.02, -0.05, 0.03]}
      />
    </group>
  );
};

const HeroAvatarViewer = ({ onNavigate, lang, onHoverLabelChange, theme = "light", calibrationEnabled = false }: HeroAvatarViewerProps) => {
  const [assetReady, setAssetReady] = useState<"checking" | "ready" | "missing">("checking");

  console.log("[HeroAvatarViewer] Render - assetReady:", assetReady, "theme:", theme);

  useEffect(() => {
    let active = true;
    console.log("[HeroAvatarViewer] Checking model at:", MODEL_URL);
    fetch(MODEL_URL, { method: "HEAD" })
      .then((res) => {
        if (!active) return;
        console.log("[HeroAvatarViewer] Model check result:", res.ok ? "ready" : "missing", "status:", res.status);
        setAssetReady(res.ok ? "ready" : "missing");
      })
      .catch((err) => {
        if (!active) return;
        console.error("[HeroAvatarViewer] Model check failed:", err);
        setAssetReady("missing");
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      {/* 模型未就绪时显示全屏宠物加载动画 */}
      {assetReady !== "ready" && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: theme === "dark"
              ? "linear-gradient(180deg, #0a0a0f 0%, #0d0a1a 100%)"
              : "linear-gradient(180deg, #f9fbff 0%, #edf2fc 100%)",
            overflow: "hidden",
          }}
        >
          <Loader theme={theme} />
        </div>
      )}
    <Canvas
      shadows
      camera={{ position: [0, 0.42, 3.0], fov: 40 }}
      gl={{ localClippingEnabled: true }}
      style={{ position: "absolute", inset: 0 }}
    >
      {theme === "dark" ? (
        <>
          <ambientLight intensity={0.42} color={"#4a4458"} />
          <directionalLight position={[2.8, 3.4, 1.8]} intensity={0.38} color={"#c4b5a8"} castShadow />
          <directionalLight position={[-2.5, 3.0, 1.5]} intensity={0.25} color={"#9a8b94"} />
          <pointLight position={[-1.3, 0.9, -1.4]} intensity={0.26} color={"#8a7b94"} />
          <pointLight position={[0.6, -0.3, 1.0]} intensity={0.16} color={"#7a6a7a"} />
        </>
      ) : (
        <>
          <ambientLight intensity={0.65} color={"#faf8f3"} />
          <directionalLight position={[3.0, 4.0, 2.2]} intensity={1.5} color={"#fff5e1"} castShadow />
          <pointLight position={[0.2, 2.0, 0.4]} intensity={0.58} color={"#fef3e2"} />
          <pointLight position={[-1.4, 1.1, -1.5]} intensity={0.42} color={"#f5ead8"} />
          <pointLight position={[0.0, -0.2, 1.2]} intensity={0.22} color={"#ede5d8"} />
        </>
      )}

      {assetReady === "ready" ? (
        <Suspense fallback={<Loader theme={theme} />}>
          <SceneRoom
            onNavigate={onNavigate}
            lang={lang}
            onHoverLabelChange={onHoverLabelChange}
            theme={theme}
            calibrationEnabled={calibrationEnabled}
          />
          <CozyLamp enabled={theme === "dark"} />
          <Environment preset={theme === "dark" ? "night" : "apartment"} />
        </Suspense>
      ) : null}
      <ControlsRig />
    </Canvas>
    </>
  );
};

export default HeroAvatarViewer;

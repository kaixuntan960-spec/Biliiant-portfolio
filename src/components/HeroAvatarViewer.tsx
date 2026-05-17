import { Suspense, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Html, OrbitControls, useGLTF } from "@react-three/drei";
import {
  ACESFilmicToneMapping,
  Box3,
  Color,
  Group,
  Mesh,
  MeshStandardMaterial,
  Vector3,
} from "three";
import Matter from "matter-js";

const MODEL_MAP: Record<string, string> = {
  skills: "/models/pen_.glb",
  life: "/models/cake_.glb",
  honors: "/models/trophy.glb",
  experience: "/models/bag.glb",
  education: "/models/book_.glb",
  works: "/models/movie_.glb",
  contact: "/models/phone.glb",
};

// Preload all models
Object.values(MODEL_MAP).forEach((url) => useGLTF.preload(url));

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

type TargetId = "experience" | "education" | "home" | "works" | "skills" | "contact" | "life" | "honors" | "about";

type Interaction = {
  id: TargetId;
  labelZh: string;
  labelEn: string;
  color: string;
  keywords: string[];
};

const interactions: Interaction[] = [
  { id: "skills", labelZh: "技能", labelEn: "Skills", color: "#8b9dc3", keywords: [] },
  { id: "life", labelZh: "个人生活", labelEn: "Life", color: "#f3a777", keywords: [] },
  { id: "honors", labelZh: "个人荣誉", labelEn: "Honors", color: "#f5cf7d", keywords: [] },
  { id: "experience", labelZh: "工作经历", labelEn: "Experience", color: "#f3b08d", keywords: [] },
  { id: "education", labelZh: "教育经历", labelEn: "Education", color: "#c98262", keywords: [] },
  { id: "works", labelZh: "精选作品", labelEn: "Works", color: "#7bb6d8", keywords: [] },
  { id: "contact", labelZh: "联系我", labelEn: "Contact", color: "#9ec99a", keywords: [] },
];

const LABELS: Record<TargetId, { zh: string; en: string }> = {
  experience: { zh: "工作经历", en: "Experience" },
  education: { zh: "教育经历", en: "Education" },
  home: { zh: "首页", en: "Home" },
  works: { zh: "精选作品", en: "Works" },
  skills: { zh: "技能", en: "Skills" },
  life: { zh: "个人生活", en: "Life" },
  contact: { zh: "联系我", en: "Contact" },
  honors: { zh: "个人荣誉", en: "Honors" },
  about: { zh: "关于我", en: "About" },
};

/*** Scattered 3D Models ***/

const TARGET_SCALE = 0.28;

/* ---- Matter.js physics world constants ---- */
const PHY_HW = 1.8;   // half-width of the physics viewport
const PHY_HH = 1.0;   // half-height
const WALL_T = 0.4;
const BODY_R = 0.15;  // circular-body radius for each model

function createPhysicsWorld() {
  const engine = Matter.Engine.create({ gravity: { x: 0, y: 1.5 } });

  const wallOpts: Matter.IBodyDefinition = { isStatic: true, restitution: 0.5 };
  const walls = [
    Matter.Bodies.rectangle(0, PHY_HH + WALL_T / 2, PHY_HW * 2 + WALL_T * 2, WALL_T, wallOpts),
    Matter.Bodies.rectangle(0, -PHY_HH - WALL_T / 2, PHY_HW * 2 + WALL_T * 2, WALL_T, wallOpts),
    Matter.Bodies.rectangle(-PHY_HW - WALL_T / 2, 0, WALL_T, PHY_HH * 2 + WALL_T * 2, wallOpts),
    Matter.Bodies.rectangle(PHY_HW + WALL_T / 2, 0, WALL_T, PHY_HH * 2 + WALL_T * 2, wallOpts),
  ];

  const bodyOpts: Matter.IBodyDefinition = {
    restitution: 0.6,
    friction: 0.3,
    frictionAir: 0.015,
    density: 0.002,
  };

  const bodies = interactions.map(() => {
    const x = (Math.random() - 0.5) * PHY_HW * 1.4;
    const y = -PHY_HH - 0.6 - Math.random() * 0.8; // start above viewport
    const body = Matter.Bodies.circle(x, y, BODY_R, bodyOpts);
    Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.1);
    return body;
  });

  Matter.World.add(engine.world, [...walls, ...bodies]);

  const upImpulse = (id: TargetId) => {
    const idx = interactions.findIndex((i) => i.id === id);
    if (idx === -1) return;
    const b = bodies[idx];
    Matter.Body.applyForce(b, b.position, {
      x: (Math.random() - 0.5) * 0.004,
      y: -0.025,
    });
  };

  return { engine, bodies, walls, upImpulse };
}

/* ---- ScatteredModel — renders one GLB, driven by physics transforms ---- */

const ScatteredModel = ({
  modelUrl,
  targetId,
  lang,
  onNavigate,
  hoveredId,
  setHoveredId,
  clickedLabel,
  setClickedLabel,
  onRegisterGroup,
  onPhysicsClick,
}: {
  modelUrl: string;
  targetId: TargetId;
  lang: "zh" | "en";
  onNavigate?: (targetId: string) => void;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  clickedLabel: { id: TargetId; label: string } | null;
  setClickedLabel: (v: { id: TargetId; label: string } | null) => void;
  onRegisterGroup: (id: TargetId, g: Group) => void;
  onPhysicsClick: (id: TargetId) => void;
}) => {
  const gltf = useGLTF(modelUrl);
  const groupRef = useRef<Group>(null);
  const invalidate = useThree((st) => st.invalidate);
  const meshRefs = useRef<Mesh[]>([]);
  const isBook = targetId === "education";
  const springRef = useRef({ scale: 1, vel: 0 });
  const navigateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Register group ref so parent can sync physics transforms
  useEffect(() => {
    if (groupRef.current) onRegisterGroup(targetId, groupRef.current);
    return () => onRegisterGroup(targetId, null as unknown as Group);
  }, [targetId, onRegisterGroup]);

  const scene = useMemo(() => {
    const cloned = gltf.scene.clone(true);
    const box = new Box3().setFromObject(cloned);
    const center = new Vector3();
    const size = new Vector3();
    box.getCenter(center);
    box.getSize(size);
    const diag = Math.max(size.x, size.y, size.z);
    const scale = diag > 0 ? TARGET_SCALE / diag : 1;
    cloned.scale.setScalar(scale);
    cloned.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
    meshRefs.current = [];
    cloned.traverse((obj) => {
      const mesh = obj as Mesh;
      if (!mesh.isMesh) return;
      meshRefs.current.push(mesh);
      const origMat = mesh.material as MeshStandardMaterial;
      if (isBook) {
        mesh.material = new MeshStandardMaterial({
          color: new Color("#ffffff"),
          roughness: 0.8,
          metalness: 0.0,
          envMapIntensity: 0.0,
        });
      } else {
        mesh.material = new MeshStandardMaterial({
          color: origMat.color || new Color("#f0e8d8"),
          map: origMat.map || undefined,
          roughness: 0.6,
          metalness: 0.0,
          envMapIntensity: 0.0,
        });
      }
    });
    cloned.updateMatrixWorld(true);
    return cloned;
  }, [gltf.scene, isBook]);

  const isHovered = hoveredId === targetId;

  useEffect(() => {
    return () => { if (navigateTimerRef.current) clearTimeout(navigateTimerRef.current); };
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (!groupRef.current) return;
    // Spring animation
    const sp = springRef.current;
    const k = 22, d = 5.5;
    const f = (1 - sp.scale) * k - sp.vel * d;
    sp.vel += f * dt;
    sp.scale += sp.vel * dt;
    groupRef.current.scale.setScalar(sp.scale);

    // Hover glow
    meshRefs.current.forEach((mesh) => {
      const mat = mesh.material as MeshStandardMaterial;
      if (isHovered) {
        mat.emissive = new Color("#fbbf24");
        mat.emissiveIntensity = 0.3;
      } else {
        mat.emissive = new Color("#000000");
        mat.emissiveIntensity = 0;
      }
    });
    invalidate();
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    springRef.current.vel = -2.5;          // visual bounce
    onPhysicsClick(targetId);              // physics impulse

    if (navigateTimerRef.current) clearTimeout(navigateTimerRef.current);
    navigateTimerRef.current = setTimeout(() => {
      const labelText = LABELS[targetId]?.[lang] || targetId;
      setClickedLabel({ id: targetId, label: labelText });
      setTimeout(() => setClickedLabel(null), 2000);
      onNavigate?.(targetId);
    }, 280);
  };

  return (
    <group
      ref={groupRef}
      onClick={handleClick}
      onPointerEnter={(e) => {
        e.stopPropagation();
        setHoveredId(targetId);
        document.body.style.cursor = "pointer";
      }}
      onPointerLeave={() => {
        setHoveredId(null);
        document.body.style.cursor = "";
      }}
    >
      <primitive object={scene} />
    </group>
  );
};

/* ---- ScatteredModelsScene — physics engine + model orchestration ---- */

const ScatteredModelsScene = ({
  onNavigate,
  lang,
}: {
  onNavigate?: (targetId: string) => void;
  lang?: "zh" | "en";
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [clickedLabel, setClickedLabel] = useState<{ id: TargetId; label: string } | null>(null);
  const invalidate = useThree((st) => st.invalidate);

  const groupMap = useRef<Map<TargetId, Group>>(new Map());
  const physicsRef = useRef<ReturnType<typeof createPhysicsWorld> | null>(null);
  const initRef = useRef(false);

  // Initialise physics once
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    physicsRef.current = createPhysicsWorld();
    return () => {
      if (physicsRef.current) {
        Matter.World.clear(physicsRef.current.engine.world, false);
        Matter.Engine.clear(physicsRef.current.engine);
      }
    };
  }, []);

  // Step physics + push transforms into model groups
  useFrame((_, delta) => {
    const pw = physicsRef.current;
    if (!pw) return;
    Matter.Engine.update(pw.engine, Math.min(delta, 0.05) * 1000);

    pw.bodies.forEach((body, i) => {
      const id = interactions[i].id;
      const g = groupMap.current.get(id);
      if (!g) return;
      g.position.x = body.position.x;
      g.position.y = -body.position.y;   // invert Y (Matter.js → Three.js)
      g.rotation.z = body.angle;
    });

    invalidate();
  });

  const registerGroup = useCallback((id: TargetId, g: Group) => {
    groupMap.current.set(id, g);
  }, []);

  const handlePhysicsClick = useCallback((id: TargetId) => {
    physicsRef.current?.upImpulse(id);
  }, []);

  const hoveredInteraction = interactions.find((i) => i.id === hoveredId);

  return (
    <group>
      {interactions.map((interaction) => (
        <ScatteredModel
          key={interaction.id}
          modelUrl={MODEL_MAP[interaction.id]}
          targetId={interaction.id}
          lang={lang || "zh"}
          onNavigate={onNavigate}
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
          clickedLabel={clickedLabel}
          setClickedLabel={setClickedLabel}
          onRegisterGroup={registerGroup}
          onPhysicsClick={handlePhysicsClick}
        />
      ))}

      {/* Hover label — follows physics body position */}
      {hoveredInteraction && !clickedLabel && physicsRef.current && (() => {
        const idx = interactions.findIndex((i) => i.id === hoveredInteraction.id);
        const body = physicsRef.current.bodies[idx];
        if (!body) return null;
        return (
          <Html
            position={[body.position.x, -body.position.y + 0.3, 0]}
            center distanceFactor={1.2}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            <div style={{
              fontFamily: '"Shadows Into Light Two", cursive',
              fontSize: '15px', color: '#fff',
              textShadow: '0 1px 8px rgba(0,0,0,0.55)',
              background: 'rgba(0,0,0,0.2)',
              backdropFilter: 'blur(3px)',
              WebkitBackdropFilter: 'blur(3px)',
              padding: '2px 10px 4px 10px',
              borderRadius: '999px', whiteSpace: 'nowrap',
            }}>
              {lang === 'en' ? hoveredInteraction.labelEn : hoveredInteraction.labelZh}
            </div>
          </Html>
        );
      })()}

      {/* Clicked label */}
      {clickedLabel && physicsRef.current && (() => {
        const idx = interactions.findIndex((i) => i.id === clickedLabel.id);
        const body = physicsRef.current.bodies[idx];
        if (!body) return null;
        return (
          <Html
            position={[body.position.x, -body.position.y + 0.45, 0]}
            center distanceFactor={1.2}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            <div
              key={clickedLabel.id + clickedLabel.label}
              style={{
                fontFamily: '"Shadows Into Light Two", cursive',
                fontSize: '21px', color: '#fff',
                textShadow: '0 2px 12px rgba(0,0,0,0.6)',
                background: 'rgba(0,0,0,0.3)',
                backdropFilter: 'blur(5px)',
                WebkitBackdropFilter: 'blur(5px)',
                padding: '5px 16px 7px 16px',
                borderRadius: '999px', whiteSpace: 'nowrap',
                animation: 'fadeInScale 0.3s ease',
              }}
            >
              {clickedLabel.label}
            </div>
          </Html>
        );
      })()}
    </group>
  );
};

/** Plantpot-style: set scene background color (3D scene, not CSS) */
const SceneBackground = ({ theme }: { theme: "light" | "dark" }) => {
  const { scene } = useThree();
  useEffect(() => {
    scene.background = new Color(theme === "dark" ? "#1c1814" : "#FFFCF9");
    return () => { scene.background = null; };
  }, [scene, theme]);
  return null;
};

const ControlsRig = () => {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  useEffect(() => {
    if (!controlsRef.current) return;
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  }, [camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableRotate={false}
      enablePan={true}
      enableZoom={true}
      zoomSpeed={1.0}
      enableDamping
      dampingFactor={0.08}
      minZoom={0.4}
      maxZoom={2}
    />
  );
};

const HeroAvatarViewer = ({ onNavigate, lang, onHoverLabelChange, theme = "light", calibrationEnabled = false }: HeroAvatarViewerProps) => {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1.5, 2]}
      orthographic
      camera={{ position: [0, 0, 5], zoom: 1, near: 0.1, far: 100 }}
      gl={{ antialias: true, powerPreference: "high-performance", toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
      style={{ position: "absolute", inset: 0 }}
    >
      <SceneBackground theme={theme} />
      {/* Warm ambient light — theme-independent */}
      <ambientLight intensity={0.55} color={"#F0BB78"} />
      <directionalLight position={[3.0, 4.0, 2.2]} intensity={1.2} color={"#FFF5E1"} />
      <pointLight position={[0.2, 2.0, 0.4]} intensity={0.5} color={"#FEF3E2"} />
      <pointLight position={[-1.4, 1.1, -1.5]} intensity={0.35} color={"#F5EAD8"} />
      <pointLight position={[0.0, -0.2, 1.2]} intensity={0.2} color={"#EDE5D8"} />

      <Suspense fallback={null}>
        <ScatteredModelsScene onNavigate={onNavigate} lang={lang} />
        <Environment preset="city" />
      </Suspense>
      <ControlsRig />
    </Canvas>
  );
};

export default HeroAvatarViewer;

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Matter from "matter-js";
import { motion, AnimatePresence } from "motion/react";
import { Dices, Hand, Sun, Moon, Languages } from "lucide-react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useThemeMode } from "../theme";
import { useI18n } from "../i18n";

/* ---- Section config ---- */
const SECTIONS = [
  { id: "home", title: "Home", color: "#a78bfa", labelZh: "首页", labelEn: "Home" },
  { id: "skills", title: "Skills", color: "#8b9dc3", labelZh: "个人技能", labelEn: "Skills" },
  { id: "life", title: "Life", color: "#f3a777", labelZh: "个人生活", labelEn: "Life" },
  { id: "honors", title: "Honors", color: "#f5cf7d", labelZh: "个人荣誉", labelEn: "Honors" },
  { id: "experience", title: "Experience", color: "#f3b08d", labelZh: "工作经历", labelEn: "Experience" },
  { id: "education", title: "Education", color: "#c98262", labelZh: "教育经历", labelEn: "Education" },
  { id: "works", title: "Works", color: "#7bb6d8", labelZh: "精选作品", labelEn: "Works" },
  { id: "contact", title: "Contact", color: "#9ec99a", labelZh: "联系我", labelEn: "Contact" },
];

/* ---- GLB model mapping ---- */
const MODEL_MAP: Record<string, string> = {
  home: "/models/home.glb",
  skills: "/models/pen_.glb",
  life: "/models/cake_.glb",
  honors: "/models/trophy.glb",
  experience: "/models/bag.glb",
  education: "/models/book_.glb",
  works: "/models/movie_.glb",
  contact: "/models/phone.glb",
};

Object.values(MODEL_MAP).forEach((url) => useGLTF.preload(url));

/* ---- Per-model overrides ---- */
const MODEL_CONFIG: Record<string, { unlit?: boolean; tilt?: [number, number, number] }> = {
  education: { tilt: [0.8, Math.PI, 0] },
  skills: { tilt: [0.3, Math.PI, 0] },
};

const MODEL_COLOR_LIGHT = 0xffffff;
const MODEL_COLOR_DARK = 0xddd0f0;
const GRAB_RADIUS = 200;
const NAVBAR_H = 72;

function scrollToSection(id: string) {
  if (id === "home") {
    window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
    return;
  }
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - NAVBAR_H;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

interface ClawMachineHeroProps {
  onNavigate?: (id: string) => void;
}

interface BodyState {
  x: number;
  y: number;
  angle: number;
  modelUrl?: string;
  labelZh?: string;
  labelEn?: string;
}

const ALL_MODEL_URLS = Object.values(MODEL_MAP);

/* ---- R3F Model: matte ceramic material ---- */
function Model({ url, unlit, isDark, modelSize = 140 }: { url: string; unlit?: boolean; isDark: boolean; modelSize?: number }) {
  const { scene } = useGLTF(url);
  const modelColor = isDark ? MODEL_COLOR_DARK : MODEL_COLOR_LIGHT;
  const cloned = useMemo(() => {
    const c = scene.clone();
    c.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = new THREE.MeshPhysicalMaterial({
            color: modelColor,
            roughness: isDark ? 0.6 : 0.35,
            metalness: isDark ? 0.05 : 0.0,
            clearcoat: isDark ? 0.2 : 0.4,
            clearcoatRoughness: isDark ? 0.4 : 0.2,
            side: THREE.DoubleSide,
          });
      }
    });
    const box = new THREE.Box3().setFromObject(c);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const s = modelSize / maxDim;
    c.scale.setScalar(s);
    const center = box.getCenter(new THREE.Vector3());
    c.position.copy(center.clone().multiplyScalar(-s));
    return c;
  }, [scene, unlit, modelColor, modelSize, isDark]);

  return <primitive object={cloned} />;
}

/* ---- R3F Scene ---- */
function Scene({ bodyRef, isDark, extraCount }: { bodyRef: React.RefObject<BodyState[]>; isDark: boolean; extraCount: number }) {
  const { size, gl, scene } = useThree();
  const groupRefs = useRef<(THREE.Group | null)[]>([]);

  useEffect(() => {
    gl.setClearColor(0x000000, 0);
    gl.setClearAlpha(0);
    scene.background = null;
  }, [gl, scene]);

  useFrame(() => {
    const states = bodyRef.current;
    if (!states || states.length === 0) return;
    const halfW = size.width / 2;
    const halfH = size.height / 2;
    for (let i = 0; i < states.length; i++) {
      const g = groupRefs.current[i];
      if (!g) continue;
      const s = states[i];
      g.position.x = s.x - halfW;
      g.position.y = -(s.y - halfH);
      g.rotation.z = s.angle;
    }
  });

  const totalCount = SECTIONS.length + extraCount;

  return (
    <>
      {SECTIONS.map((sec, i) => {
        const cfg = MODEL_CONFIG[sec.id];
        const isHome = sec.id === "home";
        return (
          <group key={sec.id} ref={(el) => { groupRefs.current[i] = el; }}>
            <group rotation={cfg?.tilt ?? [0, 0, 0]}>
              <Model url={MODEL_MAP[sec.id]} unlit={cfg?.unlit} isDark={isDark} modelSize={isHome ? 180 : 140} />
            </group>
          </group>
        );
      })}
      {Array.from({ length: extraCount }).map((_, i) => {
        const idx = SECTIONS.length + i;
        const state = bodyRef.current?.[idx];
        const url = state?.modelUrl || ALL_MODEL_URLS[i % ALL_MODEL_URLS.length];
        return (
          <group key={`extra-${i}`} ref={(el) => { groupRefs.current[idx] = el; }}>
            <Model url={url} isDark={isDark} modelSize={120} />
          </group>
        );
      })}
      <ambientLight intensity={isDark ? 1.8 : 3.0} />
      <directionalLight position={[4, 8, 6]} intensity={isDark ? 3.5 : 2.0} />
      <directionalLight position={[-3, 5, -4]} intensity={isDark ? 2.0 : 1.0} />
      <directionalLight position={[-5, 2, 3]} intensity={isDark ? 1.5 : 1.0} color={isDark ? 0xa855f7 : 0x7c3aed} />
      <directionalLight position={[5, -1, 4]} intensity={isDark ? 0.8 : 0.5} color={isDark ? 0xc084fc : 0x9333ea} />
    </>
  );
}

/* ---- Main Component ---- */
export default function ClawMachineHero({ onNavigate }: ClawMachineHeroProps) {
  const { mode, setMode, resolvedTheme } = useThemeMode();
  const { lang, setLang } = useI18n();
  const isDark = resolvedTheme === "dark";

  const containerRef = useRef<HTMLDivElement>(null);
  const langRef = useRef(lang);
  langRef.current = lang;
  const engineRef = useRef<Matter.Engine>(Matter.Engine.create({ enableSleeping: false }));
  const requestRef = useRef<number>(0);
  const mousePos = useRef({ x: -1000, y: -1000 });
  const clawXRef = useRef(0);
  const clawYRef = useRef(0);
  const bodiesRef = useRef<Matter.Body[]>([]);
  const mouseConstraintRef = useRef<Matter.MouseConstraint | null>(null);
  const bodyStatesRef = useRef<BodyState[]>([]);
  const labelsRef = useRef<HTMLDivElement>(null);

  const [clawX, setClawX] = useState(0);
  const [clawY, setClawY] = useState(0);
  const [isClawMoving, setIsClawMoving] = useState(false);
  const [grabbedTitle, setGrabbedTitle] = useState<string | null>(null);
  const [showActive, setShowActive] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [extraModels, setExtraModels] = useState(0);
  const grabConstraint = useRef<Matter.Constraint | null>(null);

  const togglesRef = useRef<HTMLDivElement>(null);

  // Block all pointer/mouse events from reaching Matter.js via native listeners
  useEffect(() => {
    const el = togglesRef.current;
    if (!el) return;
    const stop = (e: Event) => { e.stopPropagation(); e.stopImmediatePropagation(); };
    el.addEventListener("mousedown", stop, true);
    el.addEventListener("mouseup", stop, true);
    el.addEventListener("pointerdown", stop, true);
    el.addEventListener("pointerup", stop, true);
    el.addEventListener("touchstart", stop, true);
    return () => {
      el.removeEventListener("mousedown", stop, true);
      el.removeEventListener("mouseup", stop, true);
      el.removeEventListener("pointerdown", stop, true);
      el.removeEventListener("pointerup", stop, true);
      el.removeEventListener("touchstart", stop, true);
    };
  }, []);
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 },
    );
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Label position sync
  const updateLabels = useCallback(() => {
    const labels = labelsRef.current;
    if (!labels) return;
    const states = bodyStatesRef.current;
    const children = labels.children as HTMLCollectionOf<HTMLElement>;
    for (let i = 0; i < states.length && i < children.length; i++) {
      children[i].style.transform = `translate(${states[i].x}px, ${states[i].y + 70}px) translate(-50%, 0)`;
    }
    requestAnimationFrame(updateLabels);
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(updateLabels);
    return () => cancelAnimationFrame(id);
  }, [updateLabels]);

  // Physics engine setup
  useEffect(() => {
    if (!containerRef.current) return;
    const engine = engineRef.current;
    engine.gravity.y = 1.0;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const thickness = 1000;
    const floorOffset = 140;

    const ground = Matter.Bodies.rectangle(w / 2, h + thickness / 2 - floorOffset, w * 4, thickness, {
      isStatic: true, friction: 0.9, restitution: 1.0, label: "ground",
    });
    const ceiling = Matter.Bodies.rectangle(w / 2, -thickness / 2, w * 4, thickness, {
      isStatic: true, friction: 0, label: "ceiling",
    });
    const wallLeft = Matter.Bodies.rectangle(-thickness / 2, h / 2, thickness, h * 4, {
      isStatic: true, friction: 0.5, label: "wallLeft",
    });
    const wallRight = Matter.Bodies.rectangle(w + thickness / 2, h / 2, thickness, h * 4, {
      isStatic: true, friction: 0.5, label: "wallRight",
    });
    Matter.World.add(engine.world, [ground, ceiling, wallLeft, wallRight]);

    const radius = 64;
    const newBodies = SECTIONS.map((sec, i) => {
      const isHome = sec.id === "home";
      const bodyRadius = isHome ? 80 : radius;
      const x = isHome ? w / 2 : (w / (SECTIONS.length)) * (i);
      const y = isHome ? h * 0.22 : radius + i * 30;
      const body = Matter.Bodies.circle(x, y, bodyRadius, {
        restitution: 0.4, friction: 0.4, frictionStatic: 0.1,
        frictionAir: isHome ? 0.03 : 0.015, density: isHome ? 0.004 : 0.002, label: sec.title,
      });
      return { body, section: sec };
    });

    bodiesRef.current = newBodies.map((b) => b.body);
    Matter.World.add(engine.world, newBodies.map((b) => b.body));

    const mouse = Matter.Mouse.create(containerRef.current);
    mouse.element.removeEventListener("wheel", (mouse as any).mousewheel);
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.05, damping: 0.1, render: { visible: false } },
    });
    mouseConstraintRef.current = mouseConstraint;
    Matter.World.add(engine.world, mouseConstraint);

    const update = (time: number) => {
      Matter.Engine.update(engine, 1000 / 60);
      const cw = window.innerWidth;
      const ch = window.innerHeight;

      newBodies.forEach((b) => {
        const dx = b.body.position.x - mousePos.current.x;
        const dy = b.body.position.y - mousePos.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 300) {
          const forceMag = (1 - dist / 300) * 0.012;
          Matter.Body.applyForce(b.body, b.body.position, {
            x: (dx / (dist || 1)) * forceMag,
            y: (dy / (dist || 1)) * forceMag,
          });
        }
        Matter.Body.applyForce(b.body, b.body.position, {
          x: Math.sin(time * 0.003 + newBodies.indexOf(b)) * 0.0002,
          y: 0,
        });
        if (b.body.position.y < -100) {
          const atChute = b.body.position.x > cw / 2 - 160 && b.body.position.x < cw / 2 + 160;
          if (atChute) {
            Matter.Body.setPosition(b.body, { x: 100 + Math.random() * (cw - 200), y: ch + 300 });
            Matter.Body.setVelocity(b.body, { x: 0, y: -20 });
          } else {
            Matter.Body.setPosition(b.body, { x: b.body.position.x, y: 100 });
            Matter.Body.setVelocity(b.body, { x: (Math.random() - 0.5) * 10, y: 12 });
          }
        }
        if (b.body.position.y > ch + 500) Matter.Body.setPosition(b.body, { x: cw / 2, y: ch / 2 });
        if (b.body.position.x < -200) Matter.Body.setPosition(b.body, { x: cw + 100, y: b.body.position.y });
        if (b.body.position.x > cw + 200) Matter.Body.setPosition(b.body, { x: -100, y: b.body.position.y });
      });

      bodyStatesRef.current = bodiesRef.current.map((body, i) => ({
        x: body.position.x,
        y: body.position.y,
        angle: body.angle,
        modelUrl: bodyStatesRef.current[i]?.modelUrl,
        labelZh: bodyStatesRef.current[i]?.labelZh,
        labelEn: bodyStatesRef.current[i]?.labelEn,
      }));
      requestRef.current = requestAnimationFrame(update);
    };
    requestRef.current = requestAnimationFrame(update);

    const handleResize = () => {
      const nw = window.innerWidth;
      const nh = window.innerHeight;
      newBodies.forEach((b) => {
        Matter.Body.translate(b.body, { x: (nw - w) * 0.5, y: (nh - h) * 0.5 });
        Matter.Body.applyForce(b.body, b.body.position, { x: (Math.random() - 0.5) * 0.05, y: -0.05 });
      });
      Matter.Body.setPosition(ground, { x: nw / 2, y: nh + thickness / 2 - floorOffset });
      Matter.Body.setPosition(ceiling, { x: nw / 2, y: -thickness / 2 });
      Matter.Body.setPosition(wallLeft, { x: -thickness / 2, y: nh / 2 });
      Matter.Body.setPosition(wallRight, { x: nw + thickness / 2, y: nh / 2 });
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(requestRef.current);
      Matter.World.clear(engine.world, false);
      Matter.Engine.clear(engine);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (isClawMoving) return;
    const x = e.clientX - rect.left;
    setClawX(x);
    clawXRef.current = x;
    mousePos.current = { x: e.clientX, y: e.clientY };
  };

  const lastClickTime = useRef(0);
  const handleContainerClick = (e: React.MouseEvent) => {
    if (isClawMoving) return;
    const now = Date.now();
    if (now - lastClickTime.current < 300) return;
    lastClickTime.current = now;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const allBodies = Matter.Composite.allBodies(engineRef.current.world);
    const clickedOnBody = allBodies.some((b) => {
      if (b.isStatic) return false;
      const dx = b.position.x - x;
      const dy = b.position.y - y;
      return Math.sqrt(dx * dx + dy * dy) < 100;
    });
    if (clickedOnBody) return;
    const secIdx = Math.floor(Math.random() * SECTIONS.length);
    const sec = SECTIONS[secIdx];
    const url = MODEL_MAP[sec.id];
    const body = Matter.Bodies.circle(x, y, 55, {
      restitution: 0.5, friction: 0.3, frictionAir: 0.015,
      density: 0.004, label: sec.title,
    });
    Matter.Body.setVelocity(body, { x: (Math.random() - 0.5) * 2, y: 5 });
    Matter.World.add(engineRef.current.world, body);
    bodiesRef.current.push(body);
    bodyStatesRef.current.push({ x, y, angle: 0, modelUrl: url, labelZh: sec.labelZh, labelEn: sec.labelEn });
    setExtraModels((n) => n + 1);
  };

  const triggerShake = () => {
    engineRef.current.world.bodies.forEach((body) => {
      if (body.isStatic) return;
      Matter.Body.applyForce(body, body.position, {
        x: (Math.random() - 0.5) * 2.0,
        y: -4 - Math.random() * 4,
      });
    });
  };

  const executeGrabbingSequence = async () => {
    if (isClawMoving) return;
    setIsClawMoving(true);
    if (mouseConstraintRef.current) (mouseConstraintRef.current as any).enabled = false;

    const targetHeight = window.innerHeight - 240;
    const engine = engineRef.current;

    let currentY = 0;
    const descend = setInterval(() => {
      currentY += 15;
      setClawY(currentY);
      clawYRef.current = currentY;
      if (currentY >= targetHeight) {
        clearInterval(descend);
        checkAndGrab();
      }
    }, 16);

    const checkAndGrab = () => {
      const allBodies = Matter.Composite.allBodies(engine.world);
      const candidates = allBodies.filter((b) => !b.isStatic && b.label !== "ground");
      let closest: Matter.Body | null = null;
      let minDist = GRAB_RADIUS;

      candidates.forEach((b) => {
        const dx = b.position.x - clawXRef.current;
        const dy = b.position.y - targetHeight;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          closest = b;
        }
      });

      const grabbedSection = closest
        ? SECTIONS.find((s) => s.title === (closest as any).label) ?? null
        : null;

      if (closest && grabbedSection) {
        setGrabbedTitle(grabbedSection.title);
        grabConstraint.current = Matter.Constraint.create({
          pointA: { x: clawXRef.current, y: targetHeight },
          bodyB: closest,
          stiffness: 0.9,
          damping: 0.05,
          length: 0,
        });
        Matter.World.add(engine.world, grabConstraint.current);
      }

      setTimeout(() => {
        const ascend = setInterval(() => {
          currentY -= 8;
          setClawY(currentY);
          clawYRef.current = currentY;
          if (grabConstraint.current) {
            grabConstraint.current.pointA.y = currentY;
            grabConstraint.current.pointA.x = clawXRef.current;
          }
          if (currentY <= 0) {
            clearInterval(ascend);
            if (grabbedSection) handleExtract(grabbedSection);
            else finishSequence();
          }
        }, 16);
      }, 500);
    };

    const handleExtract = (section: (typeof SECTIONS)[number]) => {
      setShowActive(section.title);
      if (grabConstraint.current) {
        Matter.World.remove(engine.world, grabConstraint.current);
        grabConstraint.current = null;
      }
      setGrabbedTitle(null);

      const modelUrl = MODEL_MAP[section.id];

      // Calculate distance to target section for speed scaling
      const targetEl = document.getElementById(section.id);
      const heroBottom = window.innerHeight;
      const targetTop = targetEl ? targetEl.getBoundingClientRect().top + window.scrollY : heroBottom;
      const distance = Math.abs(targetTop - heroBottom);
      const maxDist = document.documentElement.scrollHeight - heroBottom;
      const ratio = Math.min(distance / (maxDist || 1), 1);
      // Near sections: longer fall time; far sections: shorter fall time
      const fallDelay = Math.round(600 + (1 - ratio) * 400);
      const navDelay = Math.round(fallDelay + 200);
      const fallVelocity = Math.round(10 + ratio * 20);

      // Step 1: scroll to Hero so user can see the landing zone
      setTimeout(() => {
        setShowActive(null);
        finishSequence();
        window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
      }, 400);

      // Step 2: dispatch model after scroll completes — user sees it fall
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("model-landed", {
          detail: { modelUrl, labelZh: section.labelZh, labelEn: section.labelEn, color: section.color, sectionId: section.id, fallVelocity },
        }));
      }, 800);

      // Step 3: navigate to target section — timed to match fall speed
      setTimeout(() => {
        if (onNavigate) onNavigate(section.id);
        else scrollToSection(section.id);
      }, 800 + navDelay);
    };

    const finishSequence = () => {
      if (grabConstraint.current) {
        Matter.World.remove(engine.world, grabConstraint.current);
        grabConstraint.current = null;
      }
      setGrabbedTitle(null);
      setClawY(0);
      clawYRef.current = 0;
      setIsClawMoving(false);
      if (mouseConstraintRef.current) (mouseConstraintRef.current as any).enabled = true;
    };
  };

  const activeSection = showActive ? SECTIONS.find((s) => s.title === showActive) : null;
  const activeLabel = activeSection
    ? lang === "en" ? activeSection.labelEn : activeSection.labelZh
    : "";

  return (
    <div className="relative w-full h-screen overflow-hidden select-none" style={{ background: "var(--claw-bg)" }}>
      {/* Theme & Language toggles — OUTSIDE Matter.js container */}
      <div ref={togglesRef} className="absolute top-6 right-6 z-50 flex items-center gap-2">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const scrollY = window.scrollY;
            setMode(mode === "light" ? "dark" : "light");
            requestAnimationFrame(() => window.scrollTo(0, scrollY));
          }}
          className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 hover:scale-110"
          style={{ background: "var(--glass-soft)", border: "1px solid var(--glass-strong)" }}
          title={mode === "light" ? "Dark mode" : "Light mode"}
        >
          {isDark ? <Sun className="w-4 h-4" style={{ color: "var(--foreground)" }} /> : <Moon className="w-4 h-4" style={{ color: "var(--foreground)" }} />}
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const scrollY = window.scrollY;
            setLang(lang === "zh" ? "en" : "zh");
            requestAnimationFrame(() => window.scrollTo(0, scrollY));
          }}
          className="h-10 px-3 rounded-full flex items-center gap-1.5 backdrop-blur-md transition-all duration-300 hover:scale-105"
          style={{ background: "var(--glass-soft)", border: "1px solid var(--glass-strong)" }}
        >
          <Languages className="w-4 h-4" style={{ color: "var(--foreground)" }} />
          <span className="text-xs font-medium" style={{ color: "var(--foreground)" }}>{lang === "zh" ? "EN" : "中文"}</span>
        </button>
      </div>

      {/* Matter.js physics container */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onClick={handleContainerClick}
        onMouseLeave={() => { mousePos.current = { x: -1000, y: -1000 }; }}
        className="absolute inset-0 z-0"
      >

      {/* R3F Canvas */}
      <Canvas
        orthographic
        camera={{ position: [0, 0, 500], near: 0.1, far: 1000, zoom: 1 }}
        style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "transparent" }}
        dpr={[1, 2]}
        frameloop="always"
        gl={{ alpha: true }}
        onCreated={({ gl }) => { gl.setClearColor(0x000000, 0); gl.setClearAlpha(0); gl.domElement.style.background = "transparent"; }}
      >
        <Scene bodyRef={bodyStatesRef} isDark={isDark} extraCount={extraModels} />
      </Canvas>

      {/* Model labels overlay */}
      <div ref={labelsRef} className="absolute pointer-events-none z-30" style={{ inset: "-20px", padding: "20px" , overflow: "hidden" }}>
        {SECTIONS.map((sec) => (
          <div
            key={sec.id}
            className="absolute top-0 left-0 whitespace-nowrap"
            style={{ willChange: "transform" }}
          >
            <span
              className="inline-block px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider backdrop-blur-md"
              style={{
                background: isDark
                  ? "rgba(168, 85, 247, 0.12)"
                  : "rgba(124, 58, 237, 0.08)",
                color: isDark
                  ? "rgba(192, 132, 252, 0.9)"
                  : "rgba(124, 58, 237, 0.75)",
                border: `1px solid ${isDark ? "rgba(168, 85, 247, 0.2)" : "rgba(124, 58, 237, 0.15)"}`,
                boxShadow: isDark
                  ? "0 2px 8px rgba(168, 85, 247, 0.1)"
                  : "0 2px 8px rgba(124, 58, 237, 0.06)",
              }}
            >
              {lang === "en" ? sec.labelEn : sec.labelZh}
            </span>
          </div>
        ))}
        {Array.from({ length: extraModels }).map((_, i) => {
          const state = bodyStatesRef.current[SECTIONS.length + i];
          const label = state ? (lang === "en" ? state.labelEn : state.labelZh) : "";
          return (
            <div
              key={`extra-label-${i}`}
              className="absolute top-0 left-0 whitespace-nowrap"
              style={{ willChange: "transform" }}
            >
              <span
                className="inline-block px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider backdrop-blur-md"
                style={{
                  background: isDark
                    ? "rgba(168, 85, 247, 0.12)"
                    : "rgba(124, 58, 237, 0.08)",
                  color: isDark
                    ? "rgba(192, 132, 252, 0.9)"
                    : "rgba(124, 58, 237, 0.75)",
                  border: `1px solid ${isDark ? "rgba(168, 85, 247, 0.2)" : "rgba(124, 58, 237, 0.15)"}`,
                  boxShadow: isDark
                    ? "0 2px 8px rgba(168, 85, 247, 0.1)"
                    : "0 2px 8px rgba(124, 58, 237, 0.06)",
                }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Crane mechanism */}
      <div className="absolute inset-0 pointer-events-none z-40">
        <div
          className="absolute top-0 transition-transform duration-100 ease-out h-screen"
          style={{ transform: `translateX(${clawX}px)` }}
        >
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] origin-top"
            style={{
              height: `${clawY}px`,
              background: isDark
                ? "linear-gradient(to bottom, #555, #888, #555)"
                : "linear-gradient(to bottom, #d1d5db, #9ca3af, #d1d5db)",
            }}
          />
          <div
            className="absolute transition-all duration-300 flex items-center justify-center p-4"
            style={{ top: `${clawY}px`, left: "50%", transform: "translate(-50%, -50%)" }}
          >
            <div
              className="w-14 h-14 border rounded-full shadow-lg flex items-center justify-center"
              style={{
                borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                background: isDark
                  ? "linear-gradient(to bottom right, #2a2a35, #1a1a24)"
                  : "linear-gradient(to bottom right, #ffffff, #f3f4f6)",
              }}
            >
              <div
                className={`w-4 h-4 rounded-full transition-all duration-300 ${
                  grabbedTitle
                    ? "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)] scale-110"
                    : "scale-90"
                }`}
                style={{ background: grabbedTitle ? undefined : isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)" }}
              />
            </div>
            <div className="absolute flex gap-10 top-1/2">
              <motion.div
                animate={{ rotate: grabbedTitle ? 45 : 20 }}
                className="w-2 h-12 rounded-full origin-top shadow-sm"
                style={{ background: isDark ? "linear-gradient(to bottom, #555, #777)" : "linear-gradient(to bottom, #9ca3af, #6b7280)" }}
              />
              <motion.div
                animate={{ rotate: grabbedTitle ? -45 : -20 }}
                className="w-2 h-12 rounded-full origin-top shadow-sm"
                style={{ background: isDark ? "linear-gradient(to bottom, #555, #777)" : "linear-gradient(to bottom, #9ca3af, #6b7280)" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hints */}
      {!isClawMoving && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 opacity-0 animate-[fadeIn_0.8s_2.5s_forwards] pointer-events-none z-30">
          <div className="flex flex-col items-center gap-2.5">
            <span
              className="text-[13px] font-light tracking-[0.06em]"
              style={{ color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)" }}
            >
              {lang === "en" ? "Click empty space for a surprise" : "点击空白位置有惊喜"}
            </span>
            <span
              className="text-[13px] font-light tracking-[0.06em]"
              style={{ color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)" }}
            >
              {lang === "en" ? "Try dragging models to grab" : "试着拖拽模型来抓取模块"}
            </span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div
        className={`fixed bottom-12 left-0 w-full flex justify-center items-center gap-6 z-[70] pointer-events-none transition-all duration-500 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <button
          onClick={(e) => { e.stopPropagation(); triggerShake(); }}
          className="group pointer-events-auto relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
          style={{
            background: isDark
              ? "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(192,132,252,0.08))"
              : "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(99,102,241,0.04))",
            border: `1px solid ${isDark ? "rgba(168,85,247,0.3)" : "rgba(124,58,237,0.2)"}`,
            boxShadow: isDark
              ? "0 8px 32px rgba(168,85,247,0.15), inset 0 1px 0 rgba(255,255,255,0.05)"
              : "0 8px 32px rgba(124,58,237,0.1), inset 0 1px 0 rgba(255,255,255,0.6)",
            backdropFilter: "blur(12px)",
          }}
          title="Shuffle"
        >
          <Dices className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-500 group-hover:rotate-180" style={{ color: isDark ? "rgba(192,132,252,0.9)" : "rgba(124,58,237,0.8)" }} strokeWidth={1.5} />
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); executeGrabbingSequence(); }}
          disabled={isClawMoving}
          className={`group pointer-events-auto relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
            isClawMoving ? "opacity-50" : "hover:scale-110 active:scale-95"
          }`}
          style={{
            background: isClawMoving
              ? (isDark ? "rgba(255,100,100,0.15)" : "rgba(220,38,38,0.08)")
              : (isDark
                ? "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(232,255,71,0.08))"
                : "linear-gradient(135deg, rgba(124,58,237,0.1), rgba(99,102,241,0.05))"),
            border: `1px solid ${isClawMoving ? "rgba(255,100,100,0.3)" : (isDark ? "rgba(168,85,247,0.3)" : "rgba(124,58,237,0.2)")}`,
            boxShadow: isDark
              ? "0 8px 32px rgba(168,85,247,0.15), inset 0 1px 0 rgba(255,255,255,0.05)"
              : "0 8px 32px rgba(124,58,237,0.1), inset 0 1px 0 rgba(255,255,255,0.6)",
            backdropFilter: "blur(12px)",
          }}
          title="Grab"
        >
          <Hand className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300 ${isClawMoving ? "animate-pulse" : ""}`} style={{ color: isClawMoving ? "rgba(255,100,100,0.9)" : (isDark ? "rgba(192,132,252,0.9)" : "rgba(124,58,237,0.8)") }} strokeWidth={1.5} />
        </button>
      </div>

      {/* Active notification — glass card style */}
      <AnimatePresence>
        {showActive && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed top-12 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-2xl flex items-center gap-3 pointer-events-none backdrop-blur-xl"
            style={{
              background: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.75)",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"}`,
              boxShadow: isDark
                ? "0 20px 60px rgba(0,0,0,0.4)"
                : "0 20px 60px rgba(0,0,0,0.08)",
            }}
          >
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span
              className="text-xs font-semibold tracking-wide"
              style={{ color: "var(--foreground)" }}
            >
              {lang === "en" ? `Opening: ${activeLabel}` : `正在打开：${activeLabel}`}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}

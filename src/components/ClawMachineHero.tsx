import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Matter from "matter-js";
import { motion, AnimatePresence } from "motion/react";
import { Dices } from "lucide-react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useThemeMode } from "../theme";
import { useI18n } from "../i18n";

/* ---- Section config ---- */
const SECTIONS = [
  { id: "about", title: "About", color: "#a78bfa", labelZh: "关于我", labelEn: "About" },
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
  about: "/models/home.glb",
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
    const heroEl = document.getElementById("hero-section");
    const heroBottom = heroEl ? heroEl.getBoundingClientRect().bottom + window.scrollY : window.innerHeight;
    window.scrollTo({ top: heroBottom, behavior: "smooth" });
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
        const isHome = sec.id === "about";
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
  const { resolvedTheme } = useThemeMode();
  const { lang } = useI18n();
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
  const [extraModels] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const dismissOnboarding = () => {
    setShowOnboarding(false);
  };
  const grabConstraint = useRef<Matter.Constraint | null>(null);

  const togglesRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);

  // Block all pointer/mouse events from reaching Matter.js via native listeners
  useEffect(() => {
    const els = [togglesRef.current, controlsRef.current].filter(Boolean) as HTMLElement[];
    const stop = (e: Event) => { e.stopPropagation(); e.stopImmediatePropagation(); };
    els.forEach((el) => {
      el.addEventListener("mousedown", stop, true);
      el.addEventListener("mouseup", stop, true);
      el.addEventListener("pointerdown", stop, true);
      el.addEventListener("pointerup", stop, true);
      el.addEventListener("pointermove", stop, true);
      el.addEventListener("touchstart", stop, true);
      el.addEventListener("touchmove", stop, true);
      el.addEventListener("touchend", stop, true);
    });
    return () => {
      els.forEach((el) => {
        el.removeEventListener("mousedown", stop, true);
        el.removeEventListener("mouseup", stop, true);
        el.removeEventListener("pointerdown", stop, true);
        el.removeEventListener("pointerup", stop, true);
        el.removeEventListener("pointermove", stop, true);
        el.removeEventListener("touchstart", stop, true);
        el.removeEventListener("touchmove", stop, true);
        el.removeEventListener("touchend", stop, true);
      });
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

  // Mobile tap-grab handler
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = () => {
      if (isClawMoving || showOnboarding) return;
      const tap = tapGrabRef.current;
      if (!tap) return;
      tapGrabRef.current = null;
      if (tap.body) {
        targetBodyRef.current = tap.body;
      }
      setClawX(tap.x);
      clawXRef.current = tap.x;
      executeGrabbingSequence();
    };
    el.addEventListener("mobile-tap-grab", handler);
    return () => el.removeEventListener("mobile-tap-grab", handler);
  });

  // Label position sync
  useEffect(() => {
    let rafId: number;
    const sync = () => {
      const labels = labelsRef.current;
      const states = bodyStatesRef.current;
      if (labels && states.length > 0) {
        const children = labels.children as HTMLCollectionOf<HTMLElement>;
        for (let i = 0; i < states.length && i < children.length; i++) {
          children[i].style.transform = `translate(${states[i].x}px, ${states[i].y + 70}px) translate(-50%, 0)`;
        }
      }
      rafId = requestAnimationFrame(sync);
    };
    rafId = requestAnimationFrame(sync);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Physics engine setup
  const [containerReady, setContainerReady] = useState(false);

  // Wait for container to have dimensions
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    if (el.clientWidth > 0 && el.clientHeight > 0) {
      setContainerReady(true);
      return;
    }
    const obs = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry && entry.contentRect.width > 0 && entry.contentRect.height > 0) {
        obs.disconnect();
        setContainerReady(true);
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!containerReady || !containerRef.current) return;
    const el = containerRef.current;

    const engine = engineRef.current;
    engine.gravity.y = 1.0;
    const w = el.clientWidth;
    const h = el.clientHeight;
    const thickness = 1000;
    const floorOffset = 180;

    const ground = Matter.Bodies.rectangle(w / 2, h + thickness / 2 - floorOffset, w * 4, thickness, {
      isStatic: true, friction: 0.9, restitution: 1.0, label: "ground",
    });
    const ceiling = Matter.Bodies.rectangle(w / 2, -thickness / 2, w * 4, thickness, {
      isStatic: true, friction: 0, label: "ceiling",
    });
    const wallLeft = Matter.Bodies.rectangle(w * 0.45 - thickness / 2, h / 2, thickness, h * 4, {
      isStatic: true, friction: 0.5, label: "wallLeft",
    });
    const wallRight = Matter.Bodies.rectangle(w + thickness / 2, h / 2, thickness, h * 4, {
      isStatic: true, friction: 0.5, label: "wallRight",
    });
    Matter.World.add(engine.world, [ground, ceiling, wallLeft, wallRight]);

    const radius = 64;
    const rightStart = w * 0.5;
    const rightRange = w * 0.45;
    const newBodies = SECTIONS.map((sec, i) => {
      const isHome = sec.id === "about";
      const bodyRadius = isHome ? 80 : radius;
      const x = rightStart + (rightRange / (SECTIONS.length + 1)) * (i + 1);
      const y = -100 - i * 80;
      const body = Matter.Bodies.circle(x, y, bodyRadius, {
        restitution: 0.4, friction: 0.4, frictionStatic: 0.1,
        frictionAir: isHome ? 0.03 : 0.015, density: isHome ? 0.004 : 0.002, label: sec.title,
      });
      return { body, section: sec };
    });

    bodiesRef.current = newBodies.map((b) => b.body);
    bodyStatesRef.current = newBodies.map((b) => ({
      x: b.body.position.x,
      y: b.body.position.y,
      angle: b.body.angle,
      modelUrl: MODEL_MAP[b.section.id],
      labelZh: b.section.labelZh,
      labelEn: b.section.labelEn,
    }));
    Matter.World.add(engine.world, newBodies.map((b) => b.body));

    const mouse = Matter.Mouse.create(containerRef.current);
    mouse.element.removeEventListener("wheel", (mouse as any).mousewheel);
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.3, damping: 0.1, render: { visible: false } },
    });
    mouseConstraintRef.current = mouseConstraint;
    Matter.World.add(engine.world, mouseConstraint);

    // Ensure touch events reach Matter.js mouse on mobile
    const preventDefault = (e: TouchEvent) => {
      if (mouseConstraint.body) e.preventDefault();
    };
    el.addEventListener("touchmove", preventDefault, { passive: false });

    // Mobile tap detection — distinguish taps from drags
    let tapStart = { x: 0, y: 0, time: 0 };
    let tapMoved = false;
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      tapStart = { x: t.clientX, y: t.clientY, time: Date.now() };
      tapMoved = false;
    };
    const onTouchMoveDetect = (e: TouchEvent) => {
      if (tapMoved) return;
      const t = e.touches[0];
      const dx = t.clientX - tapStart.x;
      const dy = t.clientY - tapStart.y;
      if (Math.sqrt(dx * dx + dy * dy) > 10) tapMoved = true;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (tapMoved) return;
      const elapsed = Date.now() - tapStart.time;
      if (elapsed > 300) return;
      // It's a tap — trigger grab at this position
      const rect = el.getBoundingClientRect();
      const x = tapStart.x - rect.left;
      const y = tapStart.y - rect.top;
      // Find tapped model
      const allBodies = Matter.Composite.allBodies(engine.world);
      let tapped: Matter.Body | null = null;
      let minD = 80;
      allBodies.forEach((b) => {
        if (b.isStatic || b.label === "ground") return;
        const bx = b.position.x - x;
        const by = b.position.y - y;
        const d = Math.sqrt(bx * bx + by * by);
        if (d < minD) { minD = d; tapped = b; }
      });
      if (tapped) {
        tapGrabRef.current = { body: tapped, x: (tapped as Matter.Body).position.x };
      } else {
        // Tap on blank space — do nothing
        return;
      }
      // Dispatch a custom event so React can pick it up
      el.dispatchEvent(new CustomEvent("mobile-tap-grab"));
    };
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMoveDetect, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    const update = (time: number) => {
      Matter.Engine.update(engine, 1000 / 60);
      const cw = el.clientWidth;
      const ch = el.clientHeight;

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
            Matter.Body.setPosition(b.body, { x: cw * 0.5 + Math.random() * (cw * 0.4), y: ch + 300 });
            Matter.Body.setVelocity(b.body, { x: 0, y: -20 });
          } else {
            Matter.Body.setPosition(b.body, { x: cw * 0.5 + Math.random() * (cw * 0.4), y: -100 });
            Matter.Body.setVelocity(b.body, { x: (Math.random() - 0.5) * 5, y: 12 });
          }
        }
        if (b.body.position.y > ch + 500) Matter.Body.setPosition(b.body, { x: cw * 0.55 + Math.random() * (cw * 0.35), y: -100 });
        if (b.body.position.x < cw * 0.45) Matter.Body.setPosition(b.body, { x: cw * 0.6, y: b.body.position.y });
        if (b.body.position.x > cw + 200) Matter.Body.setPosition(b.body, { x: cw * 0.7, y: b.body.position.y });
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
      const nw = el.clientWidth;
      const nh = el.clientHeight;
      newBodies.forEach((b) => {
        Matter.Body.translate(b.body, { x: (nw - w) * 0.5, y: (nh - h) * 0.5 });
        Matter.Body.applyForce(b.body, b.body.position, { x: (Math.random() - 0.5) * 0.05, y: -0.05 });
      });
      Matter.Body.setPosition(ground, { x: nw / 2, y: nh + thickness / 2 - floorOffset });
      Matter.Body.setPosition(ceiling, { x: nw / 2, y: -thickness / 2 });
      Matter.Body.setPosition(wallLeft, { x: nw * 0.45 - thickness / 2, y: nh / 2 });
      Matter.Body.setPosition(wallRight, { x: nw + thickness / 2, y: nh / 2 });
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(el);

    return () => {
      cancelAnimationFrame(requestRef.current);
      Matter.World.clear(engine.world, false);
      Matter.Engine.clear(engine);
      el.removeEventListener("touchmove", preventDefault);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMoveDetect);
      el.removeEventListener("touchend", onTouchEnd);
      resizeObserver.disconnect();
    };
  }, [containerReady]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (isClawMoving) return;
    const cw = rect.width;
    const minX = cw * 0.45;
    const x = Math.max(minX, e.clientX - rect.left);
    setClawX(x);
    clawXRef.current = x;
    mousePos.current = { x: e.clientX, y: e.clientY };
  };

  const lastClickTime = useRef(0);
  const targetBodyRef = useRef<Matter.Body | null>(null);
  const tapGrabRef = useRef<{ body: Matter.Body | null; x: number } | null>(null);
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    if (isClawMoving || showOnboarding) return;
    // Ignore if mouse moved significantly (drag, not click)
    if (mouseDownPos.current) {
      const dx = e.clientX - mouseDownPos.current.x;
      const dy = e.clientY - mouseDownPos.current.y;
      if (Math.sqrt(dx * dx + dy * dy) > 8) return;
    }
    const now = Date.now();
    if (now - lastClickTime.current < 300) return;
    lastClickTime.current = now;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Only grab when click lands on a model body — blank space does nothing
    const allBodies = Matter.Composite.allBodies(engineRef.current.world);
    let tapped: Matter.Body | null = null;
    let minDist = 80;
    allBodies.forEach((b) => {
      if (b.isStatic || b.label === "ground") return;
      const dx = b.position.x - x;
      const dy = b.position.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) { minDist = dist; tapped = b; }
    });
    if (!tapped) return;

    targetBodyRef.current = tapped;
    const targetX = (tapped as Matter.Body).position.x;
    setClawX(targetX);
    clawXRef.current = targetX;
    executeGrabbingSequence();
  };

  const triggerShake = useCallback(() => {
    engineRef.current.world.bodies.forEach((body) => {
      if (body.isStatic) return;
      Matter.Body.applyForce(body, body.position, {
        x: (Math.random() - 0.5) * 2.0,
        y: -4 - Math.random() * 4,
      });
    });
    if (navigator.vibrate) navigator.vibrate(80);
  }, []);

  const motionPermRef = useRef(false);

  // DeviceMotion: continuously apply phone acceleration to models (like 抓大鹅)
  useEffect(() => {
    let lastShake = 0;
    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.acceleration || e.accelerationIncludingGravity;
      if (!acc || acc.x == null || acc.y == null) return;
      motionPermRef.current = true;
      const ax = acc.x ?? 0;
      const ay = acc.y ?? 0;
      const forceMul = 0.006;
      engineRef.current.world.bodies.forEach((body) => {
        if (body.isStatic) return;
        Matter.Body.applyForce(body, body.position, {
          x: ax * forceMul,
          y: -ay * forceMul,
        });
      });
      const magnitude = Math.abs(ax) + Math.abs(ay);
      if (magnitude > 8 && Date.now() - lastShake > 300) {
        lastShake = Date.now();
        engineRef.current.world.bodies.forEach((body) => {
          if (body.isStatic) return;
          Matter.Body.applyForce(body, body.position, {
            x: ax * 0.02,
            y: -ay * 0.02 - 0.08,
          });
        });
        if (navigator.vibrate) navigator.vibrate(50);
      }
    };
    window.addEventListener("devicemotion", handleMotion);
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, []);

  // DeviceOrientation: tilt phone to shift gravity direction
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      const beta = e.beta ?? 0;
      const gamma = e.gamma ?? 0;
      const engine = engineRef.current;
      engine.gravity.x = Math.max(-1.5, Math.min(1.5, gamma / 20));
      engine.gravity.y = Math.max(0.2, Math.min(2.5, 1 + beta / 45));
    };
    window.addEventListener("deviceorientation", handleOrientation);
    return () => window.removeEventListener("deviceorientation", handleOrientation);
  }, []);

  const executeGrabbingSequence = async () => {
    if (isClawMoving) return;
    setIsClawMoving(true);
    if (mouseConstraintRef.current) (mouseConstraintRef.current as any).enabled = false;

    const targetHeight = (containerRef.current?.clientHeight ?? 600) - 140;
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

      // If a specific model was tapped (mobile), target it directly
      if (targetBodyRef.current) {
        closest = targetBodyRef.current;
        targetBodyRef.current = null;
      } else {
        candidates.forEach((b) => {
          const dx = b.position.x - clawXRef.current;
          const dy = b.position.y - targetHeight;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDist) {
            minDist = dist;
            closest = b;
          }
        });
      }

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
      const heroSection = document.getElementById("hero-section");
      const heroBottom = heroSection ? heroSection.getBoundingClientRect().bottom + window.scrollY : window.innerHeight;
      const targetTop = targetEl ? targetEl.getBoundingClientRect().top + window.scrollY : heroBottom;
      const distance = Math.abs(targetTop - heroBottom);
      const maxDist = document.documentElement.scrollHeight - heroBottom;
      const ratio = Math.min(distance / (maxDist || 1), 1);
      // Near sections: longer fall time; far sections: shorter fall time
      const fallDelay = Math.round(300 + (1 - ratio) * 200);
      const navDelay = Math.round(fallDelay + 100);
      const fallVelocity = Math.round(10 + ratio * 20);

      // Step 1: scroll to target section
      setTimeout(() => {
        setShowActive(null);
        finishSequence();
      }, 250);

      // Step 2: dispatch model after scroll completes — user sees it fall
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("model-landed", {
          detail: { modelUrl, labelZh: section.labelZh, labelEn: section.labelEn, color: section.color, sectionId: section.id, fallVelocity },
        }));
      }, 450);

      // Step 3: navigate to target section — timed to match fall speed
      setTimeout(() => {
        if (onNavigate) onNavigate(section.id);
        else scrollToSection(section.id);
      }, 450 + navDelay);
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
    <div className="absolute inset-0 select-none" style={{ touchAction: "none" }}>
      {/* Matter.js physics container */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onClick={handleContainerClick}
        onMouseLeave={() => { mousePos.current = { x: -1000, y: -1000 }; }}
        className="absolute inset-0 z-[5]"
        style={{ touchAction: "none" }}
      >

      {/* R3F Canvas */}
      <Canvas
        orthographic
        camera={{ position: [0, 0, 500], near: 0.1, far: 1000, zoom: 1 }}
        style={{ position: "absolute", inset: 0, pointerEvents: "none", touchAction: "none", background: "transparent", zIndex: 2 }}
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
          className="absolute top-0 transition-transform duration-100 ease-out h-full"
          style={{ transform: `translateX(${clawX}px)` }}
        >
          {/* Thin wire from top to claw resting point */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-px"
            style={{
              height: "80px",
              background: isDark
                ? "rgba(255,255,255,0.15)"
                : "rgba(0,0,0,0.1)",
            }}
          />
          {/* Extending cable below resting point */}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-[2px] origin-top"
            style={{
              top: "80px",
              height: `${clawY}px`,
              background: isDark
                ? "linear-gradient(to bottom, #555, #888, #555)"
                : "linear-gradient(to bottom, #d1d5db, #9ca3af, #d1d5db)",
            }}
          />
          <div
            className="absolute transition-all duration-300 flex items-center justify-center p-4"
            style={{ top: `${80 + clawY}px`, left: "50%", transform: "translate(-50%, -50%)" }}
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

      {/* Hints — pill tags on right side */}
      {!isClawMoving && !showOnboarding && (
        <div className="absolute top-1/2 right-[25%] -translate-y-1/2 pointer-events-none z-[1]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 gap-2 max-w-[260px]"
          >
            {[
              lang === "en" ? "Tap to grab" : "点击即抓取",
              lang === "en" ? "Grab → Jump" : "抓取 → 跳转",
              lang === "en" ? "Shake to bounce" : "摇一摇弹跳",
              lang === "en" ? "Drag models" : "可拖拽模型",
            ].map((text, i) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm text-center"
                style={{
                  background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"}`,
                  color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.25)",
                }}
              >
                {text}
              </span>
            ))}
          </motion.div>
        </div>
      )}

      {/* Controls */}
      <div
        ref={controlsRef}
        className={`absolute bottom-8 right-[25%] flex items-center gap-6 z-[70] pointer-events-none transition-all duration-500 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <button
          onClick={async (e) => {
            e.stopPropagation();
            if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
              try { await (DeviceMotionEvent as any).requestPermission(); } catch {}
            }
            if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
              try { await (DeviceOrientationEvent as any).requestPermission(); } catch {}
            }
            triggerShake();
          }}
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
          title={lang === "zh" ? "摇一摇" : "Shake"}
        >
          <Dices className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-500 group-hover:rotate-180" style={{ color: isDark ? "rgba(192,132,252,0.9)" : "rgba(124,58,237,0.8)" }} strokeWidth={1.5} />
          <span className="absolute -bottom-7 text-sm font-bold whitespace-nowrap" style={{ color: isDark ? "rgba(192,132,252,0.8)" : "rgba(124,58,237,0.6)" }}>
            {lang === "zh" ? "摇一摇" : "Shake"}
          </span>
        </button>
      </div>

      {/* Active notification — glass card style */}
      <AnimatePresence>
        {showActive && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-2xl flex items-center gap-3 pointer-events-none backdrop-blur-xl"
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

      {/* Onboarding Popup */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            className="absolute inset-0 z-[200] flex items-center justify-center pointer-events-auto"
            onClick={(e) => { e.stopPropagation(); dismissOnboarding(); }}
            onTouchEnd={(e) => { e.stopPropagation(); }}
            style={{ background: isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)" }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
              className="relative mx-5 max-w-[300px] w-full rounded-2xl px-5 py-6"
              style={{
                background: isDark ? "rgba(25,20,45,0.95)" : "rgba(255,255,255,0.96)",
                border: `1px solid ${isDark ? "rgba(168,85,247,0.2)" : "rgba(124,58,237,0.08)"}`,
                boxShadow: isDark
                  ? "0 20px 60px rgba(0,0,0,0.5)"
                  : "0 20px 60px rgba(0,0,0,0.1)",
              }}
            >
              <p
                className="text-center text-base font-semibold mb-4"
                style={{ color: isDark ? "rgba(192,132,252,0.9)" : "rgba(109,40,217,0.8)" }}
              >
                {lang === "en" ? "Claw Machine Navigation" : "抓娃娃机导航"}
              </p>

              <div className="flex flex-col gap-2 mb-5">
                {[
                  { zh: "点击「抓取」或点击屏幕任意位置抓取模型", en: "Tap 'Grab' or tap anywhere to catch a model" },
                  { zh: "抓住模型后自动跳转对应页面", en: "Caught model navigates to its section" },
                  { zh: "点击「摇一摇」或摇晃手机，弹跳模型", en: "Tap 'Shake' or shake phone to bounce" },
                  { zh: "可以用手指拖拽模型玩耍", en: "Drag models around with your finger" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" style={{
                      background: isDark ? "rgba(168,85,247,0.15)" : "rgba(124,58,237,0.08)",
                      color: isDark ? "rgba(192,132,252,0.9)" : "rgba(124,58,237,0.7)",
                    }}>
                      {i + 1}
                    </span>
                    <span className="text-[13px]" style={{ color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)" }}>
                      {lang === "en" ? item.en : item.zh}
                    </span>
                  </div>
                ))}
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={(e) => { e.stopPropagation(); dismissOnboarding(); }}
                onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); dismissOnboarding(); }}
                className="w-full py-2.5 rounded-xl text-sm font-semibold"
                style={{
                  background: isDark ? "rgba(168,85,247,0.2)" : "rgba(124,58,237,0.08)",
                  color: isDark ? "rgba(192,132,252,0.9)" : "rgba(109,40,217,0.8)",
                  border: `1px solid ${isDark ? "rgba(168,85,247,0.3)" : "rgba(124,58,237,0.15)"}`,
                }}
              >
                {lang === "en" ? "Got it" : "知道了"}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}

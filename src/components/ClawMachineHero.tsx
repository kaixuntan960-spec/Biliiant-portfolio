import { useEffect, useRef, useState, useMemo } from "react";
import Matter from "matter-js";
import { motion } from "motion/react";
import { Dices, Hand } from "lucide-react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

/* ---- Section config (matches portfolio sections) ---- */
const SECTIONS = [
  { id: "skills", title: "Skills", color: "#8b9dc3", label: "个人技能" },
  { id: "life", title: "Life", color: "#f3a777", label: "个人生活" },
  { id: "honors", title: "Honors", color: "#f5cf7d", label: "个人荣誉" },
  { id: "experience", title: "Experience", color: "#f3b08d", label: "工作经历" },
  { id: "education", title: "Education", color: "#c98262", label: "教育经历" },
  { id: "works", title: "Works", color: "#7bb6d8", label: "精选作品" },
  { id: "contact", title: "Contact", color: "#9ec99a", label: "联系我" },
];

/* ---- GLB model mapping (prefer _ suffix) ---- */
const MODEL_MAP: Record<string, string> = {
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
  education: { unlit: true, tilt: [0.8, Math.PI, 0] },
  skills: { tilt: [0.2, 0.8, -0.3] },
};

/* ---- Cream/beige palette ---- */
const MODEL_COLOR = 0xe5d5b8;
const GRAB_RADIUS = 200;

const NAVBAR_H = 72;

function scrollToSection(id: string) {
  if (id === "home") {
    window.scrollTo({ top: 0, behavior: "smooth" });
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

/* ---- Shared body state for Matter → R3F sync ---- */
interface BodyState {
  x: number;
  y: number;
  angle: number;
}

/* ---- R3F Model: single GLB with cream material, auto-scale & center ---- */
function Model({ url, unlit }: { url: string; unlit?: boolean }) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => {
    const c = scene.clone();
    // Override materials to light purple
    c.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (unlit) {
          child.material = new THREE.MeshBasicMaterial({ color: MODEL_COLOR, side: THREE.DoubleSide });
        } else {
          child.material = new THREE.MeshStandardMaterial({
            color: MODEL_COLOR,
            roughness: 0.55,
            metalness: 0.0,
          });
        }
      }
    });
    // Auto-scale so the model fills ~140px on screen
    const box = new THREE.Box3().setFromObject(c);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const targetSize = 140;
    const s = targetSize / maxDim;
    c.scale.setScalar(s);
    // Center pivot
    const center = box.getCenter(new THREE.Vector3());
    c.position.copy(center.clone().multiplyScalar(-s));
    return c;
  }, [scene, unlit]);

  return <primitive object={cloned} />;
}

/* ---- R3F Scene: reads shared body state each frame ---- */
function Scene({ bodyRef }: { bodyRef: React.RefObject<BodyState[]> }) {
  const { size, gl, scene } = useThree();
  const groupRefs = useRef<(THREE.Group | null)[]>([]);

  /* Ensure renderer is fully transparent so page background shows through */
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

  return (
    <>
      {SECTIONS.map((sec, i) => {
        const cfg = MODEL_CONFIG[sec.id];
        return (
          <group key={sec.id} ref={(el) => { groupRefs.current[i] = el; }}>
            <group rotation={cfg?.tilt ?? [0, 0, 0]}>
              <Model url={MODEL_MAP[sec.id]} unlit={cfg?.unlit} />
            </group>
          </group>
        );
      })}
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} />
      <directionalLight position={[-5, 3, -5]} intensity={0.5} />
    </>
  );
}

/* ---- Main Component ---- */
export default function ClawMachineHero({ onNavigate }: ClawMachineHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine>(Matter.Engine.create());
  const requestRef = useRef<number>(0);
  const mousePos = useRef({ x: -1000, y: -1000 });
  const clawXRef = useRef(0);
  const clawYRef = useRef(0);
  const bodiesRef = useRef<Matter.Body[]>([]);
  const mouseConstraintRef = useRef<Matter.MouseConstraint | null>(null);
  const bodyStatesRef = useRef<BodyState[]>([]);

  const [clawX, setClawX] = useState(0);
  const [clawY, setClawY] = useState(0);
  const [isClawMoving, setIsClawMoving] = useState(false);
  const [grabbedTitle, setGrabbedTitle] = useState<string | null>(null);
  const [showActive, setShowActive] = useState<string | null>(null);
  const grabConstraint = useRef<Matter.Constraint | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const engine = engineRef.current;
    engine.gravity.y = 1.0;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const thickness = 1000;
    const floorOffset = 160;

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
      const x = (w / (SECTIONS.length + 1)) * (i + 1);
      const y = radius + i * 30;
      const body = Matter.Bodies.circle(x, y, radius, {
        restitution: 0.4, friction: 0.4, frictionStatic: 0.1,
        frictionAir: 0.015, density: 0.002, label: sec.title,
      });
      return { body, section: sec };
    });

    bodiesRef.current = newBodies.map((b) => b.body);
    Matter.World.add(engine.world, newBodies.map((b) => b.body));

    const mouse = Matter.Mouse.create(containerRef.current);
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
          x: Math.sin(time * 0.003 + newBodies.indexOf(b)) * 0.00005,
          y: -0.0001,
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

      bodyStatesRef.current = newBodies.map((b) => ({
        x: b.body.position.x,
        y: b.body.position.y,
        angle: b.body.angle,
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
      setTimeout(() => {
        setShowActive(null);
        finishSequence();
        if (onNavigate) onNavigate(section.id);
        else scrollToSection(section.id);
      }, 1200);
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

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { mousePos.current = { x: -1000, y: -1000 }; }}
      className="relative w-full h-screen cursor-crosshair overflow-hidden select-none"
      style={{ background: "#F0F3FC" }}
    >
      {/* R3F Canvas — 3D models synced to Matter.js bodies */}
      <Canvas
        orthographic
        camera={{ position: [0, 0, 500], near: 0.1, far: 1000, zoom: 1 }}
        style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "transparent" }}
        dpr={[1, 2]}
        frameloop="always"
        gl={{ alpha: true }}
        onCreated={({ gl }) => { gl.setClearColor(0x000000, 0); gl.setClearAlpha(0); gl.domElement.style.background = "transparent"; }}
      >
        <Scene bodyRef={bodyStatesRef} />
      </Canvas>

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
              background: "linear-gradient(to bottom, #d1d5db, #9ca3af, #d1d5db)",
            }}
          />
          <div
            className="absolute transition-all duration-300 flex items-center justify-center p-4"
            style={{ top: `${clawY}px`, left: "50%", transform: "translate(-50%, -50%)" }}
          >
            <div className="w-14 h-14 border border-black/10 rounded-full bg-gradient-to-br from-white to-gray-100 shadow-lg flex items-center justify-center">
              <div
                className={`w-4 h-4 rounded-full transition-all duration-300 ${
                  grabbedTitle
                    ? "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)] scale-110"
                    : "bg-black/10 scale-90"
                }`}
              />
            </div>
            <div className="absolute flex gap-10 top-1/2">
              <motion.div
                animate={{ rotate: grabbedTitle ? 45 : 20 }}
                className="w-2 h-12 bg-gradient-to-b from-gray-400 to-gray-600 rounded-full origin-top shadow-sm"
              />
              <motion.div
                animate={{ rotate: grabbedTitle ? -45 : -20 }}
                className="w-2 h-12 bg-gradient-to-b from-gray-400 to-gray-600 rounded-full origin-top shadow-sm"
              />
            </div>
            <motion.div
              animate={{ scaleY: grabbedTitle ? 1.2 : 1, opacity: grabbedTitle ? 0.8 : 0.4 }}
              className="absolute top-1/2 w-1.5 h-10 bg-gray-500 rounded-full origin-top -z-10 blur-[0.5px]"
            />
          </div>
        </div>
      </div>

      {/* Hint */}
      {!isClawMoving && (
        <div className="absolute top-32 left-1/2 -translate-x-1/2 opacity-30 pointer-events-none flex flex-col items-center gap-4">
          <div className="w-[1px] h-16 bg-black animate-bounce" />
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-[0.5em] font-black mb-1">Grab a Section</span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="fixed bottom-12 left-0 w-full flex justify-center items-center gap-8 z-[70] pointer-events-none">
        <button
          onClick={(e) => { e.stopPropagation(); triggerShake(); }}
          className="group relative pointer-events-auto w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-90"
          title="Shuffle"
        >
          <div className="absolute inset-0 border border-black/5 rounded-full group-hover:scale-125 group-hover:opacity-0 transition-all duration-700 bg-black/[0.02]" />
          <div className="absolute inset-2 border border-black/10 rounded-full group-hover:scale-110 transition-transform duration-500" />
          <div className="relative z-10 w-full h-full bg-white border border-black/5 rounded-full flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.08)] overflow-hidden">
            <Dices className="w-6 h-6 sm:w-8 sm:h-8 text-black transition-transform duration-700 group-hover:rotate-[180deg]" strokeWidth={1} />
          </div>
          <div className="absolute -bottom-10 opacity-0 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none">
            <span className="text-[9px] uppercase tracking-[0.4em] font-black whitespace-nowrap">Shuffle</span>
          </div>
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); executeGrabbingSequence(); }}
          disabled={isClawMoving}
          className={`group relative pointer-events-auto w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center transition-all duration-500 ${
            isClawMoving ? "opacity-50 grayscale" : "hover:scale-110 active:scale-90"
          }`}
          title="Grab"
        >
          <div className="absolute inset-0 border border-black/5 rounded-full group-hover:scale-125 group-hover:opacity-0 transition-all duration-700 bg-black/[0.02]" />
          <div className="absolute inset-2 border border-black/10 rounded-full group-hover:scale-110 transition-transform duration-500" />
          <div className="relative z-10 w-full h-full bg-white border border-black/5 rounded-full flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.08)] overflow-hidden">
            <Hand className={`w-6 h-6 sm:w-8 sm:h-8 transition-all duration-300 ${
              isClawMoving ? "text-red-500 animate-pulse" : "text-black"
            }`} strokeWidth={1} />
          </div>
          <div className="absolute -bottom-10 opacity-0 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none">
            <span className="text-[9px] uppercase tracking-[0.4em] font-black whitespace-nowrap">Grab</span>
          </div>
        </button>
      </div>

      {/* Active notification */}
      {showActive && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed top-12 left-1/2 -translate-x-1/2 z-[60] bg-black text-white px-8 py-4 rounded-full text-[11px] uppercase tracking-[0.4em] font-black shadow-[0_30px_90px_rgba(0,0,0,0.3)] pointer-events-none flex items-center gap-4"
        >
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span>Opening: {showActive}</span>
        </motion.div>
      )}
    </div>
  );
}

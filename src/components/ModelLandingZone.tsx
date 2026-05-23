import { useEffect, useRef, useState, useMemo } from "react";
import Matter from "matter-js";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useThemeMode } from "../theme";
import { useI18n } from "../i18n";

const MODEL_COLOR_LIGHT = 0xffffff;
const MODEL_COLOR_DARK = 0xddd0f0;

interface LandedModel {
  id: number;
  modelUrl: string;
  labelZh: string;
  labelEn: string;
  color: string;
  sectionId: string;
}

interface BodyState {
  x: number;
  y: number;
  angle: number;
}

/* ---- 3D Model ---- */
function LandingModel({ url, isDark }: { url: string; isDark: boolean }) {
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
    const s = 140 / maxDim;
    c.scale.setScalar(s);
    const center = box.getCenter(new THREE.Vector3());
    c.position.copy(center.clone().multiplyScalar(-s));
    return c;
  }, [scene, modelColor, isDark]);
  return <primitive object={cloned} />;
}

/* ---- Scene ---- */
function LandingScene({ bodyStates, models, isDark }: { bodyStates: React.RefObject<BodyState[]>; models: LandedModel[]; isDark: boolean }) {
  const { size, gl, scene } = useThree();
  const groupRefs = useRef<(THREE.Group | null)[]>([]);

  useEffect(() => {
    gl.setClearColor(0x000000, 0);
    gl.setClearAlpha(0);
    scene.background = null;
  }, [gl, scene]);

  useFrame(() => {
    const states = bodyStates.current;
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
      {models.map((m, i) => (
        <group key={m.id} ref={(el) => { groupRefs.current[i] = el; }}>
          <LandingModel url={m.modelUrl} isDark={isDark} />
        </group>
      ))}
      <ambientLight intensity={isDark ? 1.8 : 3.0} />
      <directionalLight position={[4, 8, 6]} intensity={isDark ? 3.5 : 2.0} />
      <directionalLight position={[-3, 5, -4]} intensity={isDark ? 2.0 : 1.0} />
      <directionalLight position={[-5, 2, 3]} intensity={isDark ? 1.5 : 1.0} color={isDark ? 0xa855f7 : 0x7c3aed} />
    </>
  );
}

/* ---- Main Component ---- */
export default function ModelLandingZone() {
  const { resolvedTheme } = useThemeMode();
  const { lang } = useI18n();
  const isDark = resolvedTheme === "dark";

  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine>(Matter.Engine.create({ enableSleeping: false }));
  const bodiesRef = useRef<Matter.Body[]>([]);
  const bodyStatesRef = useRef<BodyState[]>([]);
  const requestRef = useRef<number>(0);
  const labelsRef = useRef<HTMLDivElement>(null);
  const [models, setModels] = useState<LandedModel[]>([]);
  const modelsRef = useRef<LandedModel[]>([]);
  const idCounter = useRef(0);
  const dragConstraintRef = useRef<Matter.Constraint | null>(null);
  const draggingRef = useRef(false);

  // Physics setup
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const engine = engineRef.current;
    engine.gravity.y = 2.5;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const t = 500;
    const floorY = h - 80;

    const ground = Matter.Bodies.rectangle(w / 2, floorY + t / 2, w * 4, t, {
      isStatic: true, friction: 0.8, restitution: 0.3, label: "ground",
    });
    const wallL = Matter.Bodies.rectangle(-t / 2, h / 2, t, h * 4, { isStatic: true });
    const wallR = Matter.Bodies.rectangle(w + t / 2, h / 2, t, h * 4, { isStatic: true });
    Matter.World.add(engine.world, [ground, wallL, wallR]);

    const mousePos = { x: -1000, y: -1000 };

    const getLocalPos = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onMove = (e: MouseEvent) => {
      const pos = getLocalPos(e);
      mousePos.x = pos.x;
      mousePos.y = pos.y;
      if (dragConstraintRef.current) {
        dragConstraintRef.current.pointA = pos;
      }
    };

    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("button, a, [role='button'], input, textarea")) return;
      const rect = container.getBoundingClientRect();
      if (e.clientY < rect.top || e.clientY > rect.bottom || e.clientX < rect.left || e.clientX > rect.right) return;
      const pos = getLocalPos(e);
      const bodies = bodiesRef.current;
      let closest: Matter.Body | null = null;
      let minDist = 80;
      for (const b of bodies) {
        const dx = b.position.x - pos.x;
        const dy = b.position.y - pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) { minDist = dist; closest = b; }
      }
      if (closest) {
        e.preventDefault();
        draggingRef.current = true;
        dragConstraintRef.current = Matter.Constraint.create({
          pointA: pos,
          bodyB: closest,
          stiffness: 0.1,
          damping: 0.05,
          length: 0,
        });
        Matter.World.add(engine.world, dragConstraintRef.current);
      }
    };

    const onUp = () => {
      if (dragConstraintRef.current) {
        Matter.World.remove(engine.world, dragConstraintRef.current);
        dragConstraintRef.current = null;
        draggingRef.current = false;
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);

    const update = () => {
      Matter.Engine.update(engine, 1000 / 60);
      bodiesRef.current.forEach((b) => {
        const dx = b.position.x - mousePos.x;
        const dy = b.position.y - mousePos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180) {
          const f = (1 - dist / 180) * 0.01;
          Matter.Body.applyForce(b, b.position, {
            x: (dx / (dist || 1)) * f,
            y: (dy / (dist || 1)) * f,
          });
        }
      });
      bodyStatesRef.current = bodiesRef.current.map((b) => ({
        x: b.position.x, y: b.position.y, angle: b.angle,
      }));
      const labels = labelsRef.current;
      if (labels) {
        const children = labels.children as HTMLCollectionOf<HTMLElement>;
        for (let i = 0; i < bodyStatesRef.current.length && i < children.length; i++) {
          const s = bodyStatesRef.current[i];
          children[i].style.transform = `translate(${s.x}px, ${s.y + 55}px) translate(-50%, 0)`;
        }
      }
      requestRef.current = requestAnimationFrame(update);
    };
    requestRef.current = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(requestRef.current);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      Matter.World.clear(engine.world, false);
      Matter.Engine.clear(engine);
    };
  }, []);

  // Listen for model-landed events
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const { modelUrl, labelZh, labelEn, color, sectionId, fallVelocity } = e.detail;
      const w = window.innerWidth;
      const x = w * 0.2 + Math.random() * w * 0.6;
      const body = Matter.Bodies.circle(x, -60, 64, {
        restitution: 0.5, friction: 0.4, frictionAir: 0.02, density: 0.003,
      });
      Matter.Body.setVelocity(body, { x: (Math.random() - 0.5) * 3, y: fallVelocity || 12 });
      Matter.World.add(engineRef.current.world, body);
      bodiesRef.current.push(body);
      const newModel: LandedModel = { id: ++idCounter.current, modelUrl, labelZh, labelEn, color, sectionId };
      modelsRef.current = [...modelsRef.current, newModel];
      setModels([...modelsRef.current]);
    };
    window.addEventListener("model-landed" as any, handler);
    return () => window.removeEventListener("model-landed" as any, handler);
  }, []);

  return (
    <div
      ref={containerRef}
      data-cmp="ModelLandingZone"
      className="absolute inset-0 z-20 select-none"
      style={{ pointerEvents: "none", background: "transparent" }}
    >
      <Canvas
        orthographic
        camera={{ position: [0, 0, 500], near: 0.1, far: 1000, zoom: 1 }}
        style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "transparent" }}
        dpr={[1, 2]}
        frameloop="always"
        gl={{ alpha: true }}
        onCreated={({ gl }) => { gl.setClearColor(0x000000, 0); }}
      >
        <LandingScene bodyStates={bodyStatesRef} models={models} isDark={isDark} />
      </Canvas>
      <div ref={labelsRef} className="absolute inset-0 pointer-events-none z-30">
        {models.map((m) => (
          <div key={m.id} className="absolute top-0 left-0 whitespace-nowrap" style={{ willChange: "transform" }}>
            <span
              className="inline-block px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider backdrop-blur-md"
              style={{
                background: isDark ? "rgba(168,85,247,0.15)" : "rgba(124,58,237,0.1)",
                color: isDark ? "rgba(192,132,252,1)" : "rgba(124,58,237,0.85)",
                border: `1px solid ${isDark ? "rgba(168,85,247,0.25)" : "rgba(124,58,237,0.2)"}`,
                boxShadow: isDark ? "0 2px 8px rgba(168,85,247,0.15)" : "0 2px 8px rgba(124,58,237,0.08)",
              }}
            >
              {lang === "en" ? m.labelEn : m.labelZh}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState, useMemo, Component, type ReactNode } from "react";
import { ArrowDown, Heart, Sparkles } from "lucide-react";
import { useI18n } from "../i18n";
import { useSiteContent } from "../i18n";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, Bounds, useBounds, PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";

class CanvasErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null };
  static getDerivedStateFromError(e: Error) { return { error: e.message }; }
  componentDidCatch(e: Error) { console.error("[CanvasErrorBoundary]", e); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ color: "red", fontSize: 12, padding: 8, wordBreak: "break-all" }}>
          3D Error: {this.state.error}
        </div>
      );
    }
    return this.props.children;
  }
}

function AutoFit() {
  const bounds = useBounds();
  useEffect(() => { bounds.refresh().fit(); }, [bounds]);
  return null;
}

// 缓慢自转，不依赖 OrbitControls autoRotate（避免持续 invalidate）
function RotateModel({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.3;
  });
  return <group ref={ref}>{children}</group>;
}

function CharacterModel({ modelUrl, lowPerf }: { modelUrl: string; lowPerf: boolean }) {
  const gltf = useGLTF(modelUrl);

  // 场景只克隆一次，不随 lowPerf 变化重建
  const scene = useMemo(() => {
    const s = gltf.scene.clone(true);
    s.updateWorldMatrix(true, true);
    return s;
  }, [gltf.scene]);

  // 材质单独更新，不触发场景重建
  useEffect(() => {
    const BASE_MESHES = new Set(["立方体.002"]);
    scene.traverse((child: any) => {
      if (!child.isMesh) return;
      child.frustumCulled = false;

      if (BASE_MESHES.has(child.name)) {
        if (lowPerf) {
          child.material = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(0.9, 0.95, 1.0),
            metalness: 0.0,
            roughness: 0.05,
            transparent: true,
            opacity: 0.45,
            side: THREE.DoubleSide,
            iridescence: 1.0,
            iridescenceIOR: 2.0,
            iridescenceThicknessRange: [150, 600] as [number, number],
            clearcoat: 1.0,
            clearcoatRoughness: 0.02,
            envMapIntensity: 2.5,
          });
        } else {
          // 玻璃泡泡：高透射 + 强虹彩 + 清漆，接近参考图效果
          child.material = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(1, 1, 1),
            metalness: 0.0,
            roughness: 0.0,
            transmission: 0.96,
            thickness: 0.5,
            ior: 1.33,
            iridescence: 1.0,
            iridescenceIOR: 2.2,
            iridescenceThicknessRange: [150, 700] as [number, number],
            transparent: true,
            opacity: 1.0,
            side: THREE.DoubleSide,
            envMapIntensity: 4.0,
            clearcoat: 1.0,
            clearcoatRoughness: 0.0,
            attenuationColor: new THREE.Color(0.9, 0.95, 1.0),
            attenuationDistance: 3.0,
          });
        }
      } else {
        if (!child.userData.matPatched) {
          child.material = child.material.clone();
          child.material.envMapIntensity = 1.2;
          child.material.needsUpdate = true;
          child.userData.matPatched = true;
        }
      }
    });
  }, [scene, lowPerf]);

  return <primitive object={scene} />;
}

const Hero = () => {
  const { lang } = useI18n();
  const siteContent = useSiteContent();
  const WORDS = siteContent.hero.rotatingWords;
  const [wordIndex, setWordIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [visible, setVisible] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef({ x: 0, y: 0 });
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(128);
  const [lowPerf, setLowPerf] = useState(true); // 默认低性能，PerformanceMonitor 检测到高性能后升级
  const ipTitle = lang === "en" ? "3D Personal IP Avatar" : "3D 个人形象 IP";
  const ipDesc =
    lang === "en"
      ? "Reserved area for a cute 3D animated avatar (can connect glTF / video / Lottie / Canvas later)."
      : "这里预留用于放置可爱 3D 动态形象（后续可接入 glTF / 视频 / Lottie / Canvas）";
  const ipReady = lang === "en" ? "Slot ready" : "展示位已准备";

  useEffect(() => {
    const word = WORDS[wordIndex];
    let timeout: ReturnType<typeof setTimeout>;
    if (!isDeleting && displayed === word) {
      timeout = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && displayed === "") {
      setIsDeleting(false);
      setWordIndex((i) => (i + 1) % WORDS.length);
    } else {
      timeout = setTimeout(() => {
        setDisplayed(isDeleting ? word.slice(0, displayed.length - 1) : word.slice(0, displayed.length + 1));
      }, isDeleting ? 60 : 100);
    }
    return () => clearTimeout(timeout);
  }, [displayed, isDeleting, wordIndex, WORDS]);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
  }, []);

  useEffect(() => {
    try {
      const storedLiked = localStorage.getItem("portfolio_liked") === "1";
      const storedCount = Number(localStorage.getItem("portfolio_like_count") ?? "");
      setLiked(storedLiked);
      if (Number.isFinite(storedCount) && storedCount > 0) setLikeCount(storedCount);
    } catch {
      // ignore
    }
  }, []);

  // 粒子背景：降低粒子数量，降低帧率到 30fps
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    type Particle = { x: number; y: number; vx: number; vy: number; r: number; alpha: number };
    const particles: Particle[] = Array.from({ length: 30 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.4 + 0.1,
    }));
    let raf = 0;
    let lastT = 0;
    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      if (t - lastT < 33) return; // 限制 ~30fps
      lastT = t;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(168, 85, 247, ${p.alpha})`;
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const heroEl = heroRef.current;
    const gridEl = gridRef.current;
    if (!heroEl || !gridEl) return;

    const update = () => {
      const { x, y } = lastRef.current;
      const rect = heroEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const nx = rect.width ? (x - cx) / (rect.width / 2) : 0; // [-1..1]
      const ny = rect.height ? (y - cy) / (rect.height / 2) : 0; // [-1..1]

      const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
      const px = clamp(nx, -1, 1);
      const py = clamp(ny, -1, 1);

      const tX = px * 16; // px
      const tY = py * 10; // px
      const rY = px * 6; // deg
      const rX = -py * 6; // deg

      gridEl.style.transform = `translate3d(${tX}px, ${tY}px, 0) rotateX(${rX}deg) rotateY(${rY}deg)`;
      gridEl.style.backgroundPosition = `${tX * 0.9}px ${tY * 0.9}px, ${tX * 0.9}px ${tY * 0.9}px`;
      gridEl.style.filter = `brightness(${1 + Math.abs(px) * 0.06 + Math.abs(py) * 0.06})`;

      rafRef.current = null;
    };

    const onMove = (e: PointerEvent) => {
      lastRef.current = { x: e.clientX, y: e.clientY };
      if (rafRef.current == null) rafRef.current = requestAnimationFrame(update);
    };

    const onLeave = () => {
      gridEl.style.transform = "translate3d(0,0,0) rotateX(0deg) rotateY(0deg)";
      gridEl.style.backgroundPosition = "0px 0px, 0px 0px";
      gridEl.style.filter = "none";
    };

    heroEl.addEventListener("pointermove", onMove);
    heroEl.addEventListener("pointerleave", onLeave);
    return () => {
      heroEl.removeEventListener("pointermove", onMove);
      heroEl.removeEventListener("pointerleave", onLeave);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const toggleLike = () => {
    setLiked((v) => {
      const next = !v;
      setLikeCount((c) => {
        const nextCount = Math.max(0, c + (next ? 1 : -1));
        try {
          localStorage.setItem("portfolio_like_count", String(nextCount));
        } catch {
          // ignore
        }
        return nextCount;
      });
      try {
        localStorage.setItem("portfolio_liked", next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  };

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: "var(--hero-bg)", transition: "background 420ms ease" }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60" />

      <div
        className="absolute rounded-full blur-3xl opacity-20 animate-float"
        style={{
          top: "25%",
          left: "25%",
          width: "380px",
          height: "380px",
          background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute rounded-full blur-3xl opacity-10 animate-float"
        style={{
          bottom: "25%",
          right: "25%",
          width: "320px",
          height: "320px",
          background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
          animationDelay: "2s",
        }}
      />

      <div
        ref={gridRef}
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "linear-gradient(var(--primary) 1px, transparent 1px), linear-gradient(90deg, var(--primary) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          transformStyle: "preserve-3d",
          willChange: "transform, background-position, filter",
          transition: "transform 160ms ease-out, background-position 160ms ease-out, filter 160ms ease-out",
        }}
      />

      <div
        className={`relative z-10 w-full transition-all duration-1000 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        style={{
          maxWidth: "var(--max-w-content)",
          margin: "0 auto",
          paddingLeft: "var(--space-12)",
          paddingRight: "var(--space-12)",
        }}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between" style={{ gap: "var(--space-14)" }}>
          <div className="flex flex-col items-start" style={{ maxWidth: "820px" }}>
            <div
              className="flex items-center border"
              style={{
                gap: "var(--space-2)",
                padding: "6px 16px",
                borderRadius: "var(--radius-full)",
                marginBottom: "var(--space-8)",
                background: "var(--surface-1)",
                borderColor: "rgba(168,85,247,0.3)",
              }}
            >
              <Sparkles size={13} className="text-primary" />
              <span className="text-muted-foreground tracking-widest uppercase" style={{ fontSize: "var(--text-xs)" }}>
                {siteContent.hero.badge}
              </span>
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            </div>

            <h1 className="font-black leading-none tracking-tighter" style={{ fontSize: "clamp(56px, 8vw, 88px)", marginBottom: "var(--space-3)" }}>
              <span className="text-foreground">{siteContent.hero.firstName}</span>
              <span className="text-gradient">{siteContent.hero.middleNameGradient}</span>
              <span
                className="block"
                style={{
                  fontSize: "clamp(44px, 6.5vw, 72px)",
                  marginTop: "var(--space-2)",
                  WebkitTextStroke: "1px rgba(168,85,247,0.5)",
                  color: "transparent",
                  letterSpacing: "-0.04em",
                }}
              >
                {siteContent.hero.lastName}
              </span>
            </h1>

            <div className="flex items-center" style={{ gap: "var(--space-3)", marginTop: "var(--space-4)", marginBottom: "var(--space-6)" }}>
              <span className="w-8 h-px flex-shrink-0" style={{ background: "var(--accent)" }} />
              <span className="font-light text-muted-foreground tracking-wide" style={{ fontSize: "var(--text-lg)" }}>
                <span className="font-medium" style={{ color: "var(--accent-strong)" }}>{displayed}</span>
                <span className="animate-blink text-primary ml-0.5">|</span>
              </span>
            </div>

            <p
              className="text-muted-foreground leading-relaxed"
              style={{
                fontSize: "var(--text-md)",
                maxWidth: "520px",
                marginBottom: "var(--space-10)",
                lineHeight: "var(--leading-relaxed)",
              }}
            >
              {siteContent.hero.descriptionLines[0]}
              <br />
              {siteContent.hero.descriptionLines[1]}
            </p>

            <div className="flex items-center flex-wrap" style={{ gap: "var(--space-4)" }}>
              <a
                href="#works"
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector("#works")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="group flex items-center font-medium transition-all duration-300 hover:shadow-glow hover:scale-105"
                style={{
                  gap: "var(--space-3)",
                  padding: "12px 28px",
                  borderRadius: "var(--radius-full)",
                  fontSize: "var(--text-sm)",
                  background: "var(--btn-primary-bg)",
                  color: "var(--primary-foreground)",
                  boxShadow: "var(--btn-primary-shadow)",
                }}
              >
                {siteContent.hero.ctas.primary}
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center transition-transform group-hover:translate-x-1"
                  style={{ background: "rgba(255,255,255,0.2)", fontSize: "12px" }}
                >
                  →
                </span>
              </a>
              <a
                href="#about"
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector("#about")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex items-center font-medium border border-border text-muted-foreground hover:text-foreground hover:border-primary transition-all duration-300"
                style={{
                  padding: "12px 28px",
                  borderRadius: "var(--radius-full)",
                  fontSize: "var(--text-sm)",
                }}
              >
                {siteContent.hero.ctas.secondary}
              </a>
              <div className="2xl:hidden flex items-center" style={{ gap: "var(--space-3)" }}>
                <button
                  type="button"
                  onClick={toggleLike}
                  className="flex items-center justify-center border transition-all hover:scale-105 active:scale-100"
                  style={{
                    width: "46px",
                    height: "46px",
                    borderRadius: "var(--radius-lg)",
                    background: liked ? "rgba(255,107,157,0.16)" : "var(--glass-soft)",
                    borderColor: liked ? "rgba(255,107,157,0.45)" : "rgba(255,255,255,0.10)",
                  }}
                  title={lang === "en" ? (liked ? "Liked" : "Like this site") : liked ? "已点赞收藏" : "点赞收藏这个网站"}
                >
                  <Heart
                    size={18}
                    style={{
                      color: liked ? "rgb(255,107,157)" : "var(--muted-foreground)",
                      fill: liked ? "rgb(255,107,157)" : "transparent",
                    }}
                  />
                </button>
                <div className="flex flex-col" style={{ gap: "2px" }}>
                  <span className="text-muted-foreground" style={{ fontSize: "var(--text-xs)" }}>
                    {lang === "en" ? "Like me" : "喜欢我"}
                  </span>
                  <span className="text-muted-foreground" style={{ fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    {likeCount} likes
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center flex-wrap border-t border-border" style={{ gap: "var(--space-10)", marginTop: "var(--space-12)", paddingTop: "var(--space-8)" }}>
              {siteContent.hero.stats.map((stat) => (
                <div key={stat.label} className="flex flex-col" style={{ gap: "var(--space-1)" }}>
                  <span
                    className="font-black"
                    style={{
                      fontSize: "var(--text-2xl)",
                      background: "var(--hero-stat-gradient)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      transition: "background 420ms ease",
                    }}
                  >
                    {stat.num}
                  </span>
                  <span className="text-muted-foreground tracking-widest uppercase" style={{ fontSize: "var(--text-xs)" }}>
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-shrink-0 flex justify-center lg:justify-end" style={{ marginTop: "var(--space-6)", width: "min(480px, 100%)" }}>
            <div
              className="relative"
              style={{
                width: "100%",
                aspectRatio: "1 / 1",
                background: "transparent",
              }}
            >
              <CanvasErrorBoundary>
              <Canvas
                camera={{ position: [0, 0, 5], fov: 40 }}
                gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.3, powerPreference: "high-performance" }}
                frameloop="always"
                dpr={[1, 1.5]}
                onCreated={({ gl }) => { gl.setClearColor(0x000000, 0); }}
                style={{ width: "100%", height: "100%", position: "absolute", inset: 0, background: "transparent" }}
              >
                <PerformanceMonitor
                  onDecline={() => setLowPerf(true)}
                  onIncline={() => setLowPerf(false)}
                  flipflops={5}
                  factor={0.5}
                />
                <ambientLight intensity={0.5} color={"#f8f0ff"} />
                <directionalLight position={[4, 6, 5]} intensity={2.0} color={"#fff0f8"} />
                <directionalLight position={[-4, 2, -3]} intensity={1.5} color={"#c8b8ff"} />
                <directionalLight position={[0, 2, -5]} intensity={1.2} color={"#80b0ff"} />
                <directionalLight position={[0, -3, 2]} intensity={0.4} color={"#d0a8ff"} />
                <pointLight position={[2.5, 3.5, 2]} intensity={3.5} color={"#ff88cc"} />
                <pointLight position={[-2.5, 3.5, 2]} intensity={3.5} color={"#88ccff"} />
                {!lowPerf && <Environment preset="studio" background={false} />}
                <Bounds fit clip margin={1.1}>
                  <AutoFit />
                  <RotateModel>
                    <CharacterModel modelUrl="/models/character_new.glb" lowPerf={lowPerf} />
                  </RotateModel>
                </Bounds>
                <OrbitControls
                  enableZoom={false}
                  enablePan={false}
                  autoRotate={false}
                  minPolarAngle={Math.PI / 3}
                  maxPolarAngle={Math.PI / 1.8}
                />
              </Canvas>
              </CanvasErrorBoundary>
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute top-28 left-0 right-0 hidden 2xl:block">
        <div
          className="mx-auto flex justify-end"
          style={{
            maxWidth: "var(--max-w-content)",
            paddingLeft: "var(--space-12)",
            paddingRight: "var(--space-12)",
          }}
        >
          <div className="pointer-events-auto animate-float flex flex-col items-center" style={{ gap: "var(--space-2)", animationDelay: "1s" }}>
            <button
              type="button"
              onClick={toggleLike}
              className="flex items-center justify-center border transition-all hover:scale-110 active:scale-105"
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "var(--radius-xl)",
                background: liked ? "rgba(255,107,157,0.16)" : "var(--glass-soft)",
                borderColor: liked ? "rgba(255,107,157,0.45)" : "rgba(255,255,255,0.10)",
                boxShadow: liked ? "0 0 30px rgba(255,107,157,0.20)" : "none",
              }}
              title={lang === "en" ? (liked ? "Liked" : "Like this site") : liked ? "已点赞收藏" : "点赞收藏这个网站"}
            >
              <Heart
                size={24}
                style={{
                  color: liked ? "rgb(255,107,157)" : "var(--muted-foreground)",
                  fill: liked ? "rgb(255,107,157)" : "transparent",
                  transition: "transform 200ms ease, color 200ms ease",
                  transform: liked ? "scale(1.06)" : "scale(1)",
                }}
              />
            </button>
            <span className="text-muted-foreground" style={{ fontSize: "var(--text-xs)" }}>
              {lang === "en" ? "Like me" : "喜欢我"}
            </span>
            <div className="text-muted-foreground" style={{ fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {likeCount} likes
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center" style={{ gap: "var(--space-2)" }}>
        <span className="text-muted-foreground tracking-widest uppercase" style={{ fontSize: "var(--text-xs)" }}>
          Scroll
        </span>
        <ArrowDown size={16} className="text-muted-foreground scroll-indicator" />
      </div>

      <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden xl:block" style={{ writingMode: "vertical-lr", textOrientation: "mixed" }}>
        <span className="text-muted-foreground tracking-widest uppercase" style={{ fontSize: "var(--text-xs)", letterSpacing: "0.3em" }}>
          {siteContent.hero.ctas.side}
        </span>
      </div>
    </section>
  );
};

export default Hero;


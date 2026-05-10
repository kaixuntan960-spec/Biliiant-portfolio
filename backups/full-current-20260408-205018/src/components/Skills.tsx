import { useEffect, useRef, useState } from "react";
import { Bot, Code2, Sparkles } from "lucide-react";
import { useSiteContent } from "../i18n";
import { useI18n } from "../i18n";
import { useThemeMode } from "../theme";

const useInView = (threshold = 0.15) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setInView(true);
    }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
};

const SkillCircle = ({ name, level, color, inView, proficiencyLabel }: { name: string; level: number; color: string; inView: boolean; proficiencyLabel: string }) => {
  const shown = inView ? level : 0;
  const { resolvedTheme } = useThemeMode();
  const trackColor = resolvedTheme === "light" ? "rgba(148, 163, 184, 0.2)" : "rgba(255,255,255,0.12)";
  const innerCircleStyle =
    resolvedTheme === "light"
      ? {
          background: "radial-gradient(circle at 32% 26%, rgba(255,255,255,0.98) 0%, rgba(244,247,255,0.9) 58%, rgba(233,239,252,0.86) 100%)",
          boxShadow: "inset 0 1px 2px rgba(255,255,255,0.9), 0 4px 10px rgba(99,102,241,0.12)",
        }
      : {
          background: "radial-gradient(circle at 30% 24%, rgba(45,48,66,0.95) 0%, rgba(24,26,36,0.96) 62%, rgba(17,17,24,0.96) 100%)",
          boxShadow: "inset 0 1px 1px rgba(255,255,255,0.08), 0 4px 10px rgba(0,0,0,0.28)",
        };
  return (
    <div className="flex items-center" style={{ gap: "var(--space-3)" }}>
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width: "52px",
          height: "52px",
          borderRadius: "999px",
          background: `conic-gradient(${color} ${shown * 3.6}deg, ${trackColor} 0deg)`,
          boxShadow: resolvedTheme === "light" ? "0 8px 16px rgba(99,102,241,0.14)" : "0 8px 16px rgba(0,0,0,0.3)",
          transition: "background 900ms ease",
        }}
      >
        <div
          className="flex items-center justify-center font-black"
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "999px",
            ...innerCircleStyle,
            color: "var(--foreground)",
            fontSize: "var(--text-xs)",
          }}
        >
          {level}%
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <div className="font-semibold text-foreground" style={{ fontSize: "var(--text-sm)" }}>
          {name}
        </div>
        <div className="text-muted-foreground" style={{ fontSize: "var(--text-xs)" }}>
          {proficiencyLabel}
        </div>
      </div>
    </div>
  );
};

const Skills = () => {
  const { lang } = useI18n();
  const siteContent = useSiteContent();
  const SKILL_GROUPS = siteContent.skills.groups;
  const SOFT_SKILLS = siteContent.skills.softSkills;
  const proficiencyLabel = lang === "en" ? "Proficiency" : "熟练度";
  const capabilityCards =
    lang === "en"
      ? [
          { icon: <Sparkles size={14} />, title: "UI/UX", desc: "Strategy & visual systems." },
          { icon: <Bot size={14} />, title: "AI", desc: "Faster exploration with AIGC." },
          { icon: <Code2 size={14} />, title: "Vibe Coding", desc: "Interactive demo to delivery." },
        ]
      : [
          { icon: <Sparkles size={14} />, title: "UI/UX", desc: "策略拆解与视觉系统。" },
          { icon: <Bot size={14} />, title: "AI", desc: "AIGC 加速方案探索。" },
          { icon: <Code2 size={14} />, title: "Vibe Coding", desc: "快速做出可交付 Demo。" },
        ];
  const { ref, inView } = useInView();

  return (
    <section id="skills" ref={ref} className="relative" style={{ background: "var(--background)", paddingTop: "var(--space-24)", paddingBottom: "var(--space-24)" }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 opacity-30" style={{ width: "800px", height: "1px", background: "linear-gradient(90deg, transparent, var(--primary), transparent)" }} />

      <div style={{ maxWidth: "var(--max-w-content)", margin: "0 auto", paddingLeft: "var(--space-12)", paddingRight: "var(--space-12)" }}>
        <div className="flex items-end justify-between" style={{ marginBottom: "var(--space-12)" }}>
          <div>
            <p className="label-eyebrow" style={{ marginBottom: "var(--space-3)" }}>
              Skills
            </p>
            <h2 style={{ fontSize: "var(--text-4xl)", fontWeight: 900, letterSpacing: "-0.025em", lineHeight: 1 }}>
              {lang === "en" ? (
                <>
                  <span className="text-foreground">My</span>
                  <span className="text-gradient"> Skills</span>
                </>
              ) : (
                <>
                  <span className="text-foreground">专业</span>
                  <span className="text-gradient"> 技能</span>
                </>
              )}
            </h2>
          </div>
          <p className="text-muted-foreground text-right leading-relaxed hidden md:block" style={{ maxWidth: "260px", fontSize: "var(--text-sm)" }}>
            {siteContent.skills.headerRightLines[0]}
            <br />
            {siteContent.skills.headerRightLines[1]}
          </p>
        </div>

        <div className="flex flex-col md:flex-row" style={{ gap: "var(--space-5)", marginBottom: "var(--space-5)" }}>
          {SKILL_GROUPS.map((group, gi) => (
            <div
              key={group.category}
              className={`flex-1 tilt-card border transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{
                background: "var(--card)",
                borderColor: "var(--border)",
                borderRadius: "var(--radius-2xl)",
                padding: "var(--space-8)",
                transitionDelay: `${gi * 0.15}s`,
              }}
            >
              <div className="flex items-center" style={{ gap: "var(--space-2)", marginBottom: "var(--space-6)" }}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: group.color }} />
                <h3 className="font-semibold text-foreground tracking-wide" style={{ fontSize: "var(--text-sm)" }}>
                  {group.category}
                </h3>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "var(--space-4)",
                }}
              >
                {group.skills.map((skill) => (
                  <SkillCircle key={skill.name} name={skill.name} level={skill.level} color={group.color} inView={inView} proficiencyLabel={proficiencyLabel} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={`border transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`} style={{ background: "var(--card)", borderColor: "var(--border)", borderRadius: "var(--radius-2xl)", padding: "var(--space-8)", transitionDelay: "0.5s", marginBottom: "var(--space-12)" }}>
          <h3 className="font-semibold text-foreground tracking-wide" style={{ fontSize: "var(--text-sm)", marginBottom: "var(--space-5)" }}>
            {lang === "en" ? "Soft Skills · Methods" : "软技能 · 方法论"}
          </h3>
          <div className="flex flex-wrap" style={{ gap: "var(--space-3)" }}>
            {SOFT_SKILLS.map((skill) => (
              <span key={skill} className="tag-hover text-muted-foreground border border-border" style={{ padding: "6px 16px", borderRadius: "var(--radius-full)", fontSize: "var(--text-sm)", background: "var(--surface-1)" }}>
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden border" style={{ borderRadius: "var(--radius-2xl)", padding: "var(--space-5) var(--space-6)", borderColor: "rgba(168,85,247,0.2)" }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.08) 0%, rgba(0,212,170,0.06) 60%, rgba(232,255,71,0.04) 100%)" }} />
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between" style={{ gap: "8px", marginBottom: "var(--space-3)" }}>
              <div>
                <h3 className="font-bold text-foreground" style={{ fontSize: "var(--text-md)", marginBottom: "2px" }}>
                  {lang === "en" ? "Interviewer Snapshot" : "面试官速览"}
                </h3>
                <p className="text-muted-foreground leading-relaxed" style={{ fontSize: "var(--text-xs)" }}>
                  {lang === "en"
                    ? "Design + AI + coding, end-to-end delivery."
                    : "设计 + AI + 编码，完整交付能力。"}
                </p>
              </div>
              <div className="hidden md:inline-flex items-center border text-muted-foreground" style={{ gap: "6px", padding: "3px 8px", borderRadius: "var(--radius-full)", fontSize: "10px", borderColor: "rgba(168,85,247,0.35)", background: "rgba(168,85,247,0.08)" }}>
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                {lang === "en" ? "Full-stack Design Mindset" : "全链路设计思维"}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: "8px", marginBottom: "8px" }}>
              {capabilityCards.map((item) => (
                <div key={item.title} className="border" style={{ borderRadius: "12px", padding: "10px", borderColor: "rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.02)" }}>
                  <div className="flex items-start" style={{ gap: "8px" }}>
                    <div className="inline-flex items-center justify-center text-primary flex-shrink-0" style={{ width: "24px", height: "24px", borderRadius: "9px", background: "rgba(168,85,247,0.14)" }}>
                      {item.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h4 className="font-semibold text-foreground" style={{ fontSize: "11px", marginBottom: "1px", lineHeight: 1.25 }}>
                        {item.title}
                      </h4>
                      <p className="text-muted-foreground leading-relaxed" style={{ fontSize: "10px", lineHeight: 1.35 }}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            
          </div>
        </div>
      </div>
    </section>
  );
};

export default Skills;


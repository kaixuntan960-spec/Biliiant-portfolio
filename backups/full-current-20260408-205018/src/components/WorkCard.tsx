import { useState } from "react";
import { ArrowUpRight, Eye } from "lucide-react";

interface WorkCardProps {
  title?: string;
  subtitle?: string;
  category?: string;
  year?: string;
  tags?: string[];
  gradient?: string;
  emoji?: string;
  featured?: boolean;
  award?: string;
}

const WorkCard = ({
  title = "Project Title",
  subtitle = "A design project",
  category = "UI Design",
  year = "2024",
  tags = [],
  gradient = "linear-gradient(135deg, #a855f7 0%, #c084fc 100%)",
  emoji = "✦",
  featured = false,
  award = "",
}: WorkCardProps) => {
  const [hovered, setHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 12,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * 12,
    });
  };

  return (
    <div
      data-cmp="WorkCard"
      className={`group relative overflow-hidden rounded-2xl border cursor-pointer transition-all duration-500 ${
        featured ? "md:col-span-2" : ""
      }`}
      style={{
        background: "var(--card)",
        borderColor: hovered ? "rgba(168,85,247,0.3)" : "var(--border)",
        transform: hovered
          ? `perspective(800px) rotateX(${-mousePos.y * 0.5}deg) rotateY(${mousePos.x * 0.5}deg) translateZ(4px)`
          : "perspective(800px) rotateX(0) rotateY(0)",
        transition: "transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease",
        boxShadow: hovered ? "0 20px 60px rgba(168,85,247,0.15)" : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMousePos({ x: 0, y: 0 }); }}
      onMouseMove={handleMouseMove}
    >
      {/* Thumbnail */}
      <div
        className="relative overflow-hidden"
        style={{ height: featured ? "320px" : "220px" }}
      >
        <div
          className="absolute inset-0 transition-transform duration-700 group-hover:scale-110"
          style={{ background: gradient }}
        />
        {/* Pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        {/* Center emoji / icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-5xl transition-all duration-500 group-hover:scale-110 group-hover:-rotate-6"
            style={{ filter: "drop-shadow(0 0 20px rgba(255,255,255,0.4))" }}
          >
            {emoji}
          </span>
        </div>
        {/* Award badge */}
        {award && (
          <div
            className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold"
            style={{ background: "rgba(232,255,71,0.9)", color: "#0a0a0f" }}
          >
            🏆 {award}
          </div>
        )}
        {/* Hover overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center gap-3 transition-all duration-300"
          style={{
            background: "var(--overlay-strong)",
            opacity: hovered ? 1 : 0,
            backdropFilter: hovered ? "blur(4px)" : "blur(0)",
            transition: "opacity 300ms ease, backdrop-filter 300ms ease, background 420ms ease",
          }}
        >
          <button className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-primary-foreground" style={{ background: "var(--primary)" }}>
            <Eye size={14} /> 查看
          </button>
          <button className="w-9 h-9 rounded-full flex items-center justify-center border border-border text-foreground hover:border-primary transition-colors">
            <ArrowUpRight size={14} />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground">{category}</span>
              <span className="text-muted-foreground opacity-30">·</span>
              <span className="text-xs text-muted-foreground">{year}</span>
            </div>
            <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors duration-200">
              {title}
            </h3>
          </div>
          <ArrowUpRight
            size={16}
            className="text-muted-foreground group-hover:text-primary transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 mt-1 flex-shrink-0"
          />
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{subtitle}</p>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2.5 py-1 rounded-full border text-muted-foreground"
              style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkCard;

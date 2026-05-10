import { useEffect, useRef, useState } from "react";
import { ChevronRight, X } from "lucide-react";
import { useThemeMode } from "../theme";

export type PosterItem = {
  id: string;
  image: string;
  title: string;
  year: string;
};

export type PosterSeries = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  year: string;
  gradient: string;
  mainPoster: PosterItem;
  derivedPosters: PosterItem[];
};

type PosterSeriesScrollProps = {
  series: PosterSeries[];
};

const PosterSeriesScroll = ({ series }: PosterSeriesScrollProps) => {
  const { resolvedTheme } = useThemeMode();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight - container.clientHeight;
      const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
      setScrollProgress(progress);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const expandedSeries = expandedId ? series.find((s) => s.id === expandedId) : null;

  return (
    <>
      <div
        ref={containerRef}
        className="relative w-full h-screen overflow-y-auto overflow-x-hidden"
        style={{
          scrollSnapType: "y mandatory",
          scrollBehavior: "smooth",
        }}
      >
        {series.map((item, index) => {
          const isHovered = hoveredId === item.id;
          const cardProgress = Math.max(0, Math.min(1, scrollProgress * series.length - index));
          const scale = 1 - cardProgress * 0.05;
          const translateY = cardProgress * -20;
          const opacity = 1 - cardProgress * 0.3;

          return (
            <div
              key={item.id}
              className="relative w-full flex items-center justify-center"
              style={{
                height: "100vh",
                scrollSnapAlign: "start",
                scrollSnapStop: "always",
              }}
            >
              <div
                className="relative transition-all duration-500 ease-out"
                style={{
                  transform: `scale(${scale}) translateY(${translateY}px)`,
                  opacity,
                  width: "min(900px, 90vw)",
                  height: "min(600px, 70vh)",
                }}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* 主卡片 */}
                <div
                  className="relative w-full h-full rounded-3xl overflow-hidden cursor-pointer"
                  style={{
                    background: item.gradient,
                    boxShadow:
                      resolvedTheme === "dark"
                        ? "0 40px 100px rgba(0,0,0,0.6)"
                        : "0 30px 80px rgba(0,0,0,0.2)",
                  }}
                  onClick={() => setExpandedId(item.id)}
                >
                  {/* 主海报 */}
                  <div className="absolute inset-0 flex items-center justify-center p-8">
                    <img
                      src={item.mainPoster.image}
                      alt={item.mainPoster.title}
                      className="w-full h-full object-contain transition-transform duration-500"
                      style={{
                        transform: isHovered ? "scale(0.95)" : "scale(1)",
                      }}
                    />
                  </div>

                  {/* 衍生海报预览（悬停时显示） */}
                  {isHovered && item.derivedPosters.length > 0 && (
                    <div
                      className="absolute inset-0 flex items-center justify-center gap-4 p-8"
                      style={{
                        background: "rgba(0,0,0,0.85)",
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      <div className="grid grid-cols-3 gap-4 max-w-4xl">
                        {item.derivedPosters.slice(0, 6).map((poster, idx) => (
                          <div
                            key={poster.id}
                            className="relative aspect-[3/4] rounded-lg overflow-hidden"
                            style={{
                              animation: `fadeInUp 0.4s ease-out ${idx * 0.1}s both`,
                            }}
                          >
                            <img
                              src={poster.image}
                              alt={poster.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 信息层 */}
                  <div
                    className="absolute bottom-0 left-0 right-0 p-8"
                    style={{
                      background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
                    }}
                  >
                    <div className="text-white">
                      <div className="text-sm opacity-70 mb-2">{item.category} · {item.year}</div>
                      <h3 className="text-3xl font-bold mb-2">{item.title}</h3>
                      <p className="text-sm opacity-80 mb-4">{item.subtitle}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <span>点击查看完整系列</span>
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  </div>

                  {/* 衍生海报数量指示器 */}
                  {item.derivedPosters.length > 0 && (
                    <div
                      className="absolute top-6 right-6 px-4 py-2 rounded-full text-white text-sm font-medium"
                      style={{
                        background: "rgba(255,255,255,0.2)",
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      +{item.derivedPosters.length} 衍生
                    </div>
                  )}
                </div>

                {/* 层叠效果的背景卡片 */}
                {item.derivedPosters.length > 0 && (
                  <>
                    <div
                      className="absolute inset-0 rounded-3xl -z-10"
                      style={{
                        background: item.gradient,
                        opacity: 0.6,
                        transform: "translateY(12px) scale(0.95)",
                        filter: "blur(2px)",
                      }}
                    />
                    <div
                      className="absolute inset-0 rounded-3xl -z-20"
                      style={{
                        background: item.gradient,
                        opacity: 0.3,
                        transform: "translateY(24px) scale(0.9)",
                        filter: "blur(4px)",
                      }}
                    />
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 展开的详情模态框 */}
      {expandedSeries && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-8"
          style={{
            background: "rgba(0,0,0,0.95)",
            backdropFilter: "blur(20px)",
          }}
          onClick={() => setExpandedId(null)}
        >
          <button
            className="absolute top-8 right-8 w-12 h-12 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
            style={{
              background: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(10px)",
            }}
            onClick={() => setExpandedId(null)}
          >
            <X size={24} />
          </button>

          <div
            className="w-full max-w-7xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-white mb-8">
              <div className="text-sm opacity-70 mb-2">
                {expandedSeries.category} · {expandedSeries.year}
              </div>
              <h2 className="text-5xl font-bold mb-4">{expandedSeries.title}</h2>
              <p className="text-xl opacity-80">{expandedSeries.subtitle}</p>
            </div>

            {/* 主海报 */}
            <div className="mb-12">
              <h3 className="text-white text-2xl font-bold mb-6">主海报</h3>
              <div className="relative aspect-[3/4] max-w-2xl mx-auto rounded-2xl overflow-hidden">
                <img
                  src={expandedSeries.mainPoster.image}
                  alt={expandedSeries.mainPoster.title}
                  className="w-full h-full object-contain"
                  style={{ background: expandedSeries.gradient }}
                />
              </div>
            </div>

            {/* 衍生海报网格 */}
            {expandedSeries.derivedPosters.length > 0 && (
              <div>
                <h3 className="text-white text-2xl font-bold mb-6">
                  衍生海报 ({expandedSeries.derivedPosters.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {expandedSeries.derivedPosters.map((poster) => (
                    <div
                      key={poster.id}
                      className="relative aspect-[3/4] rounded-xl overflow-hidden group cursor-pointer"
                    >
                      <img
                        src={poster.image}
                        alt={poster.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div
                        className="absolute inset-0 flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{
                          background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
                        }}
                      >
                        <div className="text-white">
                          <div className="font-medium">{poster.title}</div>
                          <div className="text-sm opacity-70">{poster.year}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default PosterSeriesScroll;

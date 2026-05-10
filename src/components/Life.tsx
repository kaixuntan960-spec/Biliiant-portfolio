import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Heart, Coffee, Music, Plane, BookOpen, ChevronLeft, ChevronRight, MessageCircle, Send, Bookmark } from "lucide-react";
import LifeQuizModal from "./LifeQuizModal";
import { useI18n, useSiteContent } from "../i18n";
import { useThemeMode } from "../theme";

type CommentItem = {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
};

const COMMENT_NAME_POOL = ["Mia", "Luna", "阿杰", "Nora", "小宇", "Kiki", "子安", "Rico", "Amber", "然然"];
const COMMENT_FALLBACK_BY_CATEGORY: Record<string, string[]> = {
  潜水: ["这张海底氛围太治愈了。", "蓝色层次很好看，像电影截图。", "构图很稳，细节很高级。"],
  赛车: ["这个瞬间抓拍得很准。", "速度感直接拉满了。", "画面张力太强了，很酷。"],
  留学之旅: ["很有生活记录感，真实又自然。", "每张都有故事感，喜欢。", "这组像一篇温柔的旅行日志。"],
  出发旅游: ["看完就想出发去玩。", "色调很舒服，氛围很好。", "风景和人物都很出片。"],
  "cool的一天": ["日常也能拍得这么有感觉。", "很有温度的一组记录。", "平凡瞬间也很动人。"],
};

const pickRandomName = () => COMMENT_NAME_POOL[Math.floor(Math.random() * COMMENT_NAME_POOL.length)];
const rewriteNumericComment = (category: string, text: string, seed = 0) => {
  if (!/^\d+$/.test(text.trim())) return text;
  const pool = COMMENT_FALLBACK_BY_CATEGORY[category] ?? ["这条内容很有共鸣，已收藏。"];
  return pool[seed % pool.length];
};

const getOrCreateViewerId = () => {
  try {
    const key = "life_comment_viewer_id";
    const cached = localStorage.getItem(key);
    if (cached) return cached;
    const next = `u_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
    localStorage.setItem(key, next);
    return next;
  } catch {
    return "u_fallback";
  }
};

const resolveLifeImage = (src: string) => {
  if (!src.startsWith("/life/")) return src;
  const parts = src.split("/");
  const fileName = parts[parts.length - 1] ?? "";
  return fileName ? `/life/${fileName}` : src;
};

const normalizeCommentsMap = (raw: unknown): Record<string, CommentItem[]> => {
  if (!raw || typeof raw !== "object") return {};
  const map = raw as Record<string, unknown>;
  const out: Record<string, CommentItem[]> = {};
  Object.entries(map).forEach(([postId, val]) => {
    if (!Array.isArray(val)) return;
    out[postId] = val
      .map((item, idx) => {
        if (typeof item === "string") {
          return {
            id: `${postId}-${idx}`,
            authorId: "legacy-user",
            authorName: pickRandomName(),
            text: item,
            createdAt: new Date().toISOString(),
          } satisfies CommentItem;
        }
        if (!item || typeof item !== "object") return null;
        const obj = item as Partial<CommentItem>;
        if (!obj.text) return null;
        return {
          id: obj.id ?? `${postId}-${idx}-${Date.now()}`,
          authorId: obj.authorId ?? "legacy-user",
          authorName: obj.authorName && obj.authorName !== "访客" && obj.authorName !== "Guest" ? obj.authorName : pickRandomName(),
          text: obj.text,
          createdAt: obj.createdAt ?? new Date().toISOString(),
        } satisfies CommentItem;
      })
      .filter(Boolean) as CommentItem[];
  });
  return out;
};

const PRIORITY_CATEGORIES = ["潜水", "赛车", "留学之旅"];

const useInView = (threshold = 0.1) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
    }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
};

const getCategoryIcon = (iconName: string, size = 13) => {
  if (iconName === "Camera") return <Camera size={size} />;
  if (iconName === "Coffee") return <Coffee size={size} />;
  if (iconName === "Music") return <Music size={size} />;
  if (iconName === "Plane") return <Plane size={size} />;
  if (iconName === "BookOpen") return <BookOpen size={size} />;
  if (iconName === "Heart") return <Heart size={size} />;
  return <Camera size={size} />;
};

const Life = () => {
  const { lang } = useI18n();
  const siteContent = useSiteContent();
  const { resolvedTheme } = useThemeMode();
  const LIFE_CATEGORIES = siteContent.life.categories;
  const LIFE_PHOTOS = siteContent.life.photos;
  const { ref, inView } = useInView(0.12);
  const [locked, setLocked] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [filterCategory, setFilterCategory] = useState(lang === "en" ? "All" : "全部");
  const [likedMap, setLikedMap] = useState<Record<number, boolean>>({});
  const [likeCountMap, setLikeCountMap] = useState<Record<number, number>>({});
  const [bookmarkedMap, setBookmarkedMap] = useState<Record<string, boolean>>({});
  const [commentInputMap, setCommentInputMap] = useState<Record<string, string>>({});
  const [commentsMap, setCommentsMap] = useState<Record<string, CommentItem[]>>({});
  const [commentSyncState, setCommentSyncState] = useState<Record<string, "idle" | "syncing" | "ok" | "error">>({});
  const [seenCommentCountMap, setSeenCommentCountMap] = useState<Record<string, number>>({});
  const [postImageIndexMap, setPostImageIndexMap] = useState<Record<string, number>>({});
  const [autoPlayPostMap, setAutoPlayPostMap] = useState<Record<string, boolean>>({});
  const [imageNavFxMap, setImageNavFxMap] = useState<Record<string, "prev" | "next" | undefined>>({});
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const postCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [viewerId, setViewerId] = useState("u_fallback");
  const ownerViewerId = (import.meta.env.VITE_LIFE_OWNER_VIEWER_ID as string | undefined) ?? "";
  const isOwnerView = ownerViewerId && viewerId === ownerViewerId;

  useEffect(() => {
    setViewerId(getOrCreateViewerId());
  }, []);

  useEffect(() => {
    try {
      const unlocked = localStorage.getItem("life_quiz_unlocked") === "1";
      if (unlocked) {
        setLocked(false);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    setFilterCategory(lang === "en" ? "All" : "全部");
    setCurrentSlide(0);
  }, [lang]);

  useEffect(() => {
    try {
      const rawLiked = localStorage.getItem("life_post_liked_map");
      const rawCounts = localStorage.getItem("life_post_like_count_map");
      const parsedLiked = rawLiked ? (JSON.parse(rawLiked) as Record<string, boolean>) : {};
      const parsedCounts = rawCounts ? (JSON.parse(rawCounts) as Record<string, number>) : {};
      const nextLiked: Record<number, boolean> = {};
      const nextCounts: Record<number, number> = {};
      LIFE_PHOTOS.forEach((p, idx) => {
        nextLiked[p.id] = Boolean(parsedLiked[String(p.id)]);
        nextCounts[p.id] = Number.isFinite(parsedCounts[String(p.id)]) ? parsedCounts[String(p.id)] : 96 + idx * 7;
      });
      setLikedMap(nextLiked);
      setLikeCountMap(nextCounts);
    } catch {
      const nextLiked: Record<number, boolean> = {};
      const nextCounts: Record<number, number> = {};
      LIFE_PHOTOS.forEach((p, idx) => {
        nextLiked[p.id] = false;
        nextCounts[p.id] = 96 + idx * 7;
      });
      setLikedMap(nextLiked);
      setLikeCountMap(nextCounts);
    }
  }, [LIFE_PHOTOS]);

  useEffect(() => {
    try {
      const rawBookmarks = localStorage.getItem("life_post_bookmark_map");
      const rawComments = localStorage.getItem("life_post_comments_map");
      const rawSeenCounts = localStorage.getItem("life_post_seen_comment_count_map");
      if (rawBookmarks) setBookmarkedMap(JSON.parse(rawBookmarks) as Record<string, boolean>);
      if (rawComments) setCommentsMap(normalizeCommentsMap(JSON.parse(rawComments)));
      if (rawSeenCounts) setSeenCommentCountMap(JSON.parse(rawSeenCounts) as Record<string, number>);
    } catch {
      // ignore storage errors
    }
  }, []);

  const LIFE_SLOGANS: Array<{ text: string }> =
    lang === "en"
      ? [
          { text: "Cinematic Life Archive" },
          { text: "Unlock to explore real moments" },
          { text: "Curated visual stories" },
        ]
      : [
          { text: "电影感生活档案" },
          { text: "解锁后浏览真实日常" },
          { text: "精选视觉故事集" },
        ];

  const allLabel = lang === "en" ? "All" : "全部";
  const filteredPhotos = filterCategory === allLabel ? LIFE_PHOTOS : LIFE_PHOTOS.filter((p) => p.category === filterCategory);
  const groupedPosts = useMemo(() => {
    const groups: Array<{ id: string; category: string; items: typeof LIFE_PHOTOS; title: string; desc: string; tag: string; gradient: string }> = [];
    if (filterCategory === allLabel) {
      const byCategory = new globalThis.Map<string, typeof LIFE_PHOTOS>();
      LIFE_PHOTOS.forEach((p) => {
        const existing = byCategory.get(p.category) ?? [];
        byCategory.set(p.category, [...existing, p]);
      });
      Array.from(byCategory.entries()).forEach(([category, items], idx) => {
        const head = items[0];
        groups.push({
          id: `${category}-${idx}`,
          category,
          items,
          title: head.title,
          desc: head.desc,
          tag: head.tag,
          gradient: head.gradient,
        });
      });
      groups.sort((a, b) => {
        const ai = PRIORITY_CATEGORIES.indexOf(a.category);
        const bi = PRIORITY_CATEGORIES.indexOf(b.category);
        const ar = ai === -1 ? 999 : ai;
        const br = bi === -1 ? 999 : bi;
        if (ar !== br) return ar - br;
        return a.category.localeCompare(b.category);
      });
    } else {
      for (let i = 0; i < filteredPhotos.length; i += 3) {
        const chunk = filteredPhotos.slice(i, i + 3);
        if (!chunk.length) continue;
        const head = chunk[0];
        groups.push({
          id: `${head.category}-${Math.floor(i / 3)}`,
          category: head.category,
          items: chunk,
          title: head.title,
          desc: head.desc,
          tag: head.tag,
          gradient: head.gradient,
        });
      }
    }
    return groups;
  }, [LIFE_PHOTOS, filteredPhotos, filterCategory, allLabel]);

  useEffect(() => {
    if (!groupedPosts.length) return;
    setCommentsMap((prev) => {
      const hasAny = Object.values(prev).some((list) => (list?.length ?? 0) > 0);
      if (hasAny) return prev;
      const now = Date.now();
      const seedByCategory: Record<string, Array<{ name: string; text: string }>> = {
        潜水: [
          { name: "Mia", text: "这一组海底光影太绝了，像电影分镜。" },
          { name: "Rico", text: "蓝色层次很干净，氛围感直接拉满。" },
        ],
        赛车: [
          { name: "阿杰", text: "冲线那张太燃了，速度感特别强。" },
          { name: "Amber", text: "每张都很有张力，像赛事海报。" },
        ],
        留学之旅: [
          { name: "Luna", text: "日常和城市感结合得很好，很真实。" },
          { name: "Nora", text: "像在翻你的留学日志，故事感很强。" },
        ],
        出发旅游: [
          { name: "Kiki", text: "看完就想立刻订票出发了哈哈。" },
          { name: "子安", text: "风景和人物都很自然，舒服耐看。" },
        ],
        "cool的一天": [
          { name: "小宇", text: "普通一天也能这么有质感，太会拍了。" },
          { name: "然然", text: "这组很有生活温度，越看越喜欢。" },
        ],
      };
      const seeded: Record<string, CommentItem[]> = { ...prev };
      groupedPosts.forEach((post, postIdx) => {
        if ((seeded[post.id]?.length ?? 0) > 0) return;
        const seeds = seedByCategory[post.category] ?? [{ name: pickRandomName(), text: "这组内容很有故事感，收藏了。" }];
        seeded[post.id] = seeds.map((s, idx) => ({
          id: `${post.id}-seed-${idx}`,
          authorId: `seed-${post.category}-${idx}`,
          authorName: s.name,
          text: s.text,
          createdAt: new Date(now - (postIdx * 2 + idx + 1) * 3600_000).toISOString(),
        }));
      });
      try {
        localStorage.setItem("life_post_comments_map", JSON.stringify(seeded));
      } catch {
        // ignore
      }
      return seeded;
    });
  }, [groupedPosts]);

  const playTone = (freq: number, dur = 0.2) => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch (e) {
      console.log("audio err", e);
    }
  };

  const goToSlide = (nextIdx: number) => {
    if (!groupedPosts.length) return;
    const clamped = Math.max(0, Math.min(groupedPosts.length - 1, nextIdx));
    setSlideDirection(clamped >= currentSlide ? 1 : -1);
    setCurrentSlide(clamped);
  };
  const scrollLeft = () => goToSlide(currentSlide - 1);
  const scrollRight = () => goToSlide(currentSlide + 1);
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    setCanScrollLeft(currentSlide > 0);
    setCanScrollRight(currentSlide < groupedPosts.length - 1);
    const active = groupedPosts[currentSlide];
    if (!active) return;
    postCardRefs.current[active.id]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [currentSlide, groupedPosts]);

  // Disabled auto-scrolling to avoid unwanted movement while typing/chatting.

  useEffect(() => {
    const activeIds = Object.entries(autoPlayPostMap).filter(([, v]) => v).map(([k]) => k);
    if (!activeIds.length) return;
    const timer = window.setInterval(() => {
      setPostImageIndexMap((prev) => {
        const next = { ...prev };
        activeIds.forEach((postId) => {
          const post = groupedPosts.find((p) => p.id === postId);
          if (!post) return;
          const current = next[postId] ?? 0;
          if (current < post.items.length - 1) {
            next[postId] = current + 1;
          }
        });
        return next;
      });
    }, 2600);
    return () => window.clearInterval(timer);
  }, [autoPlayPostMap, groupedPosts]);

  useEffect(() => {
    const activePost = groupedPosts[currentSlide];
    if (!activePost) return;
    const visibleCount = (commentsMap[activePost.id] ?? []).filter((c) => isOwnerView || c.authorId === viewerId).length;
    setSeenCommentCountMap((prev) => {
      if ((prev[activePost.id] ?? 0) >= visibleCount) return prev;
      const next = { ...prev, [activePost.id]: visibleCount };
      try {
        localStorage.setItem("life_post_seen_comment_count_map", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, [currentSlide, groupedPosts, commentsMap, isOwnerView, viewerId]);

  const toggleLikePost = (photoId: number) => {
    setLikedMap((prev) => {
      const nextLiked = !prev[photoId];
      const merged = { ...prev, [photoId]: nextLiked };
      setLikeCountMap((prevCounts) => {
        const current = prevCounts[photoId] ?? 0;
        const nextCounts = { ...prevCounts, [photoId]: Math.max(0, current + (nextLiked ? 1 : -1)) };
        try {
          localStorage.setItem("life_post_like_count_map", JSON.stringify(nextCounts));
        } catch {
          // ignore
        }
        return nextCounts;
      });
      try {
        localStorage.setItem("life_post_liked_map", JSON.stringify(merged));
      } catch {
        // ignore
      }
      return merged;
    });
  };

  const toggleBookmark = (postId: string) => {
    setBookmarkedMap((prev) => {
      const next = { ...prev, [postId]: !prev[postId] };
      try {
        localStorage.setItem("life_post_bookmark_map", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const submitComment = async (postId: string) => {
    const text = (commentInputMap[postId] ?? "").trim();
    if (!text) return;
    const nextComment: CommentItem = {
      id: `${postId}-${Date.now()}`,
      authorId: viewerId,
      authorName: pickRandomName(),
      text,
      createdAt: new Date().toISOString(),
    };
    setCommentsMap((prev) => {
      const next = { ...prev, [postId]: [...(prev[postId] ?? []), nextComment] };
      try {
        localStorage.setItem("life_post_comments_map", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    setCommentInputMap((prev) => ({ ...prev, [postId]: "" }));

    // Optional: set VITE_LIFE_COMMENT_WEBHOOK_URL to receive comments on your server.
    const webhook = import.meta.env.VITE_LIFE_COMMENT_WEBHOOK_URL as string | undefined;
    if (!webhook) return;
    setCommentSyncState((prev) => ({ ...prev, [postId]: "syncing" }));
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          category: groupedPosts.find((p) => p.id === postId)?.category ?? "",
          message: text,
          createdAt: new Date().toISOString(),
        }),
      });
      setCommentSyncState((prev) => ({ ...prev, [postId]: "ok" }));
    } catch {
      setCommentSyncState((prev) => ({ ...prev, [postId]: "error" }));
    }
  };

  const getCategoryCaption = (category: string) => {
    if (category === "cool的一天") return lang === "en" ? "Good vibes in ordinary days." : "把好心情装进普通一天。";
    if (category === "出发旅游") return lang === "en" ? "Departure mode on." : "出发的时候，世界都会变慢一点。";
    if (category === "潜水") return lang === "en" ? "Blue world under the surface." : "下潜之后，只剩蓝色和呼吸。";
    if (category === "留学之旅") return lang === "en" ? "Cross-cultural memories on the road." : "留学路上的片段，都值得收藏。";
    if (category === "赛车") return lang === "en" ? "Speed, focus and adrenaline." : "速度、专注和肾上腺素。";
    return lang === "en" ? "Moments worth keeping." : "记录值得回看的瞬间。";
  };

  return (
    <section id="life" ref={ref} className="relative overflow-hidden" style={{ background: "var(--life-section-bg)", paddingTop: "var(--space-16)", paddingBottom: "var(--space-16)", transition: "background 420ms ease" }}>
      <div className="absolute top-0 left-0 right-0" style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgb(255, 107, 157), transparent)" }} />

      <div className="container-standard">
        <div id="photos" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between" style={{ marginBottom: "var(--space-8)", gap: "var(--space-4)" }}>
          <div className="flex items-center flex-wrap" style={{ gap: "var(--space-5)" }}>
            <div>
              <p className="tracking-widest uppercase font-semibold" style={{ fontSize: "var(--text-xs)", color: "rgb(255, 107, 157)", marginBottom: "var(--space-2)" }}>
                Personal Life
              </p>
              <h2 style={{ fontSize: "var(--text-3xl)", fontWeight: 900, letterSpacing: "-0.025em", lineHeight: 1 }}>
                {lang === "en" ? (
                  <>
                    <span className="text-foreground">Personal</span>
                    <span className="ml-2 text-gradient">
                      Life
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-foreground">个人</span>
                    <span className="ml-2 text-gradient">
                      生活
                    </span>
                  </>
                )}
              </h2>
            </div>
            <div className="flex flex-wrap items-center" style={{ gap: "var(--space-2)" }}>
              {LIFE_SLOGANS.map((s) => (
                <div
                  key={s.text}
                  className="flex items-center border border-border"
                  style={{
                    gap: "var(--space-2)",
                    padding: "5px 12px",
                    borderRadius: "var(--radius-full)",
                    fontSize: "var(--text-xs)",
                    background: "var(--card)",
                    color: "var(--muted-foreground)",
                  }}
                >
                  <span className="font-medium">{s.text}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-muted-foreground leading-relaxed hidden md:block text-right" style={{ maxWidth: "180px", fontSize: "var(--text-xs)" }}>
            {siteContent.life.headerDesc}
          </p>
        </div>

        {locked && (
          <div className={`transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
            <div className="relative overflow-hidden" style={{ borderRadius: "var(--radius-2xl)" }}>
              <div
                className="flex pointer-events-none select-none opacity-30 blur-sm items-center justify-center"
                style={{ gap: "var(--space-3)", minHeight: "240px", padding: "var(--space-6)" }}
              >
                {LIFE_PHOTOS.slice(0, 5).map((p) => (
                  <div
                    key={p.id}
                    className="rounded-2xl flex-shrink-0 overflow-hidden"
                    style={{ width: "160px", height: "140px", background: p.gradient }}
                  >
                    <img src={resolveLifeImage(p.image)} alt={p.title} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <div
                className="absolute inset-0 flex items-center justify-center flex-col text-center"
                style={{
                  background: "var(--overlay-strong)",
                  gap: "var(--space-3)",
                  padding: "var(--space-6)",
                  transition: "background 420ms ease",
                }}
              >
                <div className="font-medium" style={{ padding: "var(--space-2) var(--space-5)", borderRadius: "var(--radius-full)", fontSize: "var(--text-xs)", background: "rgba(255,107,157,0.12)", color: "rgb(255, 107, 157)", border: "1px solid rgba(255,107,157,0.25)" }}>
                  {siteContent.life.locked.title}
                </div>
                <button onClick={() => setShowQuiz(true)} className="flex items-center font-bold transition-all duration-300 hover:scale-105" style={{ gap: "var(--space-3)", padding: "var(--space-4) var(--space-8)", borderRadius: "var(--radius-xl)", fontSize: "var(--text-sm)", background: "var(--btn-primary-bg)", boxShadow: "var(--btn-primary-shadow)", color: "rgb(255, 255, 255)" }}>
                  <span>🎮</span>
                  {siteContent.life.locked.button}
                  <span>→</span>
                </button>
                <p className="text-muted-foreground" style={{ fontSize: "var(--text-xs)" }}>
                  {siteContent.life.locked.hint(LIFE_PHOTOS.length)}
                </p>
              </div>
            </div>
          </div>
        )}

        {!locked && (
          <div className={`transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
            <div className="flex items-center border" style={{ gap: "var(--space-3)", padding: "var(--space-3) var(--space-5)", borderRadius: "var(--radius-xl)", borderColor: "rgba(0,212,170,0.2)", background: "rgba(0,212,170,0.06)", color: "rgb(0, 212, 170)", fontSize: "var(--text-sm)", marginBottom: "var(--space-5)" }}>
              <span>{siteContent.life.unlocked.banner(LIFE_PHOTOS.length).left}</span>
              <span className="font-medium">{siteContent.life.unlocked.banner(LIFE_PHOTOS.length).text}</span>
              <span className="ml-auto text-muted-foreground" style={{ fontSize: "var(--text-xs)" }}>
                {siteContent.life.unlocked.banner(LIFE_PHOTOS.length).right}
              </span>
            </div>

            <div className="flex flex-wrap items-center" style={{ gap: "var(--space-2)", marginBottom: "var(--space-5)" }}>
              <button
                onClick={() => {
                  setFilterCategory(allLabel);
                  setCurrentSlide(0);
                }}
                className="font-medium transition-all hover:-translate-y-0.5 active:scale-95"
                style={{
                  padding: "5px 16px",
                  borderRadius: "var(--radius-full)",
                  fontSize: "var(--text-xs)",
                  background: filterCategory === allLabel ? "var(--btn-primary-bg)" : "var(--card)",
                  color: filterCategory === allLabel ? "rgb(255,255,255)" : "var(--muted-foreground)",
                  border: filterCategory === allLabel ? "none" : "1px solid var(--border)",
                  transition: "all 260ms cubic-bezier(0.22,1,0.36,1)",
                  boxShadow: filterCategory === allLabel ? "0 8px 20px rgba(168,85,247,0.24)" : "0 4px 12px rgba(15,23,42,0.06)",
                }}
              >
                {allLabel} <span className="opacity-60 ml-1">{LIFE_PHOTOS.length}</span>
              </button>
              {LIFE_CATEGORIES.map((cat) => (
                <button key={cat.label} onClick={() => { setFilterCategory(cat.label); setCurrentSlide(0); }} className="flex items-center font-medium transition-all hover:-translate-y-0.5 active:scale-95" style={{ gap: "var(--space-1)", padding: "5px 16px", borderRadius: "var(--radius-full)", fontSize: "var(--text-xs)", background: "var(--card)", color: filterCategory === cat.label ? cat.color : "var(--muted-foreground)", border: filterCategory === cat.label ? `1px solid ${cat.color}` : "1px solid var(--border)", transition: "all 260ms cubic-bezier(0.22,1,0.36,1)", boxShadow: filterCategory === cat.label ? `0 8px 18px ${cat.color}2d` : "0 4px 10px rgba(15,23,42,0.05)" }}>
                  {getCategoryIcon(cat.icon)}
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="relative" style={{ marginBottom: "var(--space-4)" }}>
              {canScrollLeft && (
                <button onClick={scrollLeft} className="absolute z-10 flex items-center justify-center top-1/2 -translate-y-1/2 transition-all hover:scale-110" style={{ left: "-16px", width: "32px", height: "32px", borderRadius: "var(--radius-full)", background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
                  <ChevronLeft size={14} />
                </button>
              )}
              <div
                ref={scrollRef}
                className="flex"
                style={{
                  gap: "0px",
                  paddingTop: "8px",
                  paddingBottom: "var(--space-2)",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  scrollSnapType: "none",
                  overflowX: "hidden",
                  justifyContent: "center",
                  perspective: "1400px",
                  minHeight: "366px",
                }}
              >
                {groupedPosts.map((post, i) => {
                  const currentIdx = postImageIndexMap[post.id] ?? 0;
                  const currentItem = post.items[currentIdx] ?? post.items[0];
                  const imageNavFx = imageNavFxMap[post.id];
                  const visibleComments = (commentsMap[post.id] ?? []).filter((c) => isOwnerView || c.authorId === viewerId);
                  const unreadCount = Math.max(0, visibleComments.length - (seenCommentCountMap[post.id] ?? 0));
                  const isActiveCard = currentSlide === i;
                  const delta = i - currentSlide;
                  const depth = Math.min(2, Math.abs(delta));
                  const useVideoPreset = true;
                  const cardWidth = isActiveCard ? (useVideoPreset ? "246px" : "252px") : (useVideoPreset ? "160px" : "192px");
                  const cardOpacity = useVideoPreset ? (depth > 1 ? 0.42 : isActiveCard ? 1 : 0.74) : (depth > 1 ? 0.64 : isActiveCard ? 1 : 0.82);
                  const cardTransform = useVideoPreset
                    ? (isActiveCard
                      ? "translate3d(0,0,0) scale(1)"
                      : `translate3d(${delta > 0 ? 30 : -30}px, ${depth === 1 ? 12 : 18}px,0) scale(${depth === 1 ? 0.84 : 0.76}) rotate(${delta > 0 ? 5.2 : -5.2}deg)`)
                    : (isActiveCard
                      ? "translate3d(0,-2px,0) scale(1)"
                      : `translate3d(${delta > 0 ? 8 : -8}px, ${depth === 1 ? 2 : 6}px,0) scale(${depth === 1 ? 0.94 : 0.9}) rotate(${delta > 0 ? 1.4 : -1.4}deg)`);
                  const showCommentList = isActiveCard && visibleComments.length > 0;
                  const bottomPanelHeight = showCommentList ? 128 : isActiveCard ? 102 : 86;
                  return (
                  <div
                    key={post.id}
                    ref={(el) => {
                      postCardRefs.current[post.id] = el;
                    }}
                    onClick={() => goToSlide(i)}
                    className="group relative flex-shrink-0 overflow-hidden cursor-pointer"
                    style={{
                      width: cardWidth,
                      height: "318px",
                      marginLeft: i === 0 ? "0px" : "-46px",
                      borderRadius: "22px",
                      border: currentSlide === i
                        ? (isDark ? "1px solid rgba(192,132,252,0.68)" : "1px solid rgba(196,181,253,0.92)")
                        : (isDark ? "1px solid rgba(148,163,184,0.24)" : "1px solid rgba(196,181,253,0.56)"),
                      background: isDark ? "rgba(30,41,59,0.56)" : "rgba(255,255,255,0.58)",
                      transition: "width 0.5s cubic-bezier(0.22,1,0.36,1), border-color 0.35s ease, transform 0.55s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s ease, opacity 0.45s ease",
                      transform: cardTransform,
                      opacity: cardOpacity,
                      filter: "none",
                      boxShadow: currentSlide === i
                        ? (isDark ? "0 18px 42px rgba(2,6,23,0.3), 0 0 0 1px rgba(216,180,254,0.44), 0 0 28px rgba(192,132,252,0.32)" : "0 16px 32px rgba(76,29,149,0.16), 0 0 0 1px rgba(196,181,253,0.8), 0 0 22px rgba(167,139,250,0.28)")
                        : (isDark ? "0 8px 18px rgba(2,6,23,0.16)" : "0 8px 16px rgba(76,29,149,0.08)"),
                      scrollSnapAlign: "center",
                      zIndex: 20 - depth,
                      pointerEvents: "auto",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    <div
                      className="absolute left-0 right-0 overflow-hidden"
                      style={{
                        top: "0px",
                        bottom: `${bottomPanelHeight}px`,
                        background: isDark ? "#111827" : "#f1f5f9",
                      }}
                    >
                      <img
                        src={resolveLifeImage(currentItem.image)}
                        alt={currentItem.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{
                          filter: isDark ? "blur(10px) saturate(1.06)" : "blur(10px) saturate(1.02) brightness(1.03)",
                          transform: "scale(1.08)",
                          opacity: isDark ? 0.34 : 0.32,
                        }}
                      />
                      <div
                        className="absolute inset-0"
                        style={{
                          background: isDark
                            ? "linear-gradient(180deg, rgba(10,14,20,0.08) 0%, rgba(10,14,20,0.28) 100%)"
                            : "linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(226,232,240,0.34) 100%)",
                        }}
                      />
                      <img
                        src={resolveLifeImage(currentItem.image)}
                        alt={currentItem.title}
                        className="relative w-full h-full object-contain"
                        style={{
                          transform: `translate3d(${(imageNavFx === "next" ? -10 : imageNavFx === "prev" ? 10 : 0) + (isActiveCard ? 0 : slideDirection * (useVideoPreset ? -10 : -4))}px, ${useVideoPreset && !isActiveCard ? "3px" : "0px"}, 0) scale(${imageNavFx ? 0.985 : 1})`,
                          transition: "transform 260ms cubic-bezier(0.22,1,0.36,1), opacity 220ms ease",
                          opacity: imageNavFx ? 0.92 : 1,
                        }}
                      />
                      {currentSlide === i && post.items.length > 1 && (
                        <div
                          className="absolute left-0 right-0 bottom-2 flex items-center justify-center"
                          style={{
                            gap: "6px",
                            pointerEvents: "none",
                          }}
                        >
                          {post.items.map((_, dotIdx) => (
                            <span
                              key={`${post.id}-dot-${dotIdx}`}
                              style={{
                                width: dotIdx === currentIdx ? "14px" : "6px",
                                height: "6px",
                                borderRadius: "999px",
                                background: dotIdx === currentIdx ? "rgba(255,255,255,0.98)" : "rgba(255,255,255,0.58)",
                                transition: "width 180ms ease",
                                boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
                              }}
                            />
                          ))}
                          <span
                            style={{
                              marginLeft: "6px",
                              fontSize: "10px",
                              color: "rgba(255,255,255,0.96)",
                              background: "rgba(0,0,0,0.34)",
                              borderRadius: "999px",
                              padding: "1px 6px",
                            }}
                          >
                            {currentIdx + 1}/{post.items.length}
                          </span>
                        </div>
                      )}
                      {post.items.length > 1 && (
                        <>
                          {currentIdx > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentSlide(i);
                                setImageNavFxMap((prev) => ({ ...prev, [post.id]: "prev" }));
                                setPostImageIndexMap((prev) => ({ ...prev, [post.id]: Math.max(0, currentIdx - 1) }));
                                window.setTimeout(() => {
                                  setImageNavFxMap((prev) => ({ ...prev, [post.id]: undefined }));
                                }, 220);
                              }}
                              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center"
                              style={{
                                background: isDark ? "rgba(15,23,42,0.14)" : "rgba(255,255,255,0.38)",
                                color: isDark ? "rgba(255,255,255,0.84)" : "rgba(15,23,42,0.58)",
                                border: isDark ? "1px solid rgba(148,163,184,0.1)" : "1px solid rgba(255,255,255,0.64)",
                                backdropFilter: "blur(8px)",
                              }}
                            >
                              <ChevronLeft size={14} />
                            </button>
                          )}
                          {currentIdx < post.items.length - 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentSlide(i);
                                setImageNavFxMap((prev) => ({ ...prev, [post.id]: "next" }));
                                setPostImageIndexMap((prev) => ({ ...prev, [post.id]: Math.min(post.items.length - 1, currentIdx + 1) }));
                                window.setTimeout(() => {
                                  setImageNavFxMap((prev) => ({ ...prev, [post.id]: undefined }));
                                }, 220);
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center"
                              style={{
                                background: isDark ? "rgba(15,23,42,0.14)" : "rgba(255,255,255,0.38)",
                                color: isDark ? "rgba(255,255,255,0.84)" : "rgba(15,23,42,0.58)",
                                border: isDark ? "1px solid rgba(148,163,184,0.1)" : "1px solid rgba(255,255,255,0.64)",
                                backdropFilter: "blur(8px)",
                              }}
                            >
                              <ChevronRight size={14} />
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    <div className="absolute left-0 right-0 bottom-0" style={{ height: `${bottomPanelHeight}px`, background: isDark ? "rgba(15,23,42,0.9)" : "rgba(255,255,255,0.92)", borderTop: isDark ? "1px solid rgba(148,163,184,0.18)" : "1px solid rgba(147,51,234,0.18)", backdropFilter: "blur(12px)", padding: "8px 10px" }}>
                      <div className="flex items-center justify-between" style={{ marginBottom: "4px" }}>
                        <div className="flex items-center" style={{ gap: "12px" }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLikePost(currentItem.id);
                            }}
                            className="flex items-center justify-center transition-transform hover:scale-110"
                            style={{ width: "22px", height: "22px" }}
                          >
                            <Heart
                              size={18}
                              style={{
                                color: likedMap[currentItem.id] ? "rgb(255,107,157)" : "var(--foreground)",
                                fill: likedMap[currentItem.id] ? "rgb(255,107,157)" : "transparent",
                              }}
                            />
                          </button>
                          <div className="relative" style={{ width: "17px", height: "17px" }}>
                            <MessageCircle size={17} />
                            {unreadCount > 0 && (
                              <span
                                style={{
                                  position: "absolute",
                                  top: "-6px",
                                  right: "-8px",
                                  minWidth: "14px",
                                  height: "14px",
                                  borderRadius: "999px",
                                  background: "rgb(255,107,157)",
                                  color: "#fff",
                                  fontSize: "9px",
                                  lineHeight: "14px",
                                  textAlign: "center",
                                  padding: "0 3px",
                                  fontWeight: 700,
                                  boxShadow: "0 2px 6px rgba(255,107,157,0.45)",
                                }}
                              >
                                {unreadCount > 99 ? "99+" : unreadCount}
                              </span>
                            )}
                          </div>
                          <Send size={17} />
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBookmark(post.id);
                          }}
                          className="flex items-center justify-center"
                        >
                          <Bookmark size={17} style={{ fill: bookmarkedMap[post.id] ? "rgba(168,85,247,0.8)" : "transparent", color: "var(--foreground)" }} />
                        </button>
                      </div>
                      <div style={{ fontSize: "10px", fontWeight: 700, marginBottom: "2px" }}>
                        {likeCountMap[currentItem.id] ?? 0} {lang === "en" ? "likes" : "人点赞"}
                      </div>
                      <div className="text-muted-foreground" style={{ fontSize: "10px", lineHeight: 1.25 }}>
                        {post.category}
                      </div>
                      {currentSlide === i && (
                        <div className="flex items-center" style={{ gap: "6px", marginTop: "5px" }}>
                          <input
                            value={commentInputMap[post.id] ?? ""}
                            onChange={(e) => setCommentInputMap((prev) => ({ ...prev, [post.id]: e.target.value }))}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                submitComment(post.id);
                              }
                            }}
                            placeholder={lang === "en" ? "Leave a comment..." : "留下你的评论..."}
                            style={{
                              flex: 1,
                              height: "22px",
                              borderRadius: "999px",
                              border: isDark ? "1px solid rgba(148,163,184,0.3)" : "1px solid rgba(167,139,250,0.45)",
                              padding: "0 10px",
                              fontSize: "9px",
                              background: isDark ? "rgba(15,23,42,0.74)" : "rgba(255,255,255,0.96)",
                              color: "var(--foreground)",
                            }}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              submitComment(post.id);
                            }}
                            style={{ fontSize: "10px", color: "var(--primary)", fontWeight: 700 }}
                          >
                            {lang === "en" ? "Send" : "发送"}
                          </button>
                        </div>
                      )}
                      {showCommentList && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            marginTop: "4px",
                            maxHeight: "44px",
                            overflowY: visibleComments.length > 1 ? "auto" : "hidden",
                            borderRadius: "8px",
                            paddingRight: "4px",
                          }}
                        >
                          {visibleComments.map((comment, idx) => {
                            const shownText = rewriteNumericComment(post.category, comment.text, idx);
                            return (
                            <div
                              key={comment.id}
                              style={{
                                fontSize: "9px",
                                lineHeight: 1.28,
                                color: "var(--muted-foreground)",
                                marginBottom: "2px",
                                whiteSpace: "normal",
                                wordBreak: "break-word",
                              }}
                              title={`${comment.authorName}: ${shownText}`}
                            >
                              {comment.authorName}：{shownText}
                            </div>
                          )})}
                        </div>
                      )}
                      {currentSlide === i && commentSyncState[post.id] && commentSyncState[post.id] !== "idle" && (
                        <div style={{ marginTop: "2px", fontSize: "9px", color: commentSyncState[post.id] === "error" ? "rgb(239,68,68)" : "var(--muted-foreground)" }}>
                          {commentSyncState[post.id] === "syncing"
                            ? (lang === "en" ? "Syncing..." : "同步中...")
                            : commentSyncState[post.id] === "ok"
                              ? (lang === "en" ? "Received" : "已接收")
                              : (lang === "en" ? "Sync failed" : "同步失败")}
                        </div>
                      )}
                    </div>
                  </div>
                )})}
              </div>
              {canScrollRight && (
                <button onClick={scrollRight} className="absolute z-10 flex items-center justify-center top-1/2 -translate-y-1/2 transition-all hover:scale-110" style={{ right: "-16px", width: "32px", height: "32px", borderRadius: "var(--radius-full)", background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
                  <ChevronRight size={14} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <LifeQuizModal
        visible={showQuiz}
        onClose={() => setShowQuiz(false)}
        onPass={() => {
          setShowQuiz(false);
          setLocked(false);
          try {
            localStorage.setItem("life_quiz_unlocked", "1");
          } catch {
            // ignore storage errors
          }
          playTone(523, 0.1);
          setTimeout(() => playTone(659, 0.1), 120);
          setTimeout(() => playTone(784, 0.15), 240);
        }}
      />
    </section>
  );
};

export default Life;


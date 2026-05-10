export type NavItem = { label: string; href: string; badgeDot?: boolean };

export type HeroStat = { num: string; label: string };

export type EducationItem = {
  school: string;
  degree: string;
  period: string;
  gpa: string;
  desc: string;
  tag: string;
};

export type HonorItem = { title: string; year: string; level: string; details?: string[]; proof?: { label: string; value: string }[]; proofImages?: string[] };

export type ExperienceStat = { icon: "Zap" | "Users" | "Star"; label: string; value: string };
export type ExperienceItem = {
  company: string;
  role: string;
  period: string;
  location: string;
  desc: string;
  tags: string[];
  color: string;
  colorHex: string;
  emoji: string;
  highlight: string;
  stats: ExperienceStat[];
  story: string;
  achievement: string;
};

export type WorkItem = {
  title: string;
  subtitle: string;
  category: string;
  year: string;
  tags: string[];
  gradient: string;
  emoji: string;
  featured: boolean;
  award?: string;
  desc: string;
  caseHref?: string;
  slug?: string;
  coverImage?: string;
};

export type SkillGroup = {
  category: string;
  color: string;
  skills: Array<{ name: string; level: number }>;
};

export type LifeCategory = {
  icon: "Camera" | "Coffee" | "Music" | "Plane" | "BookOpen" | "Heart";
  label: string;
  color: string;
};
export type LifePhoto = { id: number; category: string; title: string; desc: string; emoji: string; gradient: string; tag: string; image: string };
export type LifeStat = { emoji: string; num: string; label: string };

export type SocialLink = { icon: "Mail" | "Github" | "Linkedin" | "WeChat"; label: string; value: string; href: string };
export type PresetQuestion = { emoji: string; text: string };

export const siteContentZh = {
  nav: {
    brand: {
      markText: "TK",
      name: "Kaixun Tan",
    },
    items: [
      { label: "关于", href: "#about" },
      { label: "教育", href: "#education" },
      { label: "经历", href: "#experience" },
      { label: "作品", href: "#works" },
      { label: "技能", href: "#skills" },
      { label: "生活", href: "#life", badgeDot: true },
      { label: "联系", href: "#contact" },
    ] satisfies NavItem[],
    cta: { label: "联系我", href: "#contact" },
  },

  hero: {
    badge: "Available for Work · 2026",
    firstName: "KAI",
    middleNameGradient: "XUN",
    lastName: "TAN",
    avatarImage: "/avatar-profile.png",
    rotatingWords: ["UI/UX Designer", "AIGC Designer", "Vibe Coding Maker", "Product Thinker"],
    descriptionLines: ["UI/UX 设计师 / AIGC 设计师，能把想法从视觉方案推进到可交付网页成品。", "擅长结合 AI 与 Vibe Coding 快速验证概念，并与前端协作完成高质量落地。"],
    ctas: {
      primary: "查看作品",
      secondary: "了解我",
      side: "UI/UX · AI · Vibe Coding",
    },
    stats: [
      { num: "2段", label: "学习经历（含海外）" },
      { num: "3+", label: "公司/项目经历" },
      { num: "10+", label: "获奖荣誉" },
      { num: "4.34/5", label: "本科 GPA" },
    ] satisfies HeroStat[],
  },

  about: {
    headerRightLines: ["不仅做视觉，我也能推进到成品落地，", "把 UI/UX、AI 与 Vibe Coding 组合成完整交付链路。"],
    profile: {
      avatarChar: "谭",
      avatarImage: "/avatar-profile.png",
      name: "谭凯洵",
      title: "UI 设计师 · AIGC 设计师",
      introParagraphs: [
        "你好！我是谭凯洵，求职方向为 UI 设计师 / AIGC 设计师。",
        "熟练使用 Figma（组件库搭建与协作）、Sketch、Photoshop、Illustrator，并掌握 AE、Animate。",
        "我会用 MidJourney 等 AIGC 工具生成 UI 素材并整理关键词与视觉参考库，提升设计效率与一致性。",
        "同时我会结合 Vibe Coding 快速搭建交互页面与展示站点原型，让设计更快变成可体验、可演示、可上线的成果。",
        "在多段项目/岗位中，我完成过核心页面设计、组件库维护、运营视觉落地与包装视觉规范输出。",
      ],
      locationText: "深圳 / 福建",
      email: "392316610@qq.com",
      wechat: "Biliiant_girl",
      resumeButtonLabel: "下载简历",
      statusText: "Open to Work",
    },
    education: [
      {
        school: "华侨大学（福建双一流）",
        degree: "数字媒体艺术 / 本科",
        period: "2022.09 — 2026.07",
        gpa: "GPA 4.34/5（专业前 8%）",
        desc: "核心课程：UI 视觉设计、动画制作、AR 虚拟现实、AI 工具应用、平面设计；获校级一等奖学金、国家奖学金（2024.09，专业前 5%）。",
        tag: "本科",
      },
      {
        school: "马来亚大学（QS 世界排名 65）",
        degree: "计算机软件 / 本科",
        period: "2024.09 — 2025.02",
        gpa: "选修：UI 设计、交互设计",
        desc: "探索跨文化视觉风格与 UI 设计的融合，形成更适配 UI 场景的设计思路。",
        tag: "交流",
      },
    ] satisfies EducationItem[],
    honors: [
      {
        title: "国家奖学金",
        year: "2024.09",
        level: "国家级",
        details: ["绩点 GPA 4.34/5（专业前 8%）", "综合评定：专业前 5%"],
        proof: [{ label: "证书编号", value: "BZK2024034307" }],
        proofImages: ["/img/scholarship.png"],
      },
      {
        title: "中国国际大学生创新大赛",
        year: "2024",
        level: "国家级 · 铜奖",
        details: ["竞赛获奖：铜奖", "可补充项目名称、角色与作品链接"],
        proof: [{ label: "项目编号", value: "202510385051S" }],
      },
      {
        title: "东方创意之星",
        year: "2024",
        level: "省级 · 金奖",
        details: ["省级赛事金奖", "可补充作品方向与评审亮点"],
        proof: [{ label: "证书编号", value: "OCSDAFUJ2024847100051" }],
        proofImages: ["/img/oriental-star.jpg"],
      },
      {
        title: "创意星球奖",
        year: "2024",
        level: "省级",
        details: ["省级奖项", "可补充赛道与作品名称"],
        proof: [{ label: "备注", value: "可在此处上传/补充奖状图片与编号" }],
        proofImages: ["/img/创意星球.png"],
      },
      {
        title: "校级一等奖",
        year: "2023、2025",
        level: "校级 · 一等奖",
        details: ["2023 年获校级一等奖", "2025 年再次获校级一等奖"],
        proof: [{ label: "备注", value: "可在此处上传/补充奖状图片与编号" }],
        proofImages: ["/img/one.png"],
      },
      {
        title: "非遗 IP 设计",
        year: "2024",
        level: "校级 · 一等奖",
        details: ["校级一等奖", "可补充 IP 形象/延展物料与落地情况"],
        proof: [{ label: "备注", value: "可在此处上传/补充奖状图片与编号" }],
      },
      {
        title: "挑战杯大赛",
        year: "2023",
        level: "校级 · 二等奖",
        details: ["校级二等奖", "可补充项目定位、负责模块与成果"],
        proof: [{ label: "备注", value: "可在此处上传/补充奖状图片与编号" }],
      },
      {
        title: "互联网+ 大赛",
        year: "2023",
        level: "校级 · 二等奖",
        details: ["校级二等奖", "可补充项目名称、团队分工与展示材料"],
        proof: [{ label: "备注", value: "可在此处上传/补充奖状图片与编号" }],
      },
    ] satisfies HonorItem[],
    experienceHint: "点击卡片可翻转查看我的故事，再点「查看详情」了解更多！",
    experience: [
      {
        company: "深圳市戴乐体感科技",
        role: "UI 设计师",
        period: "2025.11 — 2026.04",
        location: "深圳",
        desc: "主导 3.0 UI 页面与小程序迭代，设计核心页面并输出多版方案，推动兑换完成率提升 8%；优化注册登录模块视觉；承接运营视觉需求并保障落地，同时在交付阶段与前端高效协同。",
        tags: ["小程序", "UI 迭代", "运营设计"],
        color: "var(--primary)",
        colorHex: "rgb(168, 85, 247)",
        emoji: "⚡",
        highlight: "兑换完成率提升 8%",
        stats: [
          { icon: "Zap", label: "核心迭代", value: "3.0" },
          { icon: "Users", label: "影响指标", value: "+8%" },
          { icon: "Star", label: "产出形式", value: "多版方案" },
        ],
        story:
          "在戴乐体感科技，我从需求梳理到方案输出再到落地跟进，完整参与产品迭代闭环。通过多版对比与关键流程优化，把页面信息层级与视觉一致性做得更“可用、可交付”。",
        achievement: "推动兑换完成率提升 8%，并优化注册登录模块视觉",
      },
      {
        company: "深圳市立霖有限公司",
        role: "UI 设计师",
        period: "2024.10 — 2025.02",
        location: "深圳",
        desc: "参与智能写作工具 UI 迭代，用 AIGC 生成 UI 素材并补充至资源库；协助搭建 UI 组件库（新增通用组件、维护统一）；根据交互稿完成核心页面 UI 设计，保障多端体验一致。",
        tags: ["AIGC 素材", "组件库", "多端一致性"],
        color: "rgb(0, 212, 170)",
        colorHex: "rgb(0, 212, 170)",
        emoji: "🧩",
        highlight: "组件库维护与统一",
        stats: [
          { icon: "Zap", label: "AIGC 素材", value: "资源库补充" },
          { icon: "Users", label: "组件库", value: "通用组件" },
          { icon: "Star", label: "交付", value: "核心页面" },
        ],
        story:
          "这段经历让我把“快速产出”与“规范一致”结合起来：一方面用 AIGC 提升素材准备效率，另一方面用组件库保证页面体验与视觉语言统一。",
        achievement: "参与智能写作工具 UI 迭代，完善资源库与组件库",
      },
      {
        company: "厦门市跃鹏有限公司",
        role: "UI 设计师",
        period: "2024.02 — 2024.08",
        location: "厦门",
        desc: "参与 B 端电商商家后台 UI 设计，覆盖运营、客服等多角色工作台；聚焦后台数据看板的信息密度与可读性优化，提升高频任务操作效率；配合团队输出组件规范与设计标注，推动设计与前端高效协作落地。",
        tags: ["B 端后台", "数据看板", "组件规范"],
        color: "var(--accent)",
        colorHex: "rgb(232, 255, 71)",
        emoji: "🖥️",
        highlight: "B 端后台体验优化",
        stats: [
          { icon: "Zap", label: "后台设计", value: "多角色工作台" },
          { icon: "Users", label: "数据看板", value: "可读性优化" },
          { icon: "Star", label: "规范", value: "组件/标注" },
        ],
        story:
          "B 端场景让我更关注信息密度与任务效率的平衡：通过合理的信息层级、清晰的数据呈现和统一的组件规范，让后台操作更直观、效率更高。",
        achievement: "参与 B 端电商商家后台 UI 设计，优化数据看板与操作效率",
      },
    ] satisfies ExperienceItem[],
  },

  works: {
    categories: ["全部", "UI 项目", "海报设计", "动画", "绘本设计"],
    headerDesc: "精选作品以 3 个 UI 项目为主，其余为海报设计、绘本设计与动画作品。",
    emptyText: "暂无该分类作品",
    loadMoreText: "查看全部项目",
    carouselHint: ["点击大图翻转查看详情", "点击小图切换", "← → 切换作品"],
    items: [
      {
        title: "AIGC 创作助手",
        subtitle: "AIGC 项目案例｜从创意生成到页面呈现的体验与视觉设计",
        category: "UI 项目",
        year: "2025",
        tags: ["AIGC", "体验设计", "视觉系统", "作品集"],
        gradient: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%)",
        emoji: "💎",
        featured: true,
        award: "",
        desc: "围绕 AIGC 创作流程，打通灵感生成、内容组织与视觉表达，沉淀为可演示的完整案例页面。",
        slug: "aigc",
        coverImage: "/works/aigc/pages/001.png",
        caseHref: "/works/aigc",
      },
      {
        title: "智能写作 · 笔捷AI",
        subtitle: "AI 项目案例｜智能写作工具的体验与界面设计",
        category: "UI 项目",
        year: "2025",
        tags: ["AI 写作", "UI 设计", "交互", "案例展示"],
        gradient: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 52%, #a855f7 100%)",
        emoji: "✍️",
        featured: true,
        desc: "点击即可打开 PDF 作品详情：AI 项目「智能写作 · 笔捷AI」的设计过程与成果展示。",
        slug: "bijie-ai",
        coverImage: "/works/bijie-ai-cover.png",
        caseHref: "/works/bijie-ai.pdf",
      },
      {
        title: "B端电商平台 · 商家后台",
        subtitle: "B 端后台系统｜多角色运营工作台与关键业务数据可视化",
        category: "UI 项目",
        year: "2025",
        tags: ["B 端", "后台", "数据看板", "组件规范"],
        gradient: "linear-gradient(135deg, #0b1220 0%, #111827 55%, #1f2937 100%)",
        emoji: "🖥️",
        featured: true,
        desc: "多角色（运营/客服/商品等）使用的商家后台：聚焦高频任务路径、信息密度与可读性，强化数据看板与操作效率。",
        slug: "b-end",
        coverImage: "/works/b-end/pages/001.png",
        caseHref: "/works/b-end",
      },
      {
        title: "ByteKit 设计系统",
        subtitle: "B 端设计系统｜组件规范、可复用模式与落地协作",
        category: "UI 项目",
        year: "2024",
        tags: ["设计系统", "Figma", "组件库"],
        gradient: "linear-gradient(135deg, #e8ff47 0%, #f59e0b 100%)",
        emoji: "⚡",
        featured: true,
        award: "",
        desc: "围绕一致性与效率沉淀组件规范与版式规则，降低设计与开发沟通成本，让页面快速“按规范出图、按规范落地”。",
      },
      {
        title: "海报设计 · 视觉合集",
        subtitle: "活动海报 / 公众号配图 / 运营视觉｜统一风格与快速交付",
        category: "海报设计",
        year: "2024",
        tags: ["海报", "运营视觉", "排版", "规范"],
        gradient: "linear-gradient(135deg, #ff6b9d 0%, #f43f5e 55%, #e11d48 100%)",
        emoji: "🪧",
        featured: false,
        award: "",
        desc: "覆盖活动海报、社媒配图与运营物料，强调信息层级清晰、视觉一致、可快速复用的模板化输出。",
        slug: "poster-collection",
      },
      {
        title: "绘本设计 · 袜子侦探社",
        subtitle: "原创绘本｜看图解密 · 手势/滑动/键盘互动阅读",
        category: "绘本设计",
        year: "2024",
        tags: ["绘本", "互动", "解密", "版式"],
        gradient: "linear-gradient(135deg, #00d4aa 0%, #059669 100%)",
        emoji: "📖",
        featured: false,
        award: "",
        desc: "谭凯洵《袜子侦探社》电子绘本：进入互动模式可全屏读 PDF，支持摄像头点赞/倒赞翻页、触滑与方向键；右侧「侦探笔记」随页更新，并可在 clues.json 扩展谜面。",
        slug: "socks-detective",
        caseHref: "/works/socks-detective",
        coverImage: "/works/socks-detective/cover.jpg",
      },
      {
        title: "动画作品《闽南非遗》",
        subtitle: "闽南非遗动画短片｜围绕古厝屋脊、建筑纹样与地域符号展开镜头叙事",
        category: "动画",
        year: "2023",
        tags: ["动画", "动态视觉", "非遗", "节奏"],
        gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
        emoji: "🎬",
        featured: false,
        award: "",
        desc: "以闽南非遗文化为核心，围绕古厝屋脊、建筑细节与传统纹样进行动画化表达，通过景别切换、镜头衔接与节奏控制传达地域文化气质。",
        slug: "minnan-intangible",
        caseHref: "/works/minnan-intangible/minnan-intangible.mp4",
        coverImage: "/works/minnan-intangible/cover.jpg",
      },
      {
        title: "手绘影片《祂的路》",
        subtitle: "新中国成立75周年主题影片｜叙事节奏与镜头语言",
        category: "动画",
        year: "2023",
        tags: ["角色动画", "镜头", "叙事", "节奏"],
        gradient: "linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)",
        emoji: "🎞️",
        featured: false,
        award: "",
        desc: "以新中国成立75周年为主题，围绕“祂的路”展开叙事，强调情绪铺垫、镜头衔接与节奏控制。",
        slug: "motion-rules",
        caseHref: "/works/motion-rules/motion-rules.mp4",
        coverImage: "/works/motion-rules/cover.jpg",
      },
    ] satisfies WorkItem[],
  },

  skills: {
    headerRightLines: ["工具是手段，交付是目标。", "从 UI/UX 到 AI 与 Vibe Coding，我关注的是可落地的完整体验。"],
    groups: [
      {
        category: "产品级 UI 设计能力",
        color: "var(--primary)",
        skills: [
          { name: "Figma", level: 98 },
          { name: "Sketch", level: 92 },
          { name: "Photoshop", level: 88 },
          { name: "Illustrator", level: 86 },
        ],
      },
      {
        category: "AIGC + 工程化落地",
        color: "rgb(0, 212, 170)",
        skills: [
          { name: "MidJourney", level: 92 },
          { name: "UI 视觉库搭建", level: 90 },
          { name: "Vibe Coding", level: 89 },
          { name: "AI 还原/生产网站", level: 90 },
        ],
      },
    ] satisfies SkillGroup[],
    softSkills: ["全链路思维", "组件库规范", "跨端一致性", "设计协同开发", "AIGC 生产提效", "UI 插画 / IP / 动效", "运营物料", "AR/VR 与剪辑"],
    philosophy: {
      title: "设计理念",
      quoteParts: [
        '好的设计应该是<span className="text-primary font-medium">隐形的</span>——',
        "它自然融入用户的生活，让人不知不觉地爱上使用它。",
      ],
    },
  },

  life: {
    headerDesc: "设计之外，这里是我的日常与爱好。",
    locked: {
      title: "🔒 内容已加密 · 需要解锁",
      button: "答题解锁生活相册",
      hint: (total: number) => `答对 2/3 即可解锁 · 共 ${total} 张照片`,
    },
    unlocked: {
      banner: (total: number) => ({ left: "🎉", text: "已解锁！欢迎探索我的生活日常", right: `共 ${total} 张` }),
    },
    categories: [
      { icon: "Heart", label: "cool的一天", color: "rgb(168,85,247)" },
      { icon: "Plane", label: "出发旅游", color: "rgb(0, 212, 170)" },
      { icon: "Camera", label: "潜水", color: "rgb(79,172,254)" },
      { icon: "BookOpen", label: "留学之旅", color: "rgb(255,107,157)" },
      { icon: "Music", label: "赛车", color: "rgb(245,158,11)" },
    ] satisfies LifeCategory[],
    photos: [
      { id: 1, category: "cool的一天", title: "cool的一天 · 01", desc: "来自文件 13e7569b362b1a9f34182bf2c0ae1111.jpg", emoji: "", gradient: "linear-gradient(135deg, rgb(168,85,247) 0%, rgb(124,58,237) 50%, rgb(79,70,229) 100%)", tag: "cool的一天", image: "/life/cool的一天/13e7569b362b1a9f34182bf2c0ae1111.jpg" },
      { id: 2, category: "cool的一天", title: "cool的一天 · 02", desc: "来自文件 78dcc3c28bf5f48828f2d4f7b071d7fa.jpg", emoji: "", gradient: "linear-gradient(135deg, rgb(168,85,247) 0%, rgb(124,58,237) 50%, rgb(79,70,229) 100%)", tag: "cool的一天", image: "/life/cool的一天/78dcc3c28bf5f48828f2d4f7b071d7fa.jpg" },

      { id: 3, category: "出发旅游", title: "出发旅游 · 01", desc: "来自文件 25c1a8de25e6f25ce18817e2b73bfa5c.jpg", emoji: "", gradient: "linear-gradient(135deg, rgb(0,212,170) 0%, rgb(5,150,105) 50%, rgb(6,78,59) 100%)", tag: "出发旅游", image: "/life/出发旅游/25c1a8de25e6f25ce18817e2b73bfa5c.jpg" },
      { id: 4, category: "出发旅游", title: "出发旅游 · 02", desc: "来自文件 3ca995435ed48cbea2e6d87cfffc7053.jpg", emoji: "", gradient: "linear-gradient(135deg, rgb(0,212,170) 0%, rgb(5,150,105) 50%, rgb(6,78,59) 100%)", tag: "出发旅游", image: "/life/出发旅游/3ca995435ed48cbea2e6d87cfffc7053.jpg" },

      { id: 5, category: "潜水", title: "潜水 · 01", desc: "来自文件 1b2945ae840df5c208e35b0d2ed73815.jpg", emoji: "", gradient: "linear-gradient(135deg, rgb(79,172,254) 0%, rgb(37,99,235) 50%, rgb(30,64,175) 100%)", tag: "潜水", image: "/life/潜水/1b2945ae840df5c208e35b0d2ed73815.jpg" },
      { id: 6, category: "潜水", title: "潜水 · 02", desc: "来自文件 499c093acd3325c7340191400f4ca111.jpg", emoji: "", gradient: "linear-gradient(135deg, rgb(79,172,254) 0%, rgb(37,99,235) 50%, rgb(30,64,175) 100%)", tag: "潜水", image: "/life/潜水/499c093acd3325c7340191400f4ca111.jpg" },
      { id: 7, category: "潜水", title: "潜水 · 03", desc: "来自文件 997881ed3fdc2b23570bbd1c70bae7f2.jpg", emoji: "", gradient: "linear-gradient(135deg, rgb(79,172,254) 0%, rgb(37,99,235) 50%, rgb(30,64,175) 100%)", tag: "潜水", image: "/life/潜水/997881ed3fdc2b23570bbd1c70bae7f2.jpg" },
      { id: 8, category: "潜水", title: "潜水 · 04", desc: "来自文件 f59c705fbc6eeebb8f3ef59bf6e054f9.jpg", emoji: "", gradient: "linear-gradient(135deg, rgb(79,172,254) 0%, rgb(37,99,235) 50%, rgb(30,64,175) 100%)", tag: "潜水", image: "/life/潜水/f59c705fbc6eeebb8f3ef59bf6e054f9.jpg" },

      { id: 9, category: "留学之旅", title: "留学之旅 · 01", desc: "来自文件 1.jpg", emoji: "", gradient: "linear-gradient(135deg, rgb(255,107,157) 0%, rgb(236,72,153) 50%, rgb(190,24,93) 100%)", tag: "留学之旅", image: "/life/留学之旅/1.jpg" },
      { id: 10, category: "留学之旅", title: "留学之旅 · 02", desc: "来自文件 2.jpg", emoji: "", gradient: "linear-gradient(135deg, rgb(255,107,157) 0%, rgb(236,72,153) 50%, rgb(190,24,93) 100%)", tag: "留学之旅", image: "/life/留学之旅/2.jpg" },
      { id: 11, category: "留学之旅", title: "留学之旅 · 03", desc: "来自文件 3.jpg", emoji: "", gradient: "linear-gradient(135deg, rgb(255,107,157) 0%, rgb(236,72,153) 50%, rgb(190,24,93) 100%)", tag: "留学之旅", image: "/life/留学之旅/3.jpg" },
      { id: 12, category: "留学之旅", title: "留学之旅 · 04", desc: "来自文件 4.jpg", emoji: "", gradient: "linear-gradient(135deg, rgb(255,107,157) 0%, rgb(236,72,153) 50%, rgb(190,24,93) 100%)", tag: "留学之旅", image: "/life/留学之旅/4.jpg" },
      { id: 13, category: "留学之旅", title: "留学之旅 · 05", desc: "来自文件 5.jpg", emoji: "", gradient: "linear-gradient(135deg, rgb(255,107,157) 0%, rgb(236,72,153) 50%, rgb(190,24,93) 100%)", tag: "留学之旅", image: "/life/留学之旅/5.jpg" },
      { id: 14, category: "留学之旅", title: "留学之旅 · 06", desc: "来自文件 6.jpg", emoji: "", gradient: "linear-gradient(135deg, rgb(255,107,157) 0%, rgb(236,72,153) 50%, rgb(190,24,93) 100%)", tag: "留学之旅", image: "/life/留学之旅/6.jpg" },

      { id: 15, category: "赛车", title: "赛车 · 01", desc: "来自文件 22d9cb9613848f705c46c1e582f59406.jpg", emoji: "", gradient: "linear-gradient(135deg, rgb(245,158,11) 0%, rgb(217,119,6) 50%, rgb(146,64,14) 100%)", tag: "赛车", image: "/life/赛车/22d9cb9613848f705c46c1e582f59406.jpg" },
      { id: 16, category: "赛车", title: "赛车 · 02", desc: "来自文件 aac45e7d227ad0e11e6086e9851a0cfb.jpg", emoji: "", gradient: "linear-gradient(135deg, rgb(245,158,11) 0%, rgb(217,119,6) 50%, rgb(146,64,14) 100%)", tag: "赛车", image: "/life/赛车/aac45e7d227ad0e11e6086e9851a0cfb.jpg" },
    ] satisfies LifePhoto[],
    stats: [{ emoji: "☕", num: "2杯/天", label: "咖啡" }] satisfies LifeStat[],
  },

  contact: {
    headerDesc: "有趣的项目、合作机会，或想聊聊 UI/UX + AI + Vibe Coding 的落地方式？我很期待与你交流！",
    hint: "右下角有悬浮问答窗口，快去试试！",
    quote: "设计是一种沟通方式，而最好的沟通始于真诚的倾听。",
    qaHintTitle: "快速问答",
    qaHintDesc: "点击右下角的 💬 按钮，用预设问题或自由提问来了解更多关于我的信息！",
    qaTags: ["合作机会", "设计工具", "远程工作"],
    socialLinks: [
      { icon: "Mail", label: "Email", value: "392316610@qq.com", href: "mailto:392316610@qq.com" },
      { icon: "WeChat", label: "微信", value: "Biliiant_girl", href: "#" },
      { icon: "Github", label: "GitHub", value: "（可补充）", href: "#" },
      { icon: "Linkedin", label: "电话", value: "（+86）15305029987", href: "#" },
    ] satisfies SocialLink[],
    presetQuestions: [
      { emoji: "🎨", text: "你最擅长的设计领域是什么？" },
      { emoji: "🧠", text: "你如何使用 AIGC 提升设计效率？" },
      { emoji: "🧩", text: "你做过组件库/设计系统相关工作吗？" },
      { emoji: "🚀", text: "你能把设计直接做成可演示网页吗？" },
    ] satisfies PresetQuestion[],
    answers: {
      "你最擅长的设计领域是什么？": "我主要做 UI 设计与视觉落地，覆盖 App/小程序核心页面、运营物料与规范化输出。",
      "你如何使用 AIGC 提升设计效率？": "我会用 MidJourney 生成 UI 素材（图标/背景等），并整理 UI 专用关键词库与视觉参考库，提升素材准备与探索效率。",
      "你做过组件库/设计系统相关工作吗？": "有参与组件库搭建与维护：新增通用组件、维护设计文件统一，并在页面设计中遵循规范提升一致性。",
      "你能把设计直接做成可演示网页吗？": "可以。我会用 Vibe Coding 快速把设计方案做成可交互网页原型，并与前端协作推进到可上线版本。",
    } as Record<string, string>,
    floating: {
      bubble: "👋 有问题想问我？",
      title: "问问我",
      subtitle: "点击预设问题或自由提问",
      quickAskLabel: "快速提问：",
      inputPlaceholder: "自由提问...",
      clearTitle: "清空对话",
      fallbackAnswer: "感谢你的问题！欢迎发邮件给我聊聊。",
      customAnswer: (q: string) => `谢谢你的问题："${q}"！欢迎发邮件到 392316610@qq.com 详细交流。`,
    },
    form: {
      title: "发送消息",
      fields: {
        name: { label: "姓名", placeholder: "你的名字" },
        email: { label: "邮箱", placeholder: "your@email.com" },
        message: { label: "消息", placeholder: "你好！我想和你聊聊..." },
      },
      submit: { idle: "发送消息", sent: "消息已发送！" },
    },
  },

  footer: {
    leftName: "Kaixun Tan · UI Portfolio",
    copyright: "© 2026 谭凯洵 · 用设计构建体验",
    rightDotText: "Available for freelance",
  },
} as const;

export const siteContentEn = {
  nav: {
    brand: {
      markText: "TK",
      name: "Kaixun Tan",
    },
    items: [
      { label: "About", href: "#about" },
      { label: "Education", href: "#education" },
      { label: "Experience", href: "#experience" },
      { label: "Work", href: "#works" },
      { label: "Skills", href: "#skills" },
      { label: "Life", href: "#life", badgeDot: true },
      { label: "Contact", href: "#contact" },
    ] satisfies NavItem[],
    cta: { label: "Contact me", href: "#contact" },
  },

  hero: {
    badge: "Available for Work · 2026",
    firstName: "KAI",
    middleNameGradient: "XUN",
    lastName: "TAN",
    avatarImage: "/avatar-profile.png",
    rotatingWords: ["UI/UX Designer", "AIGC Designer", "Vibe Coding Maker", "Product Thinker"],
    descriptionLines: [
      "UI/UX and AIGC designer who can move ideas from concept to shippable web experiences.",
      "I combine AI and vibe coding to validate concepts fast and collaborate tightly for production delivery.",
    ],
    ctas: {
      primary: "View work",
      secondary: "About me",
      side: "UI/UX · AI · Vibe Coding",
    },
    stats: [
      { num: "2 Tracks", label: "Education (incl. overseas)" },
      { num: "3+", label: "Teams/projects" },
      { num: "10+", label: "Awards" },
      { num: "4.34/5", label: "GPA" },
    ] satisfies HeroStat[],
  },

  about: {
    headerRightLines: ["More than visuals: I can drive ideas to working outputs,", "combining UI/UX, AI, and vibe coding into one delivery flow."],
    profile: {
      avatarChar: "谭",
      avatarImage: "/avatar-profile.png",
      name: "Kaixun Tan",
      title: "UI Designer · AIGC Designer",
      introParagraphs: [
        "Hi! I'm Kaixun Tan. I'm looking for UI Designer / AIGC Designer roles.",
        "Skilled with Figma (design systems & collaboration), Sketch, Photoshop, Illustrator, plus AE and Animate.",
        "I use AIGC tools like MidJourney to generate UI assets and maintain prompt/reference libraries for efficiency and consistency.",
        "I also use vibe coding to quickly build interactive showcase pages and prototypes, so design can be experienced and validated earlier.",
        "Across multiple roles, I delivered key screens, maintained component libraries, shipped marketing visuals, and produced visual guidelines.",
      ],
      locationText: "Shenzhen / Fujian",
      email: "392316610@qq.com",
      wechat: "Biliiant_girl",
      resumeButtonLabel: "Download resume",
      statusText: "Open to Work",
    },
    education: [
      {
        school: "Huaqiao University",
        degree: "Digital Media Art / B.A.",
        period: "2022.09 — 2026.07",
        gpa: "GPA 4.34/5 (Top 8%)",
        desc: "Courses: UI/visual design, animation, AR/VR, AI tools, graphic design; scholarships and awards.",
        tag: "Bachelor",
      },
      {
        school: "University of Malaya",
        degree: "Software / Exchange",
        period: "2024.09 — 2025.02",
        gpa: "Electives: UI design, Interaction design",
        desc: "Explored cross-cultural styles and UI thinking.",
        tag: "Exchange",
      },
    ] satisfies EducationItem[],
    honors: [
      {
        title: "National Scholarship",
        year: "2024.09",
        level: "National",
        details: ["GPA 4.34/5 (Top 8%)", "Overall ranking: Top 5%"],
        proof: [{ label: "Cert ID", value: "BZK2024034307" }],
        proofImages: ["/img/scholarship.png"],
      },
      {
        title: "China International College Students Innovation Competition",
        year: "2024",
        level: "National · Bronze",
        details: ["Bronze award", "Add project name, role, and links"],
        proof: [{ label: "Project ID", value: "202510385051S" }],
      },
      {
        title: "Oriental Creative Star",
        year: "2024",
        level: "Provincial · Gold",
        details: ["Provincial gold award", "Add track and highlights"],
        proof: [{ label: "Cert ID", value: "OCSDAFUJ2024847100051" }],
        proofImages: ["/img/oriental-star.jpg"],
      },
      {
        title: "Creative Planet Award",
        year: "2024",
        level: "Provincial",
        details: ["Provincial award", "Add track and work title"],
        proof: [{ label: "Note", value: "You can attach certificate images and IDs here." }],
        proofImages: ["/img/创意星球.png"],
      },
      {
        title: "University First Prize",
        year: "2023, 2025",
        level: "University · 1st Prize",
        details: ["Won university-level first prize in 2023", "Won university-level first prize again in 2025"],
        proof: [{ label: "Note", value: "You can attach certificate images and IDs here." }],
        proofImages: ["/img/one.png"],
      },
      {
        title: "Intangible Cultural Heritage IP Design",
        year: "2024",
        level: "University · 1st Prize",
        details: ["1st prize", "Add deliverables and outcomes"],
        proof: [{ label: "Note", value: "You can attach certificate images and IDs here." }],
      },
      {
        title: "Challenge Cup",
        year: "2023",
        level: "University · 2nd Prize",
        details: ["2nd prize", "Add your responsibilities and results"],
        proof: [{ label: "Note", value: "You can attach certificate images and IDs here." }],
      },
      {
        title: "Internet+ Competition",
        year: "2023",
        level: "University · 2nd Prize",
        details: ["2nd prize", "Add team split and materials"],
        proof: [{ label: "Note", value: "You can attach certificate images and IDs here." }],
      },
    ] satisfies HonorItem[],
    experienceHint: "Click to flip for my story, or open details!",
    experience: [
      {
        company: "Shenzhen Daile Motion Tech",
        role: "UI Designer",
        period: "2025.11 — Present",
        location: "Shenzhen",
        desc: "Led UI 3.0 iteration for pages & mini program; improved conversion by 8%; optimized login visuals; delivered marketing visuals while collaborating closely with frontend for smooth implementation.",
        tags: ["Mini program", "UI iteration", "Marketing design"],
        color: "var(--primary)",
        colorHex: "rgb(168, 85, 247)",
        emoji: "⚡",
        highlight: "+8% conversion",
        stats: [
          { icon: "Zap", label: "Iteration", value: "3.0" },
          { icon: "Users", label: "Impact", value: "+8%" },
          { icon: "Star", label: "Output", value: "Multi-variant" },
        ],
        story: "End-to-end product iteration, from requirements to design delivery and follow-up, focusing on usable and shippable design.",
        achievement: "Improved conversion by 8% and refined login visuals",
      },
      {
        company: "Shenzhen Lilin Co., Ltd.",
        role: "UI Designer",
        period: "2024.10 — 2025.02",
        location: "Shenzhen",
        desc: "Iterated AI writing tool UI; generated assets via AIGC and expanded libraries; helped build a component library; delivered core screens across platforms.",
        tags: ["AIGC assets", "Component library", "Cross-platform"],
        color: "rgb(0, 212, 170)",
        colorHex: "rgb(0, 212, 170)",
        emoji: "🧩",
        highlight: "Design system consistency",
        stats: [
          { icon: "Zap", label: "AIGC", value: "Asset library" },
          { icon: "Users", label: "Components", value: "Reusable" },
          { icon: "Star", label: "Delivery", value: "Core screens" },
        ],
        story: "Balanced speed and consistency: AIGC for assets, components for UI language.",
        achievement: "Improved asset & component libraries for an AI writing tool",
      },
      {
        company: "Xiamen Yuepeng Co., Ltd.",
        role: "UI Designer",
        period: "2024.02 — 2024.08",
        location: "Xiamen",
        desc: "Contributed to B-end e-commerce merchant console UI design for operator/customer service roles; optimized dashboard info density and readability to boost high-frequency task efficiency; delivered component specs and design annotations for smooth dev handoff.",
        tags: ["B-end Admin", "Dashboard", "Component Spec"],
        color: "var(--accent)",
        colorHex: "rgb(232, 255, 71)",
        emoji: "🖥️",
        highlight: "B-end UX optimization",
        stats: [
          { icon: "Zap", label: "Admin UI", value: "Multi-role" },
          { icon: "Users", label: "Dashboard", value: "Readability" },
          { icon: "Star", label: "Spec", value: "Components" },
        ],
        story: "B-end design taught me to balance info density with task efficiency: clear hierarchy, data presentation, and consistent component specs make backstage operations intuitive.",
        achievement: "Designed B-end merchant console UI and optimized dashboard efficiency",
      },
    ] satisfies ExperienceItem[],
  },

  works: {
    categories: ["All", "UI Projects", "Poster Design", "Animation", "Picture Book"],
    headerDesc: "Selected work focuses on 3 UI projects, plus posters, a picture book, and an animation piece.",
    emptyText: "No works in this category.",
    loadMoreText: "View all projects",
    carouselHint: ["Click main card to flip", "Click side cards to switch", "← → switch"],
    items: [
      {
        title: "AIGC Creation Assistant",
        subtitle: "AIGC case study · experience and visual design from ideation to output",
        category: "UI Projects",
        year: "2025",
        tags: ["AIGC", "UX design", "Visual system", "Portfolio"],
        gradient: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%)",
        emoji: "💎",
        featured: true,
        award: "",
        desc: "An AIGC case project that connects ideation, content structuring, and visual output into a complete showcase flow.",
        slug: "aigc",
        coverImage: "/works/aigc/pages/001.png",
        caseHref: "/works/aigc",
      },
      {
        title: "AI Writing · Bijie AI",
        subtitle: "AI case study · UX & UI design for an AI writing product",
        category: "UI Projects",
        year: "2025",
        tags: ["AI writing", "UI design", "Interaction", "Case study"],
        gradient: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 52%, #a855f7 100%)",
        emoji: "✍️",
        featured: true,
        desc: "A full case study showcasing the design process and outcomes for an AI writing product.",
        slug: "bijie-ai",
        coverImage: "/works/bijie-ai-cover.png",
        caseHref: "/works/bijie-ai.pdf",
      },
      {
        title: "B-end Admin · Merchant Console",
        subtitle: "B2B admin system · multi-role workflows and key data dashboards",
        category: "UI Projects",
        year: "2025",
        tags: ["B2B", "Admin", "Dashboard", "Permissions"],
        gradient: "linear-gradient(135deg, #0b1220 0%, #111827 55%, #1f2937 100%)",
        emoji: "🖥️",
        featured: true,
        desc: "A multi-role merchant admin console focused on high-frequency tasks, readable data hierarchy, and efficient operations.",
        slug: "b-end",
        coverImage: "/works/b-end/pages/001.png",
        caseHref: "/works/b-end",
      },
      {
        title: "ByteKit Design System",
        subtitle: "B2B design system · components, rules, and delivery collaboration",
        category: "UI Projects",
        year: "2024",
        tags: ["Design system", "Figma", "Component library"],
        gradient: "linear-gradient(135deg, #e8ff47 0%, #f59e0b 100%)",
        emoji: "⚡",
        featured: true,
        award: "",
        desc: "Built reusable patterns and rules to reduce design-dev friction and speed up consistent delivery.",
      },
      {
        title: "Poster Design · Visual Collection",
        subtitle: "Campaign posters & social visuals · consistent style, fast delivery",
        category: "Poster Design",
        year: "2024",
        tags: ["Poster", "Marketing", "Typography", "Guidelines"],
        gradient: "linear-gradient(135deg, #ff6b9d 0%, #f43f5e 55%, #e11d48 100%)",
        emoji: "🪧",
        featured: false,
        award: "",
        desc: "A collection of campaign posters and social visuals, designed with clear hierarchy and reusable templates.",
        slug: "poster-collection",
      },
      {
        title: "Picture Book · The Sock Detective Agency",
        subtitle: "Original book · visual puzzles · gesture / swipe / keyboard reading",
        category: "Picture Book",
        year: "2024",
        tags: ["Picture book", "Interaction", "Puzzle", "Layout"],
        gradient: "linear-gradient(135deg, #00d4aa 0%, #059669 100%)",
        emoji: "📖",
        featured: false,
        award: "",
        desc: "An interactive PDF read for Tan Kaixun’s 《袜子侦探社》: camera thumbs-up/down to flip pages, swipe and arrow keys, plus per-page detective notes and riddles you can extend in public/works/socks-detective/clues.json.",
        slug: "socks-detective",
        caseHref: "/works/socks-detective",
        coverImage: "/works/socks-detective/cover.jpg",
      },
      {
        title: "Animation: Minnan Intangible Heritage",
        subtitle: "Animated short on Minnan heritage, featuring roofline motifs and architectural visual storytelling",
        category: "Animation",
        year: "2023",
        tags: ["Motion", "Visual narrative", "Heritage", "Timing"],
        gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
        emoji: "🎬",
        featured: false,
        award: "",
        desc: "An animated piece centered on Minnan intangible heritage, using traditional roofline motifs and architectural details to build visual narrative through rhythm and cinematic transitions.",
        slug: "minnan-intangible",
        caseHref: "/works/minnan-intangible/minnan-intangible.mp4",
        coverImage: "/works/minnan-intangible/cover.jpg",
      },
      {
        title: "The Road of Her · 75th Anniversary Film",
        subtitle: "Animated short for the 75th anniversary theme, focused on narrative rhythm and camera language",
        category: "Animation",
        year: "2023",
        tags: ["Character animation", "Cinematography", "Narrative", "Timing"],
        gradient: "linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)",
        emoji: "🎞️",
        featured: false,
        award: "",
        desc: "An anniversary-themed animated short centered on emotional pacing, scene transitions, and storytelling clarity.",
        slug: "motion-rules",
        caseHref: "/works/motion-rules/motion-rules.mp4",
        coverImage: "/works/motion-rules/cover.jpg",
      },
    ] satisfies WorkItem[],
  },

  skills: {
    headerRightLines: ["Tools are means; delivery is the goal.", "From UI/UX to AI and vibe coding, I focus on end-to-end experience outcomes."],
    groups: [
      {
        category: "Product-grade UI Design",
        color: "var(--primary)",
        skills: [
          { name: "Figma", level: 98 },
          { name: "Sketch", level: 92 },
          { name: "Photoshop", level: 88 },
          { name: "Illustrator", level: 86 },
        ],
      },
      {
        category: "AIGC + Production Delivery",
        color: "rgb(0, 212, 170)",
        skills: [
          { name: "MidJourney", level: 92 },
          { name: "UI Visual Library", level: 90 },
          { name: "Vibe Coding", level: 89 },
          { name: "AI Web Rebuild/Production", level: 90 },
        ],
      },
    ] satisfies SkillGroup[],
    softSkills: ["End-to-end mindset", "Component guidelines", "Cross-platform consistency", "Design-to-Dev", "AIGC production boost", "UI illustration / IP / motion", "Campaign creatives", "AR/VR & editing"],
    philosophy: {
      title: "Design philosophy",
      quoteParts: ['Good design should be <span className="text-primary font-medium">invisible</span>—', "it blends into life and feels natural."],
    },
  },

  life: {
    headerDesc: "Beyond design—my daily life and hobbies.",
    locked: {
      title: "🔒 Encrypted content · Unlock required",
      button: "Quiz to unlock photos",
      hint: (total: number) => `Answer 2/3 to unlock · ${total} photos`,
    },
    unlocked: {
      banner: (total: number) => ({ left: "🎉", text: "Unlocked! Welcome to my daily moments", right: `${total} photos` }),
    },
    categories: siteContentZh.life.categories satisfies LifeCategory[],
    photos: siteContentZh.life.photos satisfies LifePhoto[],
    stats: [{ emoji: "☕", num: "2 cups/day", label: "Coffee" }] satisfies LifeStat[],
  },

  contact: {
    headerDesc: "Interesting projects, collaborations, or chats about UI/UX + AI + vibe coding delivery—I'd love to connect.",
    hint: "Try the floating Q&A at the bottom-right!",
    quote: "Design is communication, and the best conversations start with listening.",
    qaHintTitle: "Quick Q&A",
    qaHintDesc: "Click the 💬 button to ask preset questions or type your own.",
    qaTags: ["Collaboration", "Design tools", "Remote work"],
    socialLinks: [
      { icon: "Mail", label: "Email", value: "392316610@qq.com", href: "mailto:392316610@qq.com" },
      { icon: "WeChat", label: "WeChat", value: "Biliiant_girl", href: "#" },
      { icon: "Github", label: "GitHub", value: "(add later)", href: "#" },
      { icon: "Linkedin", label: "Phone", value: "(+86) 15305029987", href: "#" },
    ] satisfies SocialLink[],
    presetQuestions: [
      { emoji: "🎨", text: "What are you best at?" },
      { emoji: "🧠", text: "How do you use AIGC in your workflow?" },
      { emoji: "🧩", text: "Have you built design systems/components?" },
      { emoji: "🚀", text: "Can you turn design into a working web demo?" },
    ] satisfies PresetQuestion[],
    answers: {
      "What are you best at?": "I focus on UI design and production delivery—core screens, marketing visuals, and guidelines.",
      "How do you use AIGC in your workflow?": "I use tools like MidJourney to generate UI assets and maintain prompt/reference libraries for speed and consistency.",
      "Have you built design systems/components?": "Yes—I've contributed to component libraries: adding reusable components and keeping design files consistent.",
      "Can you turn design into a working web demo?": "Yes. I use vibe coding to quickly build interactive web demos from design concepts, then collaborate with frontend to move toward production quality.",
    } as Record<string, string>,
    floating: {
      bubble: "👋 Ask me anything?",
      title: "Ask me",
      subtitle: "Choose a preset or type your own",
      quickAskLabel: "Quick asks:",
      inputPlaceholder: "Type a question...",
      clearTitle: "Clear chat",
      fallbackAnswer: "Thanks! Feel free to email me for details.",
      customAnswer: (q: string) => `Thanks for asking: "${q}". Email me at 392316610@qq.com and I'll reply!`,
    },
    form: {
      title: "Send a message",
      fields: {
        name: { label: "Name", placeholder: "Your name" },
        email: { label: "Email", placeholder: "you@email.com" },
        message: { label: "Message", placeholder: "Hi! I'd like to chat..." },
      },
      submit: { idle: "Send message", sent: "Sent!" },
    },
  },

  footer: {
    leftName: "Kaixun Tan · UI Portfolio",
    copyright: "© 2026 Kaixun Tan · Crafted with design",
    rightDotText: "Available for freelance",
  },
} as const;

export type SiteContent = typeof siteContentZh | typeof siteContentEn;



import { useState, useEffect, useRef } from "react";
import { Mail, Github, Linkedin, Send, MessageSquare, X, ChevronDown, Sparkles, RotateCcw } from "lucide-react";
import { useI18n, useSiteContent } from "../i18n";

const FloatingQA = () => {
  const { lang } = useI18n();
  const siteContent = useSiteContent();
  const SOCIAL_LINKS = siteContent.contact.socialLinks;
  const PRESET_QUESTIONS = siteContent.contact.presetQuestions;
  const QA_ANSWERS: Record<string, string> = siteContent.contact.answers;

  const buildResumeAnswer = (rawQ: string) => {
    const q = rawQ.trim().toLowerCase();
    const profile = siteContent.about.profile;
    const skills = siteContent.skills;
    const exp = siteContent.about.experience;
    const works = siteContent.works.items;

    const topSkills = skills.groups
      .flatMap((g) => g.skills.map((s) => ({ ...s, group: g.category })))
      .sort((a, b) => b.level - a.level)
      .slice(0, 6);

    const skillsLine = topSkills.length ? topSkills.map((s) => `${s.name} (${s.level}%)`).join(" / ") : "Figma / Sketch / Adobe XD / Principle";
    const expLine = exp.map((e) => `${e.company} · ${e.role} (${e.period})`).join(lang === "en" ? "; " : "；");
    const worksLine = works
      .filter((w) => w.featured)
      .slice(0, 2)
      .map((w) => `${w.title} (${w.category})`)
      .join(lang === "en" ? ", " : "、");

    if (/(擅长|技能|工具|会什么|会用|software|tool|best at|skill)/i.test(q)) {
      return lang === "en"
        ? [
            `I'm focused on ${profile.title}, shipping usable and deliverable experiences.`,
            `Tools: ${skillsLine}.`,
            "I also use AIGC tools like MidJourney to generate assets and maintain prompt/reference libraries for consistency.",
          ].join("\n")
        : [
            `我目前的方向是 ${profile.title}，更擅长把体验做到“可落地、可交付”。`,
            `常用工具：${skillsLine}。`,
            "我也会用 MidJourney 等 AIGC 工具做素材生成，并整理关键词/视觉参考库来提升效率与一致性。",
          ].join("\n");
    }

    if (/(aigc|midjourney|mj|ai|生成|关键词)/i.test(q)) {
      return lang === "en"
        ? [
            "I use AIGC tools (e.g. MidJourney) to generate UI assets and then refine them for production.",
            "I also maintain reusable prompts/styles and reference libraries to speed up exploration while keeping consistency.",
          ].join("\n")
        : [
            "我会用 MidJourney 等 AIGC 工具生成 UI 素材（图标/背景/氛围图等），再做二次设计与规范化整理。",
            "同时把可复用的关键词、风格与参考沉淀成素材库，提升探索效率并保持视觉一致性。",
          ].join("\n");
    }

    if (/(经历|实习|公司|做过什么|项目|experience)/i.test(q)) {
      return lang === "en"
        ? [`Experience overview: ${expLine}`, `Highlight: ${exp[0]?.achievement ?? "I focus on consistency and efficient delivery."}.`].join("\n")
        : [`我的经历概览：${expLine}`, `亮点：${exp[0]?.achievement ?? "我在项目中偏好用系统化方法提升一致性与效率。"}。`].join("\n");
    }

    if (/(作品|portfolio|案例|project|works)/i.test(q)) {
      return lang === "en"
        ? ["I have work across App / Web / Design systems / Brand.", worksLine ? `Featured: ${worksLine}.` : "Check the Works section for details."].join("\n")
        : ["我有多类作品方向（App / 网页 / 设计系统 / 品牌等）。", worksLine ? `其中“精选”包括：${worksLine}。` : "你可以在 Works 模块里查看具体项目卡片。"].join("\n");
    }

    if (/(邮箱|联系|contact|email|微信)/i.test(q)) {
      return lang === "en" ? `You can email me at: ${profile.email}` : `你可以通过邮箱联系我：${profile.email}`;
    }

    if (/(gpa|绩点|学校|教育|education)/i.test(q)) {
      const edu = siteContent.about.education?.[0];
      if (!edu) return lang === "en" ? "See Education in the About section." : "我的教育信息在 About 的 Education 模块里。";
      return lang === "en"
        ? `Education: ${edu.school} · ${edu.degree} (${edu.period}), ${edu.gpa}.`
        : `教育经历：${edu.school} · ${edu.degree}（${edu.period}），${edu.gpa}。`;
    }

    return siteContent.contact.floating.fallbackAnswer;
  };

  const [open, setOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [messages, setMessages] = useState<Array<{ type: "q" | "a" | "custom"; text: string }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectQ = (q: string) => {
    if (isTyping) return;
    setMessages((prev) => [...prev, { type: "q", text: q }]);
    setIsTyping(true);
    setTimeout(() => {
      const ans = QA_ANSWERS[q] || siteContent.contact.floating.fallbackAnswer;
      setMessages((prev) => [...prev, { type: "a", text: ans }]);
      setIsTyping(false);
    }, 1200);
  };

  const handleCustomSend = () => {
    if (!customInput.trim() || isTyping) return;
    const q = customInput.trim();
    setMessages((prev) => [...prev, { type: "custom", text: q }]);
    setCustomInput("");
    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          type: "a",
          text: buildResumeAnswer(q),
        },
      ]);
      setIsTyping(false);
    }, 1000);
  };

  const getIconComponent = (iconName: string) => {
    if (iconName === "Mail") return <Mail size={15} />;
    if (iconName === "Github") return <Github size={15} />;
    if (iconName === "Linkedin") return <Linkedin size={15} />;
    if (iconName === "WeChat") return <MessageSquare size={15} />;
    return null;
  };

  return (
    <>
      <div data-avoid-music-player="true" className="fixed z-[7000] flex flex-col items-end" style={{ bottom: "var(--space-6)", right: "var(--space-6)", gap: "var(--space-3)" }}>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="px-4 py-2 font-medium animate-float"
            style={{
              fontSize: "var(--text-xs)",
              borderRadius: "var(--radius-xl)",
              background: "var(--btn-primary-bg)",
              color: "var(--primary-foreground)",
              boxShadow: "var(--btn-primary-shadow)",
              cursor: "pointer",
            }}
          >
            {siteContent.contact.floating.bubble}
          </button>
        )}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center justify-center transition-all duration-300 hover:scale-110"
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "var(--radius-full)",
            background: open ? "var(--card)" : "var(--btn-primary-bg)",
            color: open ? "var(--foreground)" : "var(--primary-foreground)",
            border: open ? "1px solid var(--border)" : "none",
            boxShadow: open ? "none" : "var(--btn-primary-shadow)",
          }}
        >
          {open ? <X size={20} /> : <MessageSquare size={20} />}
        </button>
      </div>

      {open && (
        <div
          data-avoid-music-player="true"
          className="fixed z-[7000] flex flex-col animate-scale-in"
          style={{
            bottom: "88px",
            right: "var(--space-6)",
            width: "320px",
            maxHeight: "520px",
            borderRadius: "var(--radius-3xl)",
            background: "var(--card)",
            border: "1px solid rgba(168,85,247,0.25)",
            boxShadow: "0 20px 80px rgba(0,0,0,0.5), 0 0 40px rgba(168,85,247,0.1)",
            overflow: "hidden",
          }}
        >
          <div className="flex items-center justify-between flex-shrink-0 border-b border-border" style={{ padding: "var(--space-4) var(--space-5)", background: "linear-gradient(135deg, rgba(168,85,247,0.12) 0%, transparent 100%)" }}>
            <div className="flex items-center" style={{ gap: "var(--space-3)" }}>
              <div className="flex items-center justify-center" style={{ width: "32px", height: "32px", borderRadius: "var(--radius-full)", background: "var(--primary)" }}>
                <Sparkles size={14} className="text-primary-foreground" />
              </div>
              <div>
                <div className="font-bold text-foreground" style={{ fontSize: "var(--text-sm)" }}>
                  {siteContent.contact.floating.title}
                </div>
                <div className="text-muted-foreground" style={{ fontSize: "var(--text-xs)" }}>
                  {siteContent.contact.floating.subtitle}
                </div>
              </div>
            </div>
            <div className="flex items-center" style={{ gap: "var(--space-1)" }}>
              {messages.length > 0 && (
                <button onClick={() => setMessages([])} className="flex items-center justify-center transition-all hover:scale-110 text-muted-foreground hover:text-foreground" style={{ width: "28px", height: "28px", borderRadius: "var(--radius-full)", background: "var(--surface-2)" }} title={siteContent.contact.floating.clearTitle}>
                  <RotateCcw size={12} />
                </button>
              )}
              <button onClick={() => setOpen(false)} className="flex items-center justify-center transition-all hover:scale-110 text-muted-foreground" style={{ width: "28px", height: "28px", borderRadius: "var(--radius-full)", background: "var(--surface-2)" }}>
                <ChevronDown size={14} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col" style={{ padding: "var(--space-4)", gap: "var(--space-3)", scrollbarWidth: "none" }}>
            {messages.length === 0 && (
              <div className="text-center" style={{ paddingTop: "var(--space-4)" }}>
                <div style={{ fontSize: "28px", marginBottom: "var(--space-2)" }}>💬</div>
                <div className="text-muted-foreground" style={{ fontSize: "var(--text-xs)" }}>
                  {lang === "en" ? "Pick a preset below, or type your own." : "选择下方问题，或者自由输入！"}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.type === "a" ? "justify-start" : "justify-end"}`}>
                {msg.type === "a" && (
                  <div className="flex items-center justify-center mr-2 flex-shrink-0 font-semibold" style={{ width: "24px", height: "24px", marginTop: "2px", borderRadius: "var(--radius-full)", background: "var(--primary)", color: "var(--primary-foreground)", fontSize: "var(--text-xs)" }}>
                    谭
                  </div>
                )}
                <div
                  className="leading-relaxed"
                  style={{
                    maxWidth: "85%",
                    padding: "8px 12px",
                    fontSize: "var(--text-xs)",
                    borderRadius: msg.type === "a" ? "4px 16px 16px 16px" : "16px 16px 4px 16px",
                    background: msg.type === "a" ? "var(--surface-2)" : "var(--primary)",
                    color: msg.type === "a" ? "var(--foreground)" : "var(--primary-foreground)",
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start items-center" style={{ gap: "var(--space-2)" }}>
                <div className="flex items-center justify-center font-semibold flex-shrink-0" style={{ width: "24px", height: "24px", borderRadius: "var(--radius-full)", background: "var(--primary)", color: "var(--primary-foreground)", fontSize: "var(--text-xs)" }}>
                  谭
                </div>
                <div style={{ padding: "8px 12px", borderRadius: "4px 16px 16px 16px", background: "var(--surface-2)" }}>
                  <div className="flex items-center" style={{ gap: "4px" }}>
                    {[0, 1, 2].map((j) => (
                      <div key={j} className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--muted-foreground)", animation: `blink 1.2s ease-in-out ${j * 0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex-shrink-0 border-t border-border" style={{ padding: "var(--space-3) var(--space-4) var(--space-2)" }}>
            <div className="text-muted-foreground" style={{ fontSize: "var(--text-xs)", paddingBottom: "var(--space-2)" }}>
              {siteContent.contact.floating.quickAskLabel}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              {PRESET_QUESTIONS.map((q) => (
                <button key={q.text} onClick={() => handleSelectQ(q.text)} disabled={isTyping} className="flex items-center text-left transition-all hover:scale-[1.01] disabled:opacity-50 border border-border text-muted-foreground" style={{ gap: "var(--space-2)", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-lg)", fontSize: "var(--text-xs)", background: "var(--surface-1)" }}>
                  <span>{q.emoji}</span>
                  <span>{q.text}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-shrink-0 border-t border-border" style={{ padding: "var(--space-3)" }}>
            <div className="flex" style={{ gap: "var(--space-2)" }}>
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCustomSend();
                }}
                placeholder={siteContent.contact.floating.inputPlaceholder}
                className="flex-1 text-foreground outline-none transition-all focus:border-primary"
                style={{ padding: "8px 12px", borderRadius: "var(--radius-lg)", fontSize: "var(--text-xs)", background: "var(--input)", border: "1px solid var(--border)" }}
              />
              <button onClick={handleCustomSend} disabled={!customInput.trim() || isTyping} className="flex items-center justify-center transition-all hover:scale-110 disabled:opacity-40" style={{ width: "36px", height: "36px", borderRadius: "var(--radius-lg)", background: "var(--btn-primary-bg)", color: "var(--primary-foreground)", boxShadow: "var(--btn-primary-shadow)", flexShrink: 0 }}>
                <Send size={12} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const Contact = () => {
  const siteContent = useSiteContent();
  const { lang } = useI18n();
  const SOCIAL_LINKS = siteContent.contact.socialLinks;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("https://biliiant.top/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "contact", name, email, message }),
      });
    } catch {}
    setSent(true);
    setTimeout(() => setSent(false), 3000);
    setName("");
    setEmail("");
    setMessage("");
  };

  const getIconComponent = (iconName: string) => {
    if (iconName === "Mail") return <Mail size={15} />;
    if (iconName === "Github") return <Github size={15} />;
    if (iconName === "Linkedin") return <Linkedin size={15} />;
    if (iconName === "WeChat") return <MessageSquare size={15} />;
    return null;
  };

  return (
    <>
      <section id="contact" className="relative section-padding" style={{ background: "var(--background)" }}>
        <div className="absolute top-0 left-0 right-0" style={{ height: "1px", background: "linear-gradient(90deg, transparent, var(--accent), transparent)" }} />

        <div className="container-standard">
          <div style={{ marginBottom: "var(--space-12)" }}>
            <p className="label-eyebrow" style={{ marginBottom: "var(--space-3)" }}>
              Contact
            </p>
            <h2 style={{ fontSize: "var(--text-4xl)", fontWeight: 900, letterSpacing: "-0.025em", lineHeight: 1, marginBottom: "var(--space-4)" }}>
              {lang === "en" ? (
                <>
                  <span className="text-foreground">Contact</span>
                  <span className="text-gradient"> Me</span>
                </>
              ) : (
                <>
                  <span className="text-foreground">联系</span>
                  <span className="text-gradient"> 我</span>
                </>
              )}
            </h2>
            <div className="flex items-start flex-wrap" style={{ gap: "var(--space-4)" }}>
              <p className="text-muted-foreground leading-relaxed" style={{ maxWidth: "360px", fontSize: "var(--text-sm)" }}>
                {siteContent.contact.headerDesc}
              </p>
              <div className="flex items-center animate-fade-in-up" style={{ gap: "var(--space-2)", padding: "var(--space-2) var(--space-4)", borderRadius: "var(--radius-lg)", fontSize: "var(--text-xs)", background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)", color: "var(--primary)" }}>
                <MessageSquare size={12} />
                <span>{siteContent.contact.hint}</span>
                <span className="animate-bounce">👇</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row" style={{ gap: "var(--space-10)" }}>
            <div className="flex-shrink-0" style={{ width: "300px" }}>
              <div className="border" style={{ padding: "var(--space-8)", borderRadius: "var(--radius-2xl)", background: "var(--card)", borderColor: "rgba(168,85,247,0.2)", marginBottom: "var(--space-5)" }}>
                <div className="font-black animate-float" style={{ fontSize: "48px", lineHeight: 1, marginBottom: "var(--space-4)", color: "var(--primary)" }}>
                  "
                </div>
                <p className="text-muted-foreground leading-relaxed" style={{ fontSize: "var(--text-sm)" }}>
                  {siteContent.contact.quote}
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginBottom: "var(--space-5)" }}>
                {SOCIAL_LINKS.map((social) => (
                  <a key={social.label} href={social.href} className="group flex items-center border transition-all duration-300 hover:border-primary" style={{ gap: "var(--space-3)", padding: "var(--space-3) var(--space-4)", borderRadius: "var(--radius-xl)", background: "var(--card)", borderColor: "var(--border)" }}>
                    <div className="flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:bg-primary" style={{ width: "36px", height: "36px", borderRadius: "var(--radius-lg)", background: "rgba(168,85,247,0.1)", color: "var(--primary)" }}>
                      <span className="group-hover:text-primary-foreground transition-colors">{getIconComponent(social.icon)}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <div className="text-muted-foreground" style={{ fontSize: "var(--text-xs)" }}>
                        {social.label}
                      </div>
                      <div className="font-medium text-foreground" style={{ fontSize: "var(--text-sm)" }}>
                        {social.value}
                      </div>
                    </div>
                  </a>
                ))}
              </div>

              <div className="border" style={{ padding: "var(--space-5)", borderRadius: "var(--radius-2xl)", background: "var(--card)", borderColor: "rgba(168,85,247,0.15)" }}>
                <div className="flex items-center" style={{ gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
                  <MessageSquare size={14} className="text-primary" />
                  <span className="font-semibold text-foreground" style={{ fontSize: "var(--text-sm)" }}>
                    {siteContent.contact.qaHintTitle}
                  </span>
                </div>
                <p className="text-muted-foreground leading-relaxed" style={{ fontSize: "var(--text-xs)", marginBottom: "var(--space-3)" }}>
                  {siteContent.contact.qaHintDesc}
                </p>
                <div className="flex flex-wrap" style={{ gap: "var(--space-2)" }}>
                  {siteContent.contact.qaTags.map((tag) => (
                    <span key={tag} style={{ fontSize: "var(--text-xs)", padding: "3px 10px", borderRadius: "var(--radius-full)", background: "rgba(168,85,247,0.1)", color: "var(--primary)", border: "1px solid rgba(168,85,247,0.2)" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-1">
              <form onSubmit={handleSubmit} className="border" style={{ padding: "var(--space-10)", borderRadius: "var(--radius-2xl)", background: "var(--card)", borderColor: "var(--border)" }}>
                <div className="flex items-center" style={{ gap: "var(--space-2)", marginBottom: "var(--space-8)" }}>
                  <MessageSquare size={15} className="text-primary" />
                  <h3 className="font-semibold text-foreground" style={{ fontSize: "var(--text-sm)" }}>
                    {siteContent.contact.form.title}
                  </h3>
                </div>

                <div className="flex flex-col md:flex-row" style={{ gap: "var(--space-5)", marginBottom: "var(--space-5)" }}>
                  {[
                    { label: siteContent.contact.form.fields.name.label, value: name, onChange: setName, placeholder: siteContent.contact.form.fields.name.placeholder, type: "text" },
                    { label: siteContent.contact.form.fields.email.label, value: email, onChange: setEmail, placeholder: siteContent.contact.form.fields.email.placeholder, type: "email" },
                  ].map((field) => (
                    <div key={field.label} className="flex-1" style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                      <label className="text-muted-foreground" style={{ fontSize: "var(--text-xs)" }}>
                        {field.label}
                      </label>
                      <input type={field.type} value={field.value} onChange={(e) => field.onChange(e.target.value)} placeholder={field.placeholder} required className="text-foreground outline-none transition-all duration-200 focus:border-primary" style={{ padding: "10px 16px", borderRadius: "var(--radius-lg)", fontSize: "var(--text-sm)", background: "var(--input)", border: "1px solid var(--border)" }} />
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginBottom: "var(--space-6)" }}>
                  <label className="text-muted-foreground" style={{ fontSize: "var(--text-xs)" }}>
                    {siteContent.contact.form.fields.message.label}
                  </label>
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={siteContent.contact.form.fields.message.placeholder} required rows={5} className="text-foreground outline-none transition-all duration-200 focus:border-primary resize-none" style={{ padding: "10px 16px", borderRadius: "var(--radius-lg)", fontSize: "var(--text-sm)", background: "var(--input)", border: "1px solid var(--border)" }} />
                </div>

                <button type="submit" className="w-full flex items-center justify-center font-medium transition-all duration-300 hover:shadow-glow hover:scale-[1.01]" style={{ gap: "var(--space-2)", padding: "12px", borderRadius: "var(--radius-lg)", fontSize: "var(--text-sm)", background: sent ? "rgb(0, 212, 170)" : "var(--btn-primary-bg)", boxShadow: sent ? "none" : "var(--btn-primary-shadow)", color: "var(--primary-foreground)" }}>
                  {sent ? (
                    <>
                      <span>✓</span> {siteContent.contact.form.submit.sent}
                    </>
                  ) : (
                    <>
                      <Send size={14} /> {siteContent.contact.form.submit.idle}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <FloatingQA />
    </>
  );
};

export default Contact;


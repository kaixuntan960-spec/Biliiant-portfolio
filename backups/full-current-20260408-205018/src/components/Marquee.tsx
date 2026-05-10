const ITEMS = [
  "UI Design", "✦", "UX Research", "✦", "Brand Identity",
  "✦", "Design System", "✦", "Motion Design", "✦",
  "Prototyping", "✦", "Visual Design", "✦", "Interaction",
];

const Marquee = () => {
  return (
    <div
      data-cmp="Marquee"
      className="relative overflow-hidden border-y border-border"
      style={{ background: "var(--card)", paddingTop: "var(--space-3)", paddingBottom: "var(--space-3)" }}
    >
      <div className="marquee-inner">
        {[...ITEMS, ...ITEMS].map((item, i) => (
          <span
            key={i}
            className={`flex-shrink-0 font-medium tracking-widest uppercase ${
              item === "✦" ? "text-primary" : "text-muted-foreground"
            }`}
            style={{
              marginLeft: "var(--space-6)",
              marginRight: "var(--space-6)",
              fontSize: item === "✦" ? "var(--text-base)" : "var(--text-xs)",
            }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

export default Marquee;
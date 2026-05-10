import { useSiteContent } from "../i18n";

const Footer = () => {
  const siteContent = useSiteContent();
  return (
    <footer
      data-cmp="Footer"
      className="border-t border-border"
      style={{ background: "var(--background)", paddingTop: "var(--space-8)", paddingBottom: "var(--space-8)" }}
    >
      <div
        className="mx-auto flex flex-col md:flex-row items-center justify-between"
        style={{
          maxWidth: "var(--max-w-content)",
          paddingLeft: "var(--space-12)",
          paddingRight: "var(--space-12)",
          gap: "var(--space-4)",
        }}
      >
        <div className="flex items-center" style={{ gap: "var(--space-3)" }}>
          <div
            className="flex items-center justify-center font-bold"
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "var(--radius-full)",
              background: "linear-gradient(135deg, var(--primary) 0%, rgb(192,132,252) 100%)",
            }}
          >
            <span className="text-primary-foreground" style={{ fontSize: "var(--text-xs)" }}>
              KX
            </span>
          </div>
          <span className="text-muted-foreground" style={{ fontSize: "var(--text-sm)" }}>
            {siteContent.footer.leftName}
          </span>
        </div>
        <p className="text-muted-foreground" style={{ fontSize: "var(--text-xs)" }}>
          {siteContent.footer.copyright}
        </p>
        <div className="flex items-center" style={{ gap: "var(--space-2)" }}>
          <span className="w-2 h-2 rounded-full bg-accent" />
          <span className="text-muted-foreground" style={{ fontSize: "var(--text-xs)" }}>
            {siteContent.footer.rightDotText}
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


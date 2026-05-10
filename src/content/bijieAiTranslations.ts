export type BijieAiPageTranslation = {
  titleEn: string;
  bodyEn: string;
};

/**
 * English overlay translations for the Bijie AI case pages.
 *
 * NOTE:
 * - This is meant to be a precise, per-page copy translation layer.
 * - The website cannot reliably read/translate text inside images without OCR + a translation engine.
 * - Edit `bodyEn` to match the exact Chinese copy on each page for best accuracy.
 */
export const bijieAiTranslations: Record<number, BijieAiPageTranslation> = {
  1: {
    titleEn: "Cover",
    bodyEn: [
      "2025 Design Portfolio (UI/UX).",
      "A playful cover that signals my workflow and tools: Figma / PS / AI / AE / Animate.",
      "Role: UI designer — focused on building clean, modern, product-ready interfaces.",
    ].join("\n"),
  },
  2: {
    titleEn: "Overview",
    bodyEn: [
      "Project montage / quick preview.",
      "A glance at key screens across the AI writing app: onboarding, writing flow, templates, membership, and key UI states.",
      "This page sets the visual tone and scope of the case study.",
    ].join("\n"),
  },
  3: {
    titleEn: "Brief",
    bodyEn: [
      "Welcome to Bijie AI — an AI writing tool.",
      "Target users: students, new-media creators, and office workers.",
      "Core value: help users create / rewrite / continue writing more efficiently with guided AI assistance.",
    ].join("\n"),
  },
  4: {
    titleEn: "Project Background",
    bodyEn: [
      "Background: an AI writing product for students, new-media creators, and office workers.",
      "Current problems: unstable content quality, unreliable output, complex operations, and low feature discoverability — leading to weak retention.",
      "Design direction: optimize the information architecture and flow; strengthen visual feedback to improve controllability and brand trust.",
      "Goals: better UX → stronger brand perception → higher retention & conversion.",
    ].join("\n"),
  },
  5: {
    titleEn: "User Research",
    bodyEn: [
      "Market/user research — key pain points gathered from feedback:",
      "- Hard to sync across devices; inconsistent multi-device experience",
      "- History records get lost or messy",
      "- Core features are hidden; entry points are hard to find",
      "- Generated results are hard to adjust (lack of direct editing tools)",
      "- Weak perception of paid value; low willingness to upgrade",
      "- Generic content style; lack of creativity/personalization",
      "- Personal settings don’t persist; preferences aren’t saved",
      "- Users churn quickly; retention is difficult",
      "",
      "Research method:",
      "Problem definition & behavior hypotheses → quantitative survey → qualitative interviews/observation → synthesis & design output.",
    ].join("\n"),
  },
  6: {
    titleEn: "Business Analysis",
    bodyEn: [
      "From insights → business requirements → product problems → user needs.",
      "Business objectives are grouped into: Growth / Brand / Experience.",
      "",
      "Design focus (for growth scenarios):",
      "- Membership optimization: recommend plans based on behavior; reinforce value through ratings + scenario-driven guidance",
      "- Homepage optimization: surface high-frequency functions; make history records actionable; add brand memory points",
      "- Writing-flow optimization: real-time preview and parameter memory to reduce repeated operations and improve efficiency",
    ].join("\n"),
  },
  7: {
    titleEn: "Design Principles",
    bodyEn: [
      "Principles for Bijie AI:",
      "- Business benefits: drive conversion without hurting usability",
      "- Brand attributes: a friendly “AI helper” identity (warm, approachable, reliable)",
      "- Advanced experience: smoother flow, clearer hierarchy, and helpful feedback at key moments",
    ].join("\n"),
  },
  8: {
    titleEn: "Competitive Analysis",
    bodyEn: [
      "Competitor scan: Kimi, Chuangzuomao, iFlytek Spark.",
      "Comparison dimensions: positioning, target users, feature highlights, color/UI tone, and overall experience.",
      "",
      "Takeaways:",
      "- Chuangzuomao: very direct “make money” narrative; strong for short-video scripts",
      "- Kimi: strong depth for research + long-text processing; professional barrier built around knowledge integration",
      "- Spark: broad AI ecosystem with multi-modal capabilities; strong for one-stop AI assistant needs",
      "",
      "Implication for an AI writing product:",
      "Differentiate via either “professional depth” or an integrated, efficient workflow experience (or both).",
    ].join("\n"),
  },
  9: {
    titleEn: "Design Approach (1)",
    bodyEn: [
      "Key flow: AI writing — focus on faster creation and clearer actions.",
      "- AI “Start”: generate a good first draft quickly with guided prompts",
      "- Writing cards: make suggestions scannable and actionable (apply / rewrite / continue)",
      "- Content library: save & reuse good outputs to improve efficiency",
      "",
      "UX intent: less “black box”, more controllable iteration.",
    ].join("\n"),
  },
  10: {
    titleEn: "Design Approach (2)",
    bodyEn: [
      "Growth scenario: membership conversion.",
      "Goal: communicate value more directly and trigger “buy now” actions.",
      "",
      "Key ideas:",
      "- Visualize the benefits (clear comparison and what users get)",
      "- Add trust cues in the right scenario to reduce hesitation",
      "- Stronger promo rhythm (limited-time offer + focused CTA)",
    ].join("\n"),
  },
  11: {
    titleEn: "Login Screen",
    bodyEn: [
      "Login screen refresh with an emotional IP to strengthen brand recognition.",
      "Shift perception from “a cold tool” to a friendly “AI writing assistant”.",
      "Clean structure + warm visuals reduce friction and improve first-impression trust.",
    ].join("\n"),
  },
  12: {
    titleEn: "Brand Character / IP",
    bodyEn: [
      "IP character system for a consistent brand atmosphere.",
      "Deliverables:",
      "- Character views (front/side/back) for correct usage",
      "- Motion/expression set for product moments (tips, success, guidance)",
      "- Scene variants to fit different contexts while staying on-brand",
    ].join("\n"),
  },
  13: {
    titleEn: "Design Guidelines",
    bodyEn: [
      "Design specs & guidelines for consistent delivery.",
      "Includes:",
      "- Emotional keyword board (tone references)",
      "- Typography: font families + size scale",
      "- Color system: primary and supporting colors for UI hierarchy",
      "",
      "Purpose: easier maintenance, scaling, and dev handoff.",
    ].join("\n"),
  },
};


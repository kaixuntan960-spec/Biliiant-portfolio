export type CasePageTranslation = {
  titleEn: string;
  bodyEn: string;
};

/**
 * English overlay translations for the B-end (merchant admin) case pages.
 * These are page-matched summaries for image-based portfolios.
 */
export const bEndTranslations: Record<number, CasePageTranslation> = {
  1: {
    titleEn: "Cover",
    bodyEn: [
      "B-end Merchant Admin · E-commerce Platform.",
      "A multi-role back-office system (operations / customer service / product management) used for daily merchant workflows.",
    ].join("\n"),
  },
  2: {
    titleEn: "About the Project",
    bodyEn: [
      "Background: merchants needed a more efficient admin tool as e-commerce operations became more digital.",
      "Problems: fragmented experience and complex flows across modules; low efficiency leads to slow decisions and weak competitiveness.",
      "Goal: rebuild the admin experience—integrate data, simplify flows, and set a stronger B-end workflow benchmark.",
    ].join("\n"),
  },
  3: {
    titleEn: "User Pain Points",
    bodyEn: [
      "Common pain points collected from roles:",
      "- Data is fragmented; manual cross-platform stitching is needed",
      "- Customer service needs to switch systems to find user/order context",
      "- Multi-role collaboration is tedious and repetitive",
      "- Supplier info is scattered and hard to manage",
      "- Product publishing and onboarding take too long; efficiency is low",
      "",
      "Three focus areas:",
      "1) Core roles (Ops/CS)  2) Product flows  3) Shared experience patterns",
    ].join("\n"),
  },
  4: {
    titleEn: "High-Frequency Tasks",
    bodyEn: [
      "Make high-frequency functions visible upfront to reduce searching cost.",
      "Restructure the navigation into a “core operation area” so users can complete tasks with fewer clicks.",
      "Add flexible customization so different roles can pin what they use most.",
    ].join("\n"),
  },
  5: {
    titleEn: "Data Layering",
    bodyEn: [
      "Problem: dashboards were overly dense—key metrics were hard to spot at a glance.",
      "Solution:",
      "- Strengthen the primary layer (core metrics) with bigger cards and clearer contrast",
      "- Move secondary metrics into assistive analysis blocks",
      "- Unify module styles (radius, spacing, headings) to lower cognitive load",
      "",
      "Outcome (as described): dashboard satisfaction improved significantly after hierarchy optimization.",
    ].join("\n"),
  },
  6: {
    titleEn: "Contextual Linkage (CS)",
    bodyEn: [
      "Customer service scenario: link context around the conversation.",
      "Auto-associate order details (logistics / items / order no.), membership info, and history—so CS can respond faster.",
      "Standardize cards and table patterns to improve readability and reduce cognitive load.",
    ].join("\n"),
  },
  7: {
    titleEn: "Contextual Linkage (CS) – Enhanced",
    bodyEn: [
      "More scenario-based linkage to boost CS efficiency.",
      "Keep critical context in view while replying, minimize page switching, and reduce missed information.",
      "Outcome (as described): average response time reduced and satisfaction improved.",
    ].join("\n"),
  },
  8: {
    titleEn: "Permission Settings",
    bodyEn: [
      "Pain point: permissions were hard to find and error-prone—too many items to select.",
      "Solution:",
      "- Group by business modules (e.g., Products / Finance) and allow collapse/expand for structure",
      "- Provide quick actions (Select all / Invert / Clear)",
      "- Support batch operations and linked permissions to reduce repeated work and omission risks",
    ].join("\n"),
  },
  9: {
    titleEn: "Permission Settings – Precision",
    bodyEn: [
      "Refine the permission experience for speed and accuracy.",
      "Clear grouping and fast actions help operators configure accounts efficiently while lowering mistakes.",
      "Outcome (as described): error rate dropped and batch operations became easier and safer.",
    ].join("\n"),
  },
  10: {
    titleEn: "Product Publishing Flow",
    bodyEn: [
      "Problem: the product publishing flow was complex; users had to jump back and forth and often lost context.",
      "Solution:",
      "- Break the process into clear steps (category → basic info → publish success)",
      "- Use progress guidance so users always know where they are",
      "- Add info retention + smart linking to reduce re-entry and mistakes",
      "",
      "Outcome (as described): higher publishing efficiency and better information completion/retention.",
    ].join("\n"),
  },
};


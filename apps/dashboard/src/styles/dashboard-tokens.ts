/**
 * Dashboard Design Tokens — Reference File
 * Ported from zohm (game.zo.xyz) design system.
 * Prefer Tailwind classes (dash-*) over these values.
 * This file exists for values that can't be expressed in Tailwind (SVG strokes, dynamic styles).
 */
export const DashboardTokens = {
  colors: {
    bg: "rgba(0, 0, 0, 0.4)",
    bgSolid: "#000000",
    border: "rgba(255, 255, 255, 0.08)",
    borderHover: "rgba(255, 255, 255, 0.16)",
    text: "#FFFFFF",
    text80: "rgba(255, 255, 255, 0.8)",
    text50: "rgba(255, 255, 255, 0.5)",
    text40: "rgba(255, 255, 255, 0.4)",
    accent: "#CFFF50",
  },
  passport: {
    founderBg:
      "https://proxy.cdn.zo.xyz/gallery/media/images/a1659b07-94f0-4490-9b3c-3366715d9717_20250515053726.png",
    citizenBg:
      "https://proxy.cdn.zo.xyz/gallery/media/images/bda9da5a-eefe-411d-8d90-667c80024463_20250515053805.png",
  },
} as const;

import type { Config } from "tailwindcss";

// Tokens sourced from DESIGN_SYSTEM.md §1–3.
// ⚠️ olive-dark, ivory, and text-dark are SAMPLED from mockup screenshots, not
// confirmed brand hex values — see DESIGN_SYSTEM.md §10 "Open Items to Confirm".
// Swap these once the client/designer confirms real Figma values.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "olive-dark": "#3A3820", // sampled — confirm real brand hex
        charcoal: "#1A1A1A", // IA doc exact value (footer bg)
        ivory: "#F0EAE3", // sampled
        "text-dark": "#3F2C1B", // sampled
      },
      fontFamily: {
        display: ["var(--font-playfair)", "serif"],
        // Body sans is unspecified in the IA doc (DESIGN_SYSTEM.md §10.5) —
        // Inter is a placeholder, confirm with client before launch.
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "10px",
      },
      spacing: {
        "header-desktop": "64px",
        "header-mobile": "56px",
      },
      // maxWidth has its own scale in Tailwind, separate from `spacing` (which
      // only backs width/height/padding/margin) — declared explicitly here so
      // `max-w-cart-drawer` actually generates.
      maxWidth: {
        "cart-drawer": "400px",
      },
      transitionDuration: {
        150: "150ms",
        200: "200ms",
        300: "300ms",
        400: "400ms",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-in-left": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 300ms ease-out",
        "slide-in-right": "slide-in-right 400ms cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-in-left": "slide-in-left 400ms cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};

export default config;

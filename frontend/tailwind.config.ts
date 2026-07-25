import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      colors: {
        // All values are read from CSS variables defined in src/styles/tokens.css
        // so the same utility classes work in both light and dark mode.
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        bg: "rgb(var(--color-bg) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        "surface-raised": "rgb(var(--color-surface-raised) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
        "text-primary": "rgb(var(--color-text-primary) / <alpha-value>)",
        "text-muted": "rgb(var(--color-text-muted) / <alpha-value>)",
        "text-disabled": "rgb(var(--color-text-disabled) / <alpha-value>)",
        primary: "rgb(var(--color-primary) / <alpha-value>)",
        "primary-hover": "rgb(var(--color-primary-hover) / <alpha-value>)",
        "primary-active": "rgb(var(--color-primary-active) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        "accent-hover": "rgb(var(--color-accent-hover) / <alpha-value>)",
        success: "rgb(var(--color-success) / <alpha-value>)",
        "success-bg": "rgb(var(--color-success-bg) / <alpha-value>)",
        warning: "rgb(var(--color-warning) / <alpha-value>)",
        "warning-bg": "rgb(var(--color-warning-bg) / <alpha-value>)",
        danger: "rgb(var(--color-danger) / <alpha-value>)",
        "danger-bg": "rgb(var(--color-danger-bg) / <alpha-value>)",
        focus: "rgb(var(--color-focus) / <alpha-value>)",
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "10px",
        lg: "14px",
        xl: "20px",
      },
      boxShadow: {
        card: "0 1px 2px rgb(15 23 42 / 0.04), 0 1px 1px rgb(15 23 42 / 0.03)",
        raised: "0 4px 16px -4px rgb(15 23 42 / 0.12), 0 2px 6px -2px rgb(15 23 42 / 0.06)",
        glow: "0 0 0 1px rgb(var(--color-accent) / 0.25), 0 8px 30px -8px rgb(var(--color-accent) / 0.35)",
      },
      keyframes: {
        "ring-sweep": {
          "0%": { "stroke-dashoffset": "283" },
          "100%": { "stroke-dashoffset": "var(--ring-offset)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "ring-sweep": "ring-sweep 1.1s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "fade-up": "fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards",
      },
    },
  },
  plugins: [],
} satisfies Config;

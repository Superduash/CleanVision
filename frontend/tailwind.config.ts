import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Display: Plus Jakarta Sans — geometric, modern, premium feel
        display: ["'Plus Jakarta Sans'", "sans-serif"],
        // Body: Inter — the gold standard for UI readability
        body: ["'Inter'", "sans-serif"],
        // Mono: IBM Plex Mono — clean monospaced for scores/IDs
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      colors: {
        // All mapped to CSS variables in tokens.css — works in both light + dark
        ink:              "rgb(var(--color-ink) / <alpha-value>)",
        bg:               "rgb(var(--color-bg) / <alpha-value>)",
        surface:          "rgb(var(--color-surface) / <alpha-value>)",
        "surface-raised": "rgb(var(--color-surface-raised) / <alpha-value>)",
        border:           "rgb(var(--color-border) / <alpha-value>)",
        "text-primary":   "rgb(var(--color-text-primary) / <alpha-value>)",
        "text-muted":     "rgb(var(--color-text-muted) / <alpha-value>)",
        "text-disabled":  "rgb(var(--color-text-disabled) / <alpha-value>)",
        highlight:        "rgb(var(--color-highlight) / <alpha-value>)",
        primary:          "rgb(var(--color-primary) / <alpha-value>)",
        "primary-hover":  "rgb(var(--color-primary-hover) / <alpha-value>)",
        "primary-active": "rgb(var(--color-primary-active) / <alpha-value>)",
        accent:           "rgb(var(--color-accent) / <alpha-value>)",
        "accent-hover":   "rgb(var(--color-accent-hover) / <alpha-value>)",
        success:          "rgb(var(--color-success) / <alpha-value>)",
        "success-bg":     "rgb(var(--color-success-bg) / <alpha-value>)",
        warning:          "rgb(var(--color-warning) / <alpha-value>)",
        "warning-bg":     "rgb(var(--color-warning-bg) / <alpha-value>)",
        danger:           "rgb(var(--color-danger) / <alpha-value>)",
        "danger-bg":      "rgb(var(--color-danger-bg) / <alpha-value>)",
        focus:            "rgb(var(--color-focus) / <alpha-value>)",
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "10px",
        lg: "14px",
        xl: "20px",
        "2xl": "28px",
      },
      boxShadow: {
        // Subtle card depth
        card: "0 1px 3px rgb(10 15 30 / 0.06), 0 1px 2px rgb(10 15 30 / 0.04)",
        // Elevated panels / dropdowns
        raised: "0 6px 24px -4px rgb(10 15 30 / 0.12), 0 2px 8px -2px rgb(10 15 30 / 0.06)",
        // AI/scan glow — violet
        glow: "0 0 0 1px rgb(var(--color-accent) / 0.2), 0 8px 32px -6px rgb(var(--color-accent) / 0.3)",
        // Primary blue glow (buttons)
        "primary-glow": "0 4px 20px -4px rgb(var(--color-primary) / 0.4)",
        // Inner focus ring
        focus: "0 0 0 3px rgb(var(--color-focus) / 0.25)",
      },
      keyframes: {
        "ring-sweep": {
          "0%":   { "stroke-dashoffset": "283" },
          "100%": { "stroke-dashoffset": "var(--ring-offset)" },
        },
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%":   { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "ring-sweep": "ring-sweep 1.1s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "fade-up":    "fade-up 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "fade-in":    "fade-in 0.25s ease forwards",
        "scale-in":   "scale-in 0.2s cubic-bezier(0.22, 1, 0.36, 1) forwards",
      },
    },
  },
  plugins: [],
} satisfies Config;

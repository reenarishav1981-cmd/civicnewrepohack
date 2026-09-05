import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Substrate / Canvas Tokens
        canvas: {
          DEFAULT: "#080D18",
          elevated: "#0D1424",
        },
        void: "#080D18",
        // Surface Elevation Hierarchy
        surface: {
          base: "#0D1424",
          elevated: "#111A2D",
          active: "#17243E",
          subtle: "#0A101D",
          focal: "#111A2D",
        },
        // Semantic Action & Intelligence
        civic: {
          blue: "#4C8DFF",
          "blue-hover": "#3A7BEB",
          "blue-subtle": "rgba(76, 141, 255, 0.12)",
          cyan: "#53D7FF",
          "cyan-subtle": "rgba(83, 215, 255, 0.12)",
          "cyan-glow": "rgba(83, 215, 255, 0.15)",
          red: "#FF5D6C",
          "red-subtle": "rgba(255, 93, 108, 0.12)",
          amber: "#FFB648",
          "amber-subtle": "rgba(255, 182, 72, 0.12)",
          green: "#43D19E",
          "green-subtle": "rgba(67, 209, 158, 0.12)",
        },
        // Typography Tokens
        text: {
          primary: "#F0F4F8",
          secondary: "#7F93AF",
          muted: "#4A5B73",
          telemetry: "#53D7FF",
        },
        // Border Hierarchy
        border: {
          subtle: "rgba(255, 255, 255, 0.06)",
          medium: "rgba(255, 255, 255, 0.12)",
          accent: "rgba(83, 215, 255, 0.35)",
          focus: "rgba(83, 215, 255, 0.45)",
          critical: "rgba(255, 93, 108, 0.35)",
          warning: "rgba(255, 182, 72, 0.35)",
          resolved: "rgba(67, 209, 158, 0.35)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      spacing: {
        "1": "4px",
        "2": "8px",
        "3": "12px",
        "4": "16px",
        "5": "20px",
        "6": "24px",
        "8": "32px",
        "10": "40px",
        "12": "48px",
        "16": "64px",
        "20": "80px",
        "24": "96px",
      },
      borderRadius: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
        "3xl": "32px",
        full: "9999px",
      },
      boxShadow: {
        "elevation-low": "0 2px 8px rgba(0, 0, 0, 0.35)",
        "elevation-md": "0 8px 24px rgba(0, 0, 0, 0.45)",
        "elevation-high": "0 16px 40px rgba(0, 0, 0, 0.6)",
        "focal-glow": "0 16px 40px rgba(0, 0, 0, 0.6), 0 0 24px rgba(83, 215, 255, 0.12)",
        "accent-blue": "0 4px 16px rgba(76, 141, 255, 0.25)",
        "accent-blue-lg": "0 8px 28px rgba(76, 141, 255, 0.35)",
        "accent-cyan": "0 4px 16px rgba(83, 215, 255, 0.2)",
      },
      animation: {
        "pulse-slow": "pulse 3.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "ping-slow": "ping 3s cubic-bezier(0, 0, 0.2, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: "#1a4d4a",
          "teal-dark": "#143d3b",
          gold: "#c9a227",
          "gold-light": "#e8c84a",
          cream: "#f5f0e8",
          "cream-dark": "#ebe4d8",
          purple: "#6d28d9",
          "purple-dark": "#5b21b6",
          "purple-soft": "#f5f3ff",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
      fontSize: {
        xs: ["0.8125rem", { lineHeight: "1.2rem" }],
        sm: ["1rem", { lineHeight: "1.5rem" }],
        base: ["1.125rem", { lineHeight: "1.7rem" }],
        lg: ["1.25rem", { lineHeight: "1.8rem" }],
        xl: ["1.375rem", { lineHeight: "1.9rem" }],
        "2xl": ["1.75rem", { lineHeight: "2.15rem" }],
        "3xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "4xl": ["2.5rem", { lineHeight: "1.15" }],
        "5xl": ["3.25rem", { lineHeight: "1.1" }],
        "6xl": ["4rem", { lineHeight: "1.05" }],
      },
    },
  },
  plugins: [],
};

export default config;

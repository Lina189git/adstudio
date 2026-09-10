import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        canvas: {
          50:  "#fdf8f1",
          100: "#f8f1e6",
          200: "#f0e4cf",
          300: "#eadfcb",
          400: "#ddd0b8",
        },
        ink: {
          DEFAULT: "#1a1614",
          soft:    "#2a2624",
          muted:   "#6b5d54",
          faint:   "#8c7764",
        },
        gold: {
          DEFAULT: "#d4a574",
          light:   "#f4d090",
          dark:    "#a87945",
          deep:    "#7a5930",
        },
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease both",
        "fade-in": "fadeIn 0.4s ease both",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

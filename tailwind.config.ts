import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./hooks/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        mango: {
          50: "#FFF4EC",
          100: "#FFE4D1",
          200: "#FFC9A3",
          300: "#FFA45B",
          400: "#FF8C42",
          500: "#FF7A30",
          600: "#F0601A",
          700: "#C74A10",
        },
        peach: {
          100: "#FFEBDB",
          200: "#FFD3B0",
          300: "#FFBE87",
          400: "#FFA45B",
        },
        celery: {
          100: "#DCFCE7",
          200: "#BBF7D0",
          300: "#86EFAC",
          400: "#4ADE80",
          500: "#22C55E",
          600: "#16A34A",
        },
        cream: "#FFFDF5",
        custard: "#FDF6E9",
        cocoa: {
          300: "#B9927A",
          400: "#9C6F55",
          500: "#7A4E36",
          700: "#4A2C1A",
          900: "#2E1A0E",
        },
        cherry: {
          400: "#FF5A5F",
          500: "#F43F48",
          600: "#D92A35",
          700: "#B01D28",
        },
        gold: {
          200: "#FFF0A8",
          300: "#FFE066",
          400: "#FFCB2B",
          500: "#F5B300",
          600: "#D99600",
        },
      },
      fontFamily: {
        display: ["var(--font-baloo)", "ui-rounded", "system-ui", "sans-serif"],
        sans: ["var(--font-nunito)", "ui-rounded", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        // Soft "clay" depth: outer warm drop + inner highlight + inner shade.
        clay: "0 10px 25px -5px rgba(255,122,48,0.15), inset 0 -4px 0 0 rgba(122,78,54,0.06), inset 0 2px 0 0 rgba(255,255,255,0.9)",
        "clay-lg":
          "0 24px 48px -12px rgba(255,122,48,0.25), 0 8px 16px -8px rgba(122,78,54,0.12), inset 0 -6px 0 0 rgba(122,78,54,0.06), inset 0 3px 0 0 rgba(255,255,255,0.9)",
        puffy: "0 10px 25px -5px rgba(255,122,48,0.15)",
        "btn-mango": "0 6px 0 0 #C74A10, 0 14px 24px -6px rgba(255,122,48,0.55), inset 0 2px 0 0 rgba(255,255,255,0.45)",
        "btn-mango-pressed": "0 2px 0 0 #C74A10, 0 6px 12px -6px rgba(255,122,48,0.55), inset 0 2px 0 0 rgba(255,255,255,0.45)",
        "btn-cherry": "0 7px 0 0 #8E1520, 0 18px 30px -8px rgba(244,63,72,0.6), inset 0 3px 0 0 rgba(255,255,255,0.45)",
        "btn-celery": "0 5px 0 0 #16A34A, 0 12px 20px -6px rgba(74,222,128,0.5), inset 0 2px 0 0 rgba(255,255,255,0.5)",
        "btn-soft": "0 4px 0 0 #FFD3B0, 0 10px 18px -8px rgba(255,122,48,0.25), inset 0 2px 0 0 rgba(255,255,255,0.9)",
        "inner-well": "inset 0 4px 10px rgba(122,78,54,0.12), inset 0 -2px 0 rgba(255,255,255,0.8)",
        glow: "0 0 0 6px rgba(255,203,43,0.25), 0 0 40px 10px rgba(255,203,43,0.45)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        shine: {
          "0%": { transform: "translateX(-120%) skewX(-20deg)" },
          "60%, 100%": { transform: "translateX(220%) skewX(-20deg)" },
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
        blob: {
          "0%, 100%": { borderRadius: "42% 58% 60% 40% / 45% 45% 55% 55%" },
          "50%": { borderRadius: "58% 42% 40% 60% / 55% 60% 40% 45%" },
        },
      },
      animation: {
        float: "float 3.2s ease-in-out infinite",
        "float-slow": "float 5s ease-in-out infinite",
        wiggle: "wiggle 1.4s ease-in-out infinite",
        shine: "shine 2.8s ease-in-out infinite",
        "spin-slow": "spin-slow 14s linear infinite",
        blob: "blob 9s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;

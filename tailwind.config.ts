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
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        inter: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      colors: {
        // Admin dashboard colors
        bg: {
          base: "#0F172A",
          card: "#1E293B",
          hover: "#334155",
        },
        brand: {
          DEFAULT: "#3B82F6",
          hover: "#2563EB",
        },
        // DoDo brand colors
        dodo: {
          primary: "#6366f1",
          "primary-hover": "#4f46e5",
          "primary-bright": "#818cf8",
          violet: "#8b5cf6",
          bg: "#080810",
          "bg-1": "#0d0d18",
          "bg-2": "#12121f",
          surface: "rgba(255,255,255,0.04)",
          border: "rgba(255,255,255,0.08)",
          "border-strong": "rgba(255,255,255,0.14)",
          text: "#f8fafc",
          muted: "#94a3b8",
          "muted-2": "#64748b",
        },
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 4s ease-in-out infinite",
        "float-slow": "float 6s ease-in-out infinite",
        "fade-up": "fadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "scale-in": "scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "blink": "blink 1s step-end infinite",
        "shimmer": "shimmer 2.5s linear infinite",
        "glow": "glowPulse 3s ease-in-out infinite",
        "scan": "scan 3s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(28px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.85)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.7" },
          "50%": { opacity: "1" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;

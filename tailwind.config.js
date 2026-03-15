/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        mono:    ["var(--font-mono)", "monospace"],
        body:    ["var(--font-body)", "sans-serif"],
      },
      colors: {
        void:   "#050508",
        panel:  "#0a0a12",
        border: "#1a1a2e",
        accent: "#00ff88",
        gold:   "#f59e0b",
        plasma: "#7c3aed",
        danger: "#ef4444",
        muted:  "#4a4a6a",
      },
      backgroundImage: {
        "grid-void": "linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px)",
      },
      backgroundSize: {
        "grid-void": "40px 40px",
      },
      animation: {
        "pulse-slow":   "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "scan":         "scan 3s linear infinite",
        "glow":         "glow 2s ease-in-out infinite alternate",
        "float":        "float 6s ease-in-out infinite",
      },
      keyframes: {
        scan: {
          "0%":   { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(200%)" },
        },
        glow: {
          "from": { boxShadow: "0 0 10px #00ff8840, 0 0 20px #00ff8820" },
          "to":   { boxShadow: "0 0 20px #00ff8860, 0 0 40px #00ff8840" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};

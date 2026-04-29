/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sand: {
          50: "#fffaf3",
          100: "#f7eee0",
          200: "#ecd7b5",
        },
        brand: {
          teal: "#0f766e",
          navy: "#0f172a",
          coral: "#f97316",
          sky: "#38bdf8",
        },
      },
      fontFamily: {
        sans: ["DM Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "DM Sans", "ui-sans-serif", "sans-serif"],
      },
      boxShadow: {
        panel: "0 24px 80px rgba(15, 23, 42, 0.08)",
        glow: "0 22px 60px rgba(15, 118, 110, 0.15)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        float: "float 8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Farmcast dark theme tokens
        base: {
          900: "#070b14", // near-black base
          800: "#0b1220",
          700: "#111a2e",
        },
        // condition semantics
        go: "#34d399", // green
        caution: "#fbbf24", // amber
        stop: "#f87171", // red
        brand: "#38bdf8", // electric sky accent
      },
      fontFamily: {
        sans: [
          "Inter Tight",
          "Inter",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      backdropBlur: {
        glass: "16px",
      },
    },
  },
  plugins: [],
} satisfies Config;

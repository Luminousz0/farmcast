import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Farmcast warm-dark "agronomic editorial" theme tokens.
        // Keep in sync with CSS vars in index.css and JS values in src/lib/theme.ts.
        base: {
          900: "#14110b", // warm near-black base
          800: "#1c1710", // raised surface
          700: "#272017", // hairline / subtle fill
        },
        // condition semantics — natural field tones, not neon
        go: "#6aa84f", // field green
        caution: "#e2902b", // harvest ochre-orange
        stop: "#cf5a3e", // terracotta / brick
        brand: "#d6a24a", // wheat-gold chrome accent
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
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

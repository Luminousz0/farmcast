// Single source of truth for theme colors used in JS / SVG / inline styles.
// Keep these values numerically in sync with the CSS vars in src/index.css
// and the Tailwind tokens in tailwind.config.ts.

import type { ConditionScore } from "@/types/crop";

/** Wheat-gold chrome accent (replaces the old electric-cyan brand). */
export const BRAND_GOLD = "#d6a24a";

/** Warm surface base, used e.g. for the wind-compass hub fill. */
export const SURFACE = "#1c1710";

/** Condition semantics — natural field tones. */
export const CONDITION_COLORS: Record<ConditionScore, string> = {
  go: "#6aa84f", // field green
  caution: "#e2902b", // harvest ochre-orange
  stop: "#cf5a3e", // terracotta / brick
};

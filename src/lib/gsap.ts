import { gsap as gsapCore } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Named const re-export — webpack sometimes fails to resolve
// `export { gsap }` from gsap's `export { gsapWithCSS as gsap }` pattern.
export const gsap = gsapCore;
export { ScrollTrigger };

// registerPlugin is idempotent, safe to call every time this module loads
// (HMR re-execution, multiple client components importing it, etc).
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * GSAP has no built-in equivalent to framer-motion's useReducedMotion().
 * Every new GSAP timeline must check this explicitly and either skip the
 * animation or collapse straight to its end state.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

"use client";

/**
 * PARALLAX - GSAP ScrollTrigger scrub, distinct from the Reveal primitives
 * (which fire once on viewport entry via Framer Motion's whileInView).
 * This ties motion continuously to scroll position instead - use it for
 * ambient/decorative layers that should drift as the page scrolls, not for
 * content entrances (Reveal/StaggerContainer already own that job).
 */

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

interface ParallaxProps {
  children: ReactNode;
  className?: string;
  /** Total yPercent drift from scroll-start to scroll-end; negative drifts up. */
  speed?: number;
  start?: string;
  end?: string;
}

export function Parallax({
  children,
  className,
  speed = 15,
  start = "top bottom",
  end = "bottom top",
}: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!ref.current || prefersReducedMotion()) return;
      gsap.to(ref.current, {
        yPercent: speed,
        ease: "none",
        scrollTrigger: { trigger: ref.current, start, end, scrub: true },
      });
    },
    { scope: ref, dependencies: [speed, start, end] }
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

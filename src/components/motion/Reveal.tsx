"use client";

/**
 * MOTION PRIMITIVES — shared animation building blocks (Wanderers Warmth)
 * -----------------------------------------------------------------------------
 * All variants respect useReducedMotion(): physical motion + blur are stripped,
 * timing is preserved (opacity-only fade at the same duration).
 *
 *  - Reveal           scroll-triggered blur-slide-up for sections / blocks
 *  - StaggerContainer / StaggerItem   staggered list & grid entrances
 *  - AnimatedHeadline word-by-word blur reveal for hero display text
 *  - CountUp          number counter that animates on viewport entry
 *  - LineReveal       horizontal divider that draws left → right
 * -----------------------------------------------------------------------------
 */

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useInView,
  animate,
  type Variants,
} from "framer-motion";

export const EASE = [0.25, 0.46, 0.45, 0.94] as const;
export const EASE_OVERSHOOT = [0.34, 1.56, 0.64, 1] as const;
export const EASE_LINE = [0.76, 0, 0.24, 1] as const;

/* ── Reveal: single block, scroll-triggered ── */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
  amount = 0.1,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  amount?: number;
  as?: "div" | "section" | "header";
}) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as] as typeof motion.div;
  return (
    <MotionTag
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, filter: "blur(12px)", y }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, filter: "blur(0px)", y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </MotionTag>
  );
}

/* ── Staggered container + items ── */
export function StaggerContainer({
  children,
  className,
  stagger = 0.09,
  amount = 0.1,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  amount?: number;
}) {
  const variants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: stagger } },
  };
  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const variants: Variants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, filter: "blur(12px)", y: 28 },
    show: reduce
      ? { opacity: 1, transition: { duration: 0.6 } }
      : { opacity: 1, filter: "blur(0px)", y: 0, transition: { duration: 0.6, ease: EASE } },
  };
  return (
    <motion.div className={className} variants={variants}>
      {children}
    </motion.div>
  );
}

/* ── Word-by-word headline ── */
export function AnimatedHeadline({
  text,
  className,
  accentWords = [],
  accentClassName = "text-gradient",
  delay = 0,
}: {
  text: string;
  className?: string;
  accentWords?: string[];
  accentClassName?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  const words = text.split(" ");

  const isAccent = (w: string) =>
    accentWords.some(
      (a) => w.replace(/[.,!?]/g, "").toLowerCase() === a.replace(/[.,!?]/g, "").toLowerCase()
    );

  if (reduce) {
    return (
      <h1 className={className} style={{ display: "flex", flexWrap: "wrap", rowGap: "0.1em" }}>
        {words.map((w, i) => (
          <span
            key={i}
            style={{ marginRight: "0.28em" }}
            className={isAccent(w) ? accentClassName : undefined}
          >
            {w}
          </span>
        ))}
      </h1>
    );
  }

  return (
    <h1 className={className} style={{ display: "flex", flexWrap: "wrap", rowGap: "0.1em" }}>
      {words.map((w, i) => (
        <motion.span
          key={i}
          className={isAccent(w) ? accentClassName : undefined}
          style={{ display: "inline-block", marginRight: "0.28em" }}
          initial={{ filter: "blur(10px)", opacity: 0, y: 40 }}
          animate={{
            filter: ["blur(10px)", "blur(4px)", "blur(0px)"],
            opacity: [0, 0.5, 1],
            y: [40, -4, 0],
          }}
          transition={{
            duration: 0.7,
            times: [0, 0.5, 1],
            delay: delay + (i * 100) / 1000,
            ease: EASE,
          }}
        >
          {w}
        </motion.span>
      ))}
    </h1>
  );
}

/* ── CountUp ── */
export function CountUp({
  to,
  duration = 1.4,
  className,
}: {
  to: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [val, setVal] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setVal(to);
      return;
    }
    const controls = animate(0, to, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setVal(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, to, duration, reduce]);

  return (
    <span ref={ref} className={className}>
      {val}
    </span>
  );
}

/* ── LineReveal ── */
export function LineReveal({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      style={{ transformOrigin: "left" }}
      initial={reduce ? { opacity: 0 } : { scaleX: 0 }}
      whileInView={reduce ? { opacity: 1 } : { scaleX: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.9, ease: EASE_LINE }}
    />
  );
}

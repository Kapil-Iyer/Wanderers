"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play, RotateCcw } from "lucide-react";
import { prefersReducedMotion } from "@/lib/gsap";
import { CANVAS_H, CANVAS_W, MAGENTA, VIOLET } from "./primitives";
import {
  ChatScene,
  CreateScene,
  ExploreScene,
  FeedScene,
  LiveScene,
  LoginScene,
  MapScene,
  MomentScene,
  OtpScene,
  ProfileScene,
} from "./scenes";
import { SCENES, TOTAL_DURATION, formatClock, sceneAt, type SceneId } from "./script";

const SCENE_COMPONENTS: Record<SceneId, (props: { t: number }) => React.JSX.Element> = {
  login: LoginScene,
  otp: OtpScene,
  feed: FeedScene,
  create: CreateScene,
  map: MapScene,
  chat: ChatScene,
  live: LiveScene,
  moment: MomentScene,
  profile: ProfileScene,
  explore: ExploreScene,
};

/** Frozen frame used when the visitor prefers reduced motion. */
const STATIC_T = SCENES.find((s) => s.id === "feed")!.start + 3000;

/** Commit interval for the scene clock. See the note in the rAF loop. */
const RENDER_QUANTUM_MS = 50;

export function ProductWalkthrough() {
  const shellRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const [scale, setScale] = useState(1);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [reduced, setReduced] = useState(false);

  // Drives the loop without re-creating the rAF callback on every tick.
  const clockRef = useRef(0);
  const playingRef = useRef(true);
  const inViewRef = useRef(true);
  const quantumRef = useRef(-1);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setReduced(true);
      setPlaying(false);
      setT(STATIC_T);
      clockRef.current = STATIC_T;
    }
  }, []);

  /* ------------------------------------------------ scale canvas to fit */
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => setScale(el.clientWidth / CANVAS_W);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ------------------------------------------- pause when out of viewport */
  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry.isIntersecting;
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* ------------------------------------------------------------- the clock */
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(64, now - last); // clamp so a backgrounded tab can't jump
      last = now;
      if (playingRef.current && inViewRef.current) {
        clockRef.current = (clockRef.current + dt) % TOTAL_DURATION;
        // Re-render at ~20fps, not 60. `t` only drives discrete beat triggers,
        // typed text and counters — every smooth motion is owned by
        // framer-motion once mounted. Committing every frame instead saturates
        // the main thread badly enough to stall GSAP's hero entrance.
        const q = Math.floor(clockRef.current / RENDER_QUANTUM_MS);
        if (q !== quantumRef.current) {
          quantumRef.current = q;
          setT(clockRef.current);
        }
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  const jumpTo = useCallback((ms: number) => {
    clockRef.current = ms;
    quantumRef.current = Math.floor(ms / RENDER_QUANTUM_MS);
    setT(ms);
    setPlaying(true);
  }, []);

  const { scene, index, local } = sceneAt(t);
  const Scene = SCENE_COMPONENTS[scene.id];

  return (
    <div ref={shellRef} className="w-full">
      {/* ------------------------------------------------- browser window */}
      <div
        className="relative w-full overflow-hidden rounded-xl"
        style={{
          background: "linear-gradient(165deg, rgba(24,18,32,0.9), rgba(10,7,14,0.95))",
          border: "1px solid rgba(224,51,158,0.18)",
          boxShadow:
            "0 1px 0 rgba(255,255,255,0.06) inset, 0 30px 80px -24px rgba(0,0,0,0.85), 0 0 60px -20px rgba(139,92,246,0.35)",
        }}
      >
        {/* title bar */}
        <div
          className="flex items-center gap-2 px-3"
          style={{ height: 30, borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <span className="flex gap-1.5">
            {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
              <span key={c} className="block rounded-full" style={{ width: 7, height: 7, background: c, opacity: 0.85 }} />
            ))}
          </span>
          <div
            className="mx-auto flex items-center gap-1.5 rounded-full px-3"
            style={{
              height: 17,
              minWidth: 170,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.07)",
              fontSize: 9,
              color: "#A5A5B8",
            }}
          >
            <span style={{ width: 5, height: 5, borderRadius: 99, background: "#4ade80" }} />
            wanderers.space
          </div>
          <span style={{ width: 24 }} />
        </div>

        {/* stage */}
        <div ref={stageRef} className="relative w-full" style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}>
          <div
            className="absolute left-0 top-0 origin-top-left"
            style={{ width: CANVAS_W, height: CANVAS_H, transform: `scale(${scale})` }}
          >
            {/* Scenes stack and cross-fade. `mode="wait"` would blank the frame
                between every beat while the outgoing scene finishes exiting. */}
            <AnimatePresence initial={false}>
              <motion.div
                key={scene.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.34, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <Scene t={local} />
              </motion.div>
            </AnimatePresence>
          </div>

          {reduced && (
            <button
              type="button"
              onClick={() => {
                setReduced(false);
                setPlaying(true);
              }}
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: "rgba(6,4,10,0.55)" }}
            >
              <span
                className="flex items-center gap-2 rounded-full px-4 py-2 font-semibold"
                style={{
                  fontSize: 12,
                  background: `linear-gradient(135deg,#FF5A36,${MAGENTA} 50%,${VIOLET})`,
                  color: "#0a0a14",
                }}
              >
                <Play size={13} /> Play the walkthrough
              </span>
            </button>
          )}
        </div>
      </div>

      {/* --------------------------------------------------- chapter rail */}
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause walkthrough" : "Play walkthrough"}
          className="flex flex-shrink-0 items-center justify-center rounded-full transition-colors"
          style={{
            width: 24,
            height: 24,
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-primary)",
          }}
        >
          {playing && !reduced ? <Pause size={11} /> : <Play size={11} />}
        </button>
        <button
          type="button"
          onClick={() => jumpTo(0)}
          aria-label="Restart walkthrough"
          className="flex flex-shrink-0 items-center justify-center rounded-full transition-colors"
          style={{
            width: 24,
            height: 24,
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-primary)",
          }}
        >
          <RotateCcw size={11} />
        </button>

        <div className="flex flex-1 items-center gap-1">
          {SCENES.map((s, i) => {
            const done = i < index;
            const active = i === index;
            const p = active ? local / s.duration : done ? 1 : 0;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => jumpTo(s.start)}
                title={s.chapter}
                aria-label={`Jump to ${s.chapter}`}
                className="group relative flex-1 overflow-hidden rounded-full"
                style={{
                  height: 3,
                  flexGrow: s.duration,
                  background: "rgba(255,255,255,0.1)",
                }}
              >
                <span
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${p * 100}%`,
                    background: `linear-gradient(90deg,#FF5A36,${MAGENTA})`,
                  }}
                />
              </button>
            );
          })}
        </div>

        <span
          className="flex-shrink-0 tabular-nums"
          style={{ fontSize: 10, color: "var(--color-text-muted)" }}
        >
          {formatClock(t)} / {formatClock(TOTAL_DURATION)}
        </span>
      </div>

      {/* ------------------------------------------------------- caption */}
      <div className="mt-2.5 flex items-start gap-2.5">
        <span
          className="flex-shrink-0 font-bold tabular-nums"
          style={{
            fontSize: 10,
            letterSpacing: "0.1em",
            color: "var(--color-accent-mid)",
            paddingTop: 1,
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <span style={{ flexShrink: 0, color: "var(--color-text-muted)", fontSize: 11, paddingTop: 1 }}>/</span>
        <AnimatePresence mode="wait">
          <motion.p
            key={scene.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22 }}
            style={{ fontSize: 12, lineHeight: 1.45, color: "var(--color-text-secondary)" }}
          >
            <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
              {scene.chapter}.
            </span>{" "}
            {scene.caption}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

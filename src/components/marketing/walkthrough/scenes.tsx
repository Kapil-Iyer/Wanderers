"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  Camera,
  Check,
  ChevronDown,
  Clock,
  Compass,
  ExternalLink,
  Heart,
  Layers,
  MapPin,
  MessageCircle,
  Quote,
  Send,
  Share2,
  Smile,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import {
  APP_BG,
  AppTopBar,
  Avatar,
  CANVAS_H,
  CANVAS_W,
  CapacityBar,
  DemoCursor,
  EASE,
  EASE_OUT,
  Kicker,
  LivePill,
  MAGENTA,
  Orb,
  Typed,
  VIOLET,
  at,
  lerp,
  seg,
} from "./primitives";
import {
  CAST,
  CHAT_LINES,
  DEMO_ACTIVITY,
  DEMO_USER,
  EXPLORE_OFF_CAMPUS,
  EXPLORE_ON_CAMPUS,
  FEED_BUBBLES,
  JOIN_EVENTS,
  MAP_PINS,
  MOMENT_COMMENTS,
  NEW_PIN,
  OUTDOORS,
  WARM,
  type DemoBubble,
} from "./script";

const CONTENT_H = CANVAS_H - 46;

/* ================================================================ shared */

function Screen({
  children,
  bg = APP_BG,
}: {
  children: React.ReactNode;
  bg?: string;
}) {
  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: bg }}>
      {children}
    </div>
  );
}

/** The film-photograph composition used by the Moment scenes. Pure CSS. */
function FilmPhoto({ filter = "none", className = "" }: { filter?: string; className?: string }) {
  return (
    <div
      className={`relative h-full w-full overflow-hidden ${className}`}
      style={{ filter, background: "linear-gradient(#ffd89a, #ff9f4e 40%, #c25f2c 58%, #2b1a12)" }}
    >
      {/* sun */}
      <div
        className="absolute rounded-full"
        style={{
          width: "22%",
          aspectRatio: "1",
          left: "62%",
          top: "20%",
          background: "radial-gradient(circle, #fff3d6 0%, #ffcf8a 45%, rgba(255,180,110,0) 72%)",
        }}
      />
      {/* water band */}
      <div
        className="absolute inset-x-0"
        style={{
          top: "58%",
          bottom: 0,
          background: "linear-gradient(#b06a3c, #6a3f28 40%, #24160f)",
        }}
      />
      {/* reflection streak */}
      <div
        className="absolute"
        style={{
          left: "64%",
          top: "60%",
          width: "10%",
          height: "34%",
          background: "linear-gradient(rgba(255,220,170,0.55), rgba(255,200,140,0))",
          filter: "blur(2px)",
        }}
      />
      {/* treeline silhouette */}
      <div
        className="absolute inset-x-0"
        style={{
          top: "42%",
          height: "18%",
          background: "#2a1a14",
          clipPath:
            "polygon(0% 100%,0% 55%,6% 30%,11% 58%,17% 22%,23% 55%,30% 38%,37% 62%,44% 28%,51% 56%,58% 34%,66% 60%,73% 26%,80% 54%,88% 36%,95% 58%,100% 40%,100% 100%)",
        }}
      />
      {/* grain */}
      <div
        className="absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.5) 0.5px, transparent 0.5px), radial-gradient(rgba(0,0,0,0.5) 0.5px, transparent 0.5px)",
          backgroundSize: "3px 3px, 4px 4px",
          backgroundPosition: "0 0, 2px 1px",
        }}
      />
    </div>
  );
}

/** Compact recreation of BubbleCard's front face. */
function MiniBubbleCard({ b, width }: { b: DemoBubble; width: number }) {
  const pct = b.joined / b.max;
  const left = b.max - b.joined;
  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl"
      style={{
        width,
        background: "linear-gradient(165deg, #16142a 0%, #0c0a18 50%, #08070f 100%)",
        border: `1.5px solid ${b.from}30`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07), 0 8px 22px -10px rgba(0,0,0,0.7)",
      }}
    >
      <div
        className="relative flex items-center justify-center"
        style={{
          height: 50,
          background: `linear-gradient(135deg, ${b.from}26, ${b.to}12, transparent), #0a0806`,
        }}
      >
        <div
          className="absolute rounded-full"
          style={{
            width: 70,
            height: 70,
            bottom: -34,
            background: `radial-gradient(circle, ${b.from}33 0%, transparent 70%)`,
            filter: "blur(3px)",
          }}
        />
        <span style={{ fontSize: 22, filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.5))" }}>{b.emoji}</span>
        <div
          className="absolute font-bold uppercase"
          style={{
            top: 5,
            left: 6,
            fontSize: 6.5,
            letterSpacing: "0.12em",
            padding: "1.5px 5px",
            borderRadius: 99,
            background: "rgba(0,0,0,0.4)",
            color: b.accent,
            border: `1px solid ${b.accent}55`,
          }}
        >
          {b.category}
        </div>
        {left > 0 && left <= 3 && (
          <div
            className="absolute font-bold text-white"
            style={{
              top: 5,
              right: 6,
              fontSize: 6.5,
              padding: "1.5px 5px",
              borderRadius: 99,
              background: `linear-gradient(135deg, ${b.from}, ${b.to})`,
            }}
          >
            {left} left
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-2.5">
        <div
          className="font-display font-bold leading-tight"
          style={{ fontSize: 11, color: "#FAFAFA" }}
        >
          {b.title}
        </div>
        <div className="flex items-center gap-2" style={{ fontSize: 7.5, color: "#A5A5B8" }}>
          <span className="flex items-center gap-0.5">
            <MapPin size={7} style={{ color: b.accent }} /> {b.zone}
          </span>
          <span className="flex items-center gap-0.5">
            <Clock size={7} style={{ color: b.accent }} /> {b.startingIn}
          </span>
        </div>
        <CapacityBar pct={pct} from={b.from} to={b.to} height={2.5} />
        <div className="flex items-center justify-between" style={{ fontSize: 7.5, color: "#55556B" }}>
          <span className="flex items-center gap-0.5">
            <Users size={7} style={{ color: b.accent }} /> {b.joined}/{b.max} joined
          </span>
        </div>
        <div
          className="mt-auto flex items-center justify-center rounded-full font-bold"
          style={{
            height: 20,
            fontSize: 8.5,
            background: `linear-gradient(135deg, ${b.from}, ${b.to})`,
            color: "#0a0a14",
            boxShadow: `0 0 12px ${b.from}30`,
          }}
        >
          Join bubble
        </div>
      </div>
    </div>
  );
}

/** Recreation of LiveTickerCard. */
function TickerCard({ b, delay }: { b: DemoBubble; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.55, delay, ease: EASE }}
      className="flex items-center gap-2.5 rounded-xl p-2"
      style={{
        background: "rgba(10,9,8,0.72)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderLeft: `3px solid ${b.from}`,
        boxShadow: `inset 4px 0 16px -8px ${b.from}55`,
      }}
    >
      <span style={{ fontSize: 16 }}>{b.emoji}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold" style={{ fontSize: 10, color: "#FAFAFA" }}>
          {b.title}
        </div>
        <div className="mt-0.5 flex items-center gap-2" style={{ fontSize: 7.5, color: "#A5A5B8" }}>
          <span className="flex items-center gap-0.5">
            <MapPin size={7} style={{ color: b.accent }} /> {b.zone}
          </span>
          <span className="flex items-center gap-0.5">
            <Clock size={7} style={{ color: b.accent }} /> {b.startingIn}
          </span>
          <span className="flex items-center gap-0.5">
            <Users size={7} style={{ color: b.accent }} /> {b.joined}/{b.max}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ================================================================ 1. login */

export function LoginScene({ t }: { t: number }) {
  const clicked = at(t, 4700);
  return (
    <Screen bg="radial-gradient(1200px 700px at 50% 25%, #1c0f1a 0%, #100812 58%, #0b0710 100%)">
      <Orb size={260} color="rgba(224,51,158,0.10)" top={-60} left={-50} />
      <Orb size={240} color="rgba(139,92,246,0.10)" top={230} left={500} />

      <div className="flex h-full items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="rounded-2xl p-6"
          style={{
            width: 320,
            background: "rgba(10,9,8,0.72)",
            border: "1px solid rgba(224,51,158,0.16)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 20px 60px -18px rgba(0,0,0,0.8)",
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center rounded-lg"
              style={{
                width: 26,
                height: 26,
                fontSize: 12,
                background: `linear-gradient(140deg, ${MAGENTA}, ${VIOLET})`,
              }}
            >
              📍
            </div>
            <span
              className="font-display font-bold"
              style={{
                fontSize: 14,
                background: `linear-gradient(135deg,#FF5A36,${MAGENTA} 50%,${VIOLET})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Wanderers
            </span>
          </div>

          <div className="mt-5 font-display font-bold" style={{ fontSize: 20, color: "#FAFAFA" }}>
            Welcome back.
          </div>
          <div className="mt-1.5" style={{ fontSize: 10, color: "#A5A5B8" }}>
            University of Waterloo students only. We&apos;ll email you a one-time code.
          </div>

          <div className="mt-5">
            <div className="mb-1.5 font-semibold" style={{ fontSize: 8, color: "#55556B" }}>
              UWATERLOO EMAIL
            </div>
            <div
              className="flex items-center rounded-xl px-3"
              style={{
                height: 34,
                background: "rgba(255,255,255,0.05)",
                border: at(t, 700)
                  ? "1px solid rgba(224,51,158,0.45)"
                  : "1px solid rgba(255,255,255,0.1)",
                boxShadow: at(t, 700) ? "0 0 0 3px rgba(224,51,158,0.12)" : "none",
                transition: "border 240ms, box-shadow 240ms",
              }}
            >
              <span style={{ fontSize: 11, color: "#FAFAFA" }}>
                <Typed text={DEMO_USER.email} t={t} from={800} to={3300} caret />
              </span>
            </div>
          </div>

          <motion.div
            animate={clicked ? { scale: 0.97 } : { scale: 1 }}
            transition={{ duration: 0.14 }}
            className="mt-4 flex items-center justify-center rounded-full font-bold"
            style={{
              height: 34,
              fontSize: 11,
              background: `linear-gradient(135deg,#FF5A36,${MAGENTA} 50%,${VIOLET})`,
              color: "#0a0a14",
              boxShadow: "0 14px 40px -14px rgba(224,51,158,0.6)",
            }}
          >
            {clicked ? "Sending code…" : "Send me a code"}
          </motion.div>

          <div className="mt-3 text-center" style={{ fontSize: 8.5, color: "#55556B" }}>
            Remember this device for 7 days
          </div>
        </motion.div>
      </div>

      <DemoCursor
        x={at(t, 3700) ? 352 : 300}
        y={at(t, 3700) ? 322 : 214}
        clicking={at(t, 4600) && !at(t, 5200)}
      />
    </Screen>
  );
}

/* ================================================================ 2. otp */

export function OtpScene({ t }: { t: number }) {
  const digits = DEMO_USER.otp.split("");
  const filled = Math.min(digits.length, Math.floor(seg(t, 700, 3500) * digits.length + 0.001));
  const verified = at(t, 4600);

  return (
    <Screen bg="radial-gradient(1200px 700px at 50% 25%, #1c0f1a 0%, #100812 58%, #0b0710 100%)">
      <Orb size={260} color="rgba(224,51,158,0.10)" top={-60} left={-50} />
      <Orb size={240} color="rgba(139,92,246,0.10)" top={230} left={500} />

      <div className="flex h-full items-center justify-center">
        <div
          className="rounded-2xl p-6 text-center"
          style={{
            width: 330,
            background: "rgba(10,9,8,0.72)",
            border: "1px solid rgba(224,51,158,0.16)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 20px 60px -18px rgba(0,0,0,0.8)",
          }}
        >
          <div style={{ fontSize: 24 }}>📬</div>
          <div className="mt-2 font-display font-bold" style={{ fontSize: 19, color: "#FAFAFA" }}>
            Check your inbox.
          </div>
          <div className="mt-1.5" style={{ fontSize: 10, color: "#A5A5B8" }}>
            We sent a 6-digit code to{" "}
            <span style={{ color: "#ffb56b" }}>{DEMO_USER.email}</span>
          </div>

          <div className="mt-5 flex items-center justify-center gap-2">
            {digits.map((d, i) => {
              const isFilled = i < filled;
              const isNext = i === filled && !verified;
              return (
                <div
                  key={i}
                  className="flex items-center justify-center rounded-lg font-bold"
                  style={{
                    width: 34,
                    height: 42,
                    fontSize: 17,
                    color: "#FAFAFA",
                    background: "rgba(255,255,255,0.045)",
                    border: isNext
                      ? "1px solid rgba(224,51,158,0.55)"
                      : isFilled
                        ? "1px solid rgba(224,51,158,0.3)"
                        : "1px solid rgba(255,255,255,0.1)",
                    boxShadow: isNext ? "0 0 0 3px rgba(224,51,158,0.14)" : "none",
                    transition: "border 200ms, box-shadow 200ms",
                  }}
                >
                  {isFilled && (
                    <motion.span
                      initial={{ opacity: 0, y: 6, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {d}
                    </motion.span>
                  )}
                </div>
              );
            })}
          </div>

          <motion.div
            animate={{ scale: at(t, 4100) && !verified ? 0.97 : 1 }}
            transition={{ duration: 0.14 }}
            className="mt-5 flex items-center justify-center gap-1.5 rounded-full font-bold"
            style={{
              height: 34,
              fontSize: 11,
              background: verified
                ? "rgba(74,222,128,0.14)"
                : `linear-gradient(135deg,#FF5A36,${MAGENTA} 50%,${VIOLET})`,
              border: verified ? "1px solid rgba(74,222,128,0.4)" : "none",
              color: verified ? "#4ade80" : "#0a0a14",
            }}
          >
            {verified ? (
              <>
                <Check size={12} /> Verified — welcome, Kapil
              </>
            ) : (
              "Verify and continue"
            )}
          </motion.div>

          <div className="mt-3" style={{ fontSize: 8.5, color: "#55556B" }}>
            Didn&apos;t get it? Resend in 0:24
          </div>
        </div>
      </div>

      <DemoCursor
        x={at(t, 3700) ? 352 : 300}
        y={at(t, 3700) ? 330 : 250}
        clicking={at(t, 4100) && !at(t, 4700)}
        visible={!at(t, 5200)}
      />
    </Screen>
  );
}

/* ================================================================ 3. feed */

export function FeedScene({ t }: { t: number }) {
  return (
    <Screen>
      <AppTopBar active="Home" />
      <div className="relative" style={{ height: CONTENT_H }}>
        <Orb size={230} color="rgba(255,122,26,0.10)" top={-40} left={-40} />
        <Orb size={210} color="rgba(255,181,107,0.07)" top={180} left={470} />

        <div className="relative flex h-full flex-col px-4 pt-3.5">
          <div className="flex gap-5">
            <div style={{ width: 350 }}>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <LivePill />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 14, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.7, delay: 0.12, ease: EASE }}
                className="mt-2.5 font-display font-bold leading-[1.02]"
                style={{ fontSize: 34, color: "#FAFAFA", letterSpacing: "-0.01em" }}
              >
                Campus is{" "}
                <span
                  style={{
                    color: "#fff1ea",
                    textShadow:
                      "1px 1px 0 #ffcbb0, 2px 2px 0 #ffcbb0, 3px 3px 0 #ff8a5c, 4px 4px 0 #ff8a5c, 5px 5px 0 #FF5A36, 6px 6px 0 #b3236f, 8px 8px 14px rgba(0,0,0,0.6)",
                  }}
                >
                  alive.
                </span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-2.5 leading-relaxed"
                style={{ fontSize: 10.5, color: "#A5A5B8", maxWidth: 260 }}
              >
                Real students, real moments happening within walking distance.
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="mt-3.5 flex items-center gap-5"
              >
                <div>
                  <div className="font-bold" style={{ fontSize: 21, color: "#FAFAFA" }}>
                    {Math.round(lerp(0, 12, seg(t, 500, 1600)))}
                  </div>
                  <div className="font-semibold uppercase" style={{ fontSize: 7, letterSpacing: "0.14em", color: "#55556B" }}>
                    bubbles active
                  </div>
                </div>
                <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.1)" }} />
                <div>
                  <div className="font-bold" style={{ fontSize: 21, color: "#FAFAFA" }}>
                    {Math.round(lerp(0, 48, seg(t, 500, 1900)))}
                  </div>
                  <div className="font-semibold uppercase" style={{ fontSize: 7, letterSpacing: "0.14em", color: "#55556B" }}>
                    wanderers out
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="flex-1">
              <div className="mb-2 flex items-center gap-1.5">
                <span className="relative flex" style={{ width: 5, height: 5 }}>
                  <span
                    className="absolute inline-flex h-full w-full animate-ping rounded-full"
                    style={{ background: WARM.from, opacity: 0.6 }}
                  />
                  <span className="relative rounded-full" style={{ width: 5, height: 5, background: WARM.from }} />
                </span>
                <Kicker>What&apos;s happening</Kicker>
              </div>
              <div className="flex flex-col gap-2">
                {FEED_BUBBLES.map((b, i) => (
                  <TickerCard key={b.title} b={b} delay={0.5 + i * 0.12} />
                ))}
              </div>
            </div>
          </div>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.7, delay: 0.9, ease: EASE }}
            className="mt-3.5"
            style={{ height: 1, background: "rgba(255,255,255,0.08)", originX: 0 }}
          />

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.05 }}
            className="mt-3"
          >
            <Kicker>Within walking distance</Kicker>
            <div className="mt-1.5 flex items-center gap-1.5">
              {["All", "Happening Now", "Sports", "Study", "Casual"].map((c, i) => (
                <div
                  key={c}
                  className="rounded-full font-semibold"
                  style={{
                    fontSize: 8,
                    padding: "3px 8px",
                    background:
                      i === 0 ? `linear-gradient(135deg,${WARM.from},${WARM.to})` : "rgba(10,7,5,0.6)",
                    color: i === 0 ? WARM.ink : "#A5A5B8",
                    border: i === 0 ? "none" : "1px solid rgba(255,255,255,0.14)",
                    boxShadow: i === 0 ? "0 0 12px rgba(255,122,26,0.3)" : "none",
                  }}
                >
                  {c}
                </div>
              ))}
            </div>
          </motion.div>

          <div className="mt-2.5 flex gap-2.5">
            {FEED_BUBBLES.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.2 + i * 0.1, ease: EASE }}
              >
                <MiniBubbleCard b={b} width={210} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </Screen>
  );
}

/* ================================================================ 4. create */

const PLAN_TEXT = "film photo walk along laurel creek around golden hour, bringing a spare camera";

export function CreateScene({ t }: { t: number }) {
  const parsing = at(t, 5800) && !at(t, 7400);
  const parsed = at(t, 7400);
  const created = at(t, 11300);

  const fields = [
    { label: "Activity", value: `${DEMO_ACTIVITY.emoji}  ${DEMO_ACTIVITY.title}`, delay: 0 },
    { label: "Category", value: DEMO_ACTIVITY.category, delay: 0.14 },
    { label: "Zone", value: DEMO_ACTIVITY.zone, delay: 0.28 },
    { label: "Starts", value: DEMO_ACTIVITY.startingIn, delay: 0.42 },
    { label: "Spots", value: `${DEMO_ACTIVITY.maxPeople} wanderers`, delay: 0.56 },
  ];

  return (
    <Screen>
      <AppTopBar active="Home" highlightStart={!at(t, 900)} />
      <div className="relative" style={{ height: CONTENT_H }}>
        <div className="absolute inset-0" style={{ background: "rgba(4,3,6,0.72)", backdropFilter: "blur(3px)" }} />

        <div className="relative flex h-full items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 22, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
            className="rounded-2xl p-4"
            style={{
              width: 420,
              background: "linear-gradient(165deg, #1a1510 0%, #100c09 55%, #0a0806 100%)",
              border: "1px solid rgba(255,181,107,0.2)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 22px 60px -18px rgba(0,0,0,0.85)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="font-display font-bold" style={{ fontSize: 15, color: "#FAFAFA" }}>
                Start something
              </div>
              <div
                className="flex items-center gap-1 rounded-full px-2 py-1 font-bold uppercase"
                style={{
                  fontSize: 7,
                  letterSpacing: "0.12em",
                  background: WARM.tint,
                  border: `1px solid ${WARM.edge}`,
                  color: WARM.to,
                }}
              >
                <Sparkles size={7} /> AI assist
              </div>
            </div>

            <div className="mt-1" style={{ fontSize: 9, color: "#A5A5B8" }}>
              Describe it however you&apos;d text a friend.
            </div>

            <div
              className="mt-3 rounded-xl p-2.5"
              style={{
                minHeight: 52,
                background: "rgba(255,255,255,0.045)",
                border: at(t, 800) ? "1px solid rgba(255,122,26,0.45)" : "1px solid rgba(255,255,255,0.1)",
                boxShadow: at(t, 800) ? "0 0 0 3px rgba(255,122,26,0.1)" : "none",
                transition: "border 240ms, box-shadow 240ms",
              }}
            >
              <span style={{ fontSize: 10.5, color: "#FAFAFA", lineHeight: 1.5 }}>
                <Typed text={PLAN_TEXT} t={t} from={900} to={5600} caret />
              </span>
            </div>

            <div className="mt-3" style={{ minHeight: 132 }}>
              <AnimatePresence mode="wait">
                {parsing && (
                  <motion.div
                    key="parsing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 py-3"
                    style={{ fontSize: 10, color: WARM.to }}
                  >
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="inline-flex"
                    >
                      <Sparkles size={11} />
                    </motion.span>
                    Reading your plan…
                  </motion.div>
                )}

                {parsed && (
                  <motion.div key="parsed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-1.5">
                    {fields.map((f) => (
                      <motion.div
                        key={f.label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.35, delay: f.delay, ease: EASE }}
                        className="flex items-center justify-between rounded-lg px-2.5"
                        style={{
                          height: 22,
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <span className="font-semibold uppercase" style={{ fontSize: 7, letterSpacing: "0.12em", color: "#55556B" }}>
                          {f.label}
                        </span>
                        <span className="flex items-center gap-1 font-semibold" style={{ fontSize: 9.5, color: "#FAFAFA" }}>
                          {f.value}
                          <Check size={8} style={{ color: "#4ade80" }} />
                        </span>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.div
              animate={{ scale: at(t, 10900) && !created ? 0.97 : 1 }}
              transition={{ duration: 0.14 }}
              className="mt-1 flex items-center justify-center gap-1.5 rounded-full font-bold"
              style={{
                height: 32,
                fontSize: 11,
                background: created
                  ? "rgba(74,222,128,0.14)"
                  : `linear-gradient(135deg,${WARM.from},${WARM.to})`,
                border: created ? "1px solid rgba(74,222,128,0.4)" : "none",
                color: created ? "#4ade80" : WARM.ink,
                boxShadow: created ? "none" : "0 10px 30px -12px rgba(255,122,26,0.6)",
                opacity: parsed ? 1 : 0.4,
              }}
            >
              {created ? (
                <>
                  <Check size={12} /> Your bubble is live
                </>
              ) : (
                "Create bubble"
              )}
            </motion.div>
          </motion.div>
        </div>

        <DemoCursor
          x={at(t, 9800) ? 350 : 260}
          y={at(t, 9800) ? 322 : 150}
          clicking={at(t, 10900) && !at(t, 11500)}
          visible={!at(t, 12200)}
        />
      </div>
    </Screen>
  );
}

/* ================================================================ 5. map */

function MapPill({
  emoji,
  title,
  joined,
  max,
  accent,
  highlight = false,
}: {
  emoji: string;
  title: string;
  joined: number;
  max: number;
  accent: string;
  highlight?: boolean;
}) {
  return (
    <div className="relative flex flex-col items-center">
      <div
        className="overflow-hidden rounded-[14px]"
        style={{
          minWidth: 66,
          maxWidth: 108,
          background: "rgba(15,17,35,0.88)",
          border: "1px solid rgba(255,255,255,0.09)",
          backdropFilter: "blur(10px)",
          boxShadow: highlight
            ? `0 0 18px ${accent}88, 0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px ${accent}66`
            : "0 4px 14px rgba(0,0,0,0.45)",
        }}
      >
        <div style={{ height: 3, background: accent }} />
        <div className="flex items-center gap-1 px-1.5 py-1">
          <span style={{ fontSize: 11 }}>{emoji}</span>
          <span className="truncate font-semibold text-white" style={{ fontSize: 8 }}>
            {title}
          </span>
          <span
            className="rounded-full font-semibold tabular-nums"
            style={{ fontSize: 7, padding: "0.5px 3.5px", background: `${accent}33`, color: accent }}
          >
            {joined}/{max}
          </span>
        </div>
      </div>
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: "5px solid transparent",
          borderRight: "5px solid transparent",
          borderTop: "5px solid rgba(15,17,35,0.88)",
          filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.3))",
        }}
      />
    </div>
  );
}

function MapCanvas({ children }: { children?: React.ReactNode }) {
  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: "#0a0a15" }}>
      {/* park */}
      <div
        className="absolute rounded-[40%]"
        style={{ left: "8%", top: "30%", width: "34%", height: "48%", background: "rgba(34,197,94,0.09)" }}
      />
      {/* creek */}
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        <path
          d="M6 22 C 20 34, 14 50, 28 60 S 44 76, 40 96"
          fill="none"
          stroke="rgba(59,130,246,0.30)"
          strokeWidth="1.6"
        />
        {[
          "M0 26 H100",
          "M0 58 H100",
          "M0 84 H100",
          "M22 0 V100",
          "M56 0 V100",
          "M82 0 V100",
        ].map((d, i) => (
          <path key={i} d={d} fill="none" stroke="rgba(255,255,255,0.055)" strokeWidth="0.7" />
        ))}
        <path
          d="M0 40 C 30 36, 62 48, 100 42"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1.1"
        />
      </svg>
      {/* campus boundary */}
      <div
        className="absolute"
        style={{
          left: "16%",
          top: "12%",
          width: "62%",
          height: "68%",
          border: "1px dashed rgba(99,102,241,0.35)",
          background: "rgba(99,102,241,0.05)",
          borderRadius: 10,
        }}
      />
      <div
        className="absolute font-bold uppercase"
        style={{ left: "17.5%", top: "13.5%", fontSize: 7, letterSpacing: "0.14em", color: "rgba(165,180,252,0.7)" }}
      >
        University of Waterloo
      </div>
      {children}
    </div>
  );
}

function MapChrome({ t }: { t: number }) {
  return (
    <>
      <div
        className="flex flex-shrink-0 items-center gap-2 px-3"
        style={{ height: 34, background: "rgba(15,17,35,0.92)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <ArrowLeft size={11} style={{ color: "#A5A5B8" }} />
        <span className="font-bold text-white" style={{ fontSize: 12 }}>
          Discover
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <div
            className="flex items-center gap-1 rounded-lg px-2 font-semibold"
            style={{
              height: 20,
              fontSize: 8,
              color: "#A5A5B8",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Layers size={8} /> Satellite
          </div>
        </div>
      </div>

      <div
        className="flex flex-shrink-0 items-center gap-1.5 px-3"
        style={{ height: 28, background: "rgba(15,17,35,0.7)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className="rounded-full font-semibold"
          style={{ fontSize: 7.5, padding: "2.5px 7px", background: "#6366f1", color: "#fff", boxShadow: "0 0 8px rgba(99,102,241,0.4)" }}
        >
          🏫 On campus
        </div>
        <div
          className="rounded-full font-semibold"
          style={{ fontSize: 7.5, padding: "2.5px 7px", color: "#A5A5B8", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          🌍 Off campus
        </div>
        <div style={{ width: 1, height: 12, background: "rgba(255,255,255,0.1)" }} />
        {["All", "🏀 Sports", "📚 Study", "🎵 Music"].map((c, i) => (
          <div
            key={c}
            className="rounded-full font-semibold"
            style={{
              fontSize: 7.5,
              padding: "2.5px 7px",
              background: i === 0 ? "rgba(255,255,255,0.12)" : "transparent",
              color: i === 0 ? "#fff" : "#A5A5B8",
              border: i === 0 ? "none" : "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {c}
          </div>
        ))}
        {at(t, 700) && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="ml-auto tabular-nums"
            style={{ fontSize: 7.5, color: "#55556B" }}
          >
            5 events · Waterloo, ON
          </motion.span>
        )}
      </div>
    </>
  );
}

export function MapScene({ t }: { t: number }) {
  const dropped = at(t, 2600);
  const showCard = at(t, 4400);
  const mapH = CONTENT_H - 62;

  return (
    <Screen bg="#0a0a15">
      <div className="flex h-full flex-col">
        <MapChrome t={t} />
        <div className="relative flex-1">
          <MapCanvas>
            {MAP_PINS.map((p, i) => (
              <motion.div
                key={p.title}
                className="absolute"
                style={{ left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%,-100%)" }}
                initial={{ opacity: 0, y: -8, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.45, delay: 0.2 + i * 0.12, ease: EASE_OUT }}
              >
                <motion.div
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: (i % 5) * 0.4, ease: "easeInOut" }}
                >
                  <MapPill {...p} />
                </motion.div>
              </motion.div>
            ))}

            {dropped && (
              <>
                <motion.div
                  className="absolute rounded-full"
                  style={{ left: `${NEW_PIN.x}%`, top: `${NEW_PIN.y}%`, translateX: "-50%", translateY: "-50%" }}
                  initial={{ width: 8, height: 8, opacity: 0.85 }}
                  animate={{ width: 120, height: 120, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                >
                  <div
                    className="h-full w-full rounded-full"
                    style={{ border: `1.5px solid ${OUTDOORS.accent}`, background: `${OUTDOORS.accent}18` }}
                  />
                </motion.div>

                <motion.div
                  className="absolute z-20"
                  style={{ left: `${NEW_PIN.x}%`, top: `${NEW_PIN.y}%`, transform: "translate(-50%,-100%)" }}
                  initial={{ opacity: 0, y: -34, scale: 0.7 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                >
                  {showCard && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.94 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.4, ease: EASE_OUT }}
                      className="absolute overflow-hidden rounded-xl"
                      style={{
                        bottom: "100%",
                        left: "50%",
                        marginBottom: 6,
                        width: 208,
                        transform: "translateX(-50%)",
                        background: "rgba(15,17,35,0.95)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        boxShadow: `0 12px 40px -8px ${OUTDOORS.from}66, 0 18px 50px -14px rgba(0,0,0,0.8)`,
                      }}
                    >
                      <div style={{ height: 3, background: OUTDOORS.accent }} />
                      <div className="px-3 pb-3 pt-2.5">
                        <div className="flex items-center gap-1.5">
                          <span style={{ fontSize: 15 }}>{DEMO_ACTIVITY.emoji}</span>
                          <span className="font-semibold text-white" style={{ fontSize: 10.5 }}>
                            {DEMO_ACTIVITY.title}
                          </span>
                        </div>
                        <div className="mt-1.5 flex flex-col gap-1" style={{ fontSize: 8, color: "rgba(255,255,255,0.55)" }}>
                          <span className="flex items-center gap-1">
                            <MapPin size={8} /> {DEMO_ACTIVITY.zone} · off campus
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={8} /> {DEMO_ACTIVITY.startingIn} · ~1.2 km
                          </span>
                        </div>

                        <div className="mt-2 flex items-center gap-1.5">
                          <div className="flex" style={{ marginRight: 2 }}>
                            {["🦊", "🐻", "🐼"].map((e, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-center rounded-full"
                                style={{
                                  width: 15,
                                  height: 15,
                                  fontSize: 8,
                                  marginLeft: i === 0 ? 0 : -5,
                                  background: "rgba(255,255,255,0.1)",
                                  border: "1px solid #0f1117",
                                }}
                              >
                                {e}
                              </div>
                            ))}
                          </div>
                          <span
                            className="rounded-full font-semibold"
                            style={{ fontSize: 7, padding: "1px 5px", background: `${OUTDOORS.accent}22`, color: OUTDOORS.accent }}
                          >
                            1/6 spots
                          </span>
                        </div>

                        <div className="mt-2">
                          <CapacityBar pct={1 / 6} from={OUTDOORS.from} to={OUTDOORS.to} height={2} />
                        </div>

                        <div
                          className="mt-2.5 flex items-center justify-center rounded-lg font-bold text-white"
                          style={{
                            height: 22,
                            fontSize: 9.5,
                            background: `linear-gradient(135deg, ${OUTDOORS.from}, ${OUTDOORS.to})`,
                          }}
                        >
                          Open chat
                        </div>
                        <div
                          className="mt-1.5 flex items-center justify-center gap-1"
                          style={{ fontSize: 7.5, color: "#6366f1" }}
                        >
                          Open in Google Maps <ExternalLink size={7} />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <MapPill
                    emoji={DEMO_ACTIVITY.emoji}
                    title="Film walk"
                    joined={1}
                    max={6}
                    accent={OUTDOORS.accent}
                    highlight
                  />
                </motion.div>
              </>
            )}

            {dropped && !showCard && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute rounded-full px-2.5 py-1 font-bold uppercase"
                style={{
                  left: `${NEW_PIN.x}%`,
                  top: `${NEW_PIN.y + 8}%`,
                  transform: "translateX(-50%)",
                  fontSize: 7,
                  letterSpacing: "0.12em",
                  background: "rgba(16,185,129,0.16)",
                  border: `1px solid ${OUTDOORS.accent}66`,
                  color: OUTDOORS.accent,
                }}
              >
                Your bubble is on the map
              </motion.div>
            )}

            <div
              className="absolute flex items-center justify-center rounded-full"
              style={{
                left: 10,
                bottom: 10,
                width: 26,
                height: 26,
                background: "rgba(15,17,35,0.85)",
                border: "1px solid rgba(255,255,255,0.09)",
              }}
            >
              <Compass size={11} style={{ color: "#A5A5B8" }} />
            </div>
          </MapCanvas>

          <DemoCursor
            x={lerp(240, (NEW_PIN.x / 100) * CANVAS_W, seg(t, 3300, 4300))}
            y={lerp(120, (NEW_PIN.y / 100) * mapH - 6, seg(t, 3300, 4300))}
            clicking={at(t, 4250) && !at(t, 4850)}
            visible={at(t, 3100) && !at(t, 6000)}
          />
        </div>
      </div>
    </Screen>
  );
}

/* ================================================================ 6. chat */

export function ChatScene({ t }: { t: number }) {
  const joined = JOIN_EVENTS.filter((j) => at(t, j.at));
  const members = 1 + joined.length;
  const lines = CHAT_LINES.filter((l) => at(t, l.at));
  const visible = lines.slice(-5);
  const latestJoin = [...joined].reverse().find((j) => t - j.at < 2400);

  return (
    <Screen>
      <AppTopBar active="Messages" title={DEMO_ACTIVITY.title} notifications={joined.length} />
      <div className="relative flex items-center justify-center" style={{ height: CONTENT_H }}>
        <Orb size={200} color="rgba(255,122,26,0.08)" top={-30} left={-30} />

        <div
          className="relative overflow-hidden"
          style={{
            width: 470,
            height: 340,
            borderRadius: 16,
            background:
              "linear-gradient(145deg,#2a221a,#14100c 22%,#0c0907 78%,#080604) padding-box, linear-gradient(145deg,#9a7b55,#4a3828 28%,#1a140f 62%,#6b5338) border-box",
            border: "3px solid transparent",
            boxShadow:
              "0 1px 0 rgba(255,210,160,0.18) inset, 3px 3px 0 rgba(255,255,255,0.06) inset, -3px -3px 0 rgba(0,0,0,0.55) inset, 0 18px 48px -12px rgba(0,0,0,0.75)",
          }}
        >
          <div
            className="pointer-events-none absolute"
            style={{ inset: 4, borderRadius: 12, border: "1px solid rgba(201,160,106,0.28)" }}
          />

          <div className="absolute flex flex-col overflow-hidden" style={{ inset: 5, borderRadius: 11 }}>
            {/* chat header */}
            <div
              className="flex flex-shrink-0 items-center gap-2 px-2.5"
              style={{
                height: 38,
                background: "rgba(18,13,10,0.96)",
                borderBottom: "1px solid rgba(255,122,26,0.14)",
              }}
            >
              <ArrowLeft size={11} style={{ color: "#A5A5B8" }} />
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 24,
                  height: 24,
                  fontSize: 12,
                  background: "rgba(255,122,26,0.15)",
                  border: "1px solid rgba(255,122,26,0.25)",
                }}
              >
                {DEMO_ACTIVITY.emoji}
              </div>
              <div className="min-w-0">
                <div className="truncate font-semibold" style={{ fontSize: 10.5, color: "#FAFAFA" }}>
                  {DEMO_ACTIVITY.title}
                </div>
                <motion.div key={members} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} style={{ fontSize: 8, color: "#A5A5B8" }}>
                  {members} member{members === 1 ? "" : "s"} · {DEMO_ACTIVITY.zone}
                </motion.div>
              </div>
              <div className="ml-auto flex" style={{ marginRight: 2 }}>
                {joined.map((j, i) => (
                  <motion.div
                    key={j.who}
                    initial={{ opacity: 0, scale: 0.5, x: 8 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ type: "spring", stiffness: 320, damping: 22 }}
                    style={{ marginLeft: i === 0 ? 0 : -6 }}
                  >
                    <Avatar
                      initials={CAST[j.who].initials}
                      size={18}
                      tint={CAST[j.who].tint}
                      accent={CAST[j.who].accent}
                      ring="#14100c"
                    />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* messages */}
            <div
              className="relative flex flex-1 flex-col justify-end gap-2 overflow-hidden px-2.5 py-2.5"
              style={{ background: "rgba(12,9,7,0.94)" }}
            >
              <AnimatePresence>
                {latestJoin && (
                  <motion.div
                    key={`join-${latestJoin.who}`}
                    initial={{ opacity: 0, y: -8, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute left-1/2 flex items-center gap-1.5 rounded-full px-2.5 py-1"
                    style={{
                      top: 6,
                      transform: "translateX(-50%)",
                      fontSize: 8,
                      background: "rgba(255,122,26,0.14)",
                      border: `1px solid ${WARM.edge}`,
                      color: WARM.to,
                      zIndex: 5,
                    }}
                  >
                    <Users size={8} /> {CAST[latestJoin.who].name} joined the bubble
                  </motion.div>
                )}
              </AnimatePresence>

              {visible.map((l) => {
                const mine = l.who === "me";
                const person = mine ? null : CAST[l.who as number];
                return (
                  <motion.div
                    key={l.at}
                    layout
                    initial={{ opacity: 0, y: 12, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.35, ease: EASE_OUT }}
                    className="flex items-end gap-1.5"
                    style={{ justifyContent: mine ? "flex-end" : "flex-start" }}
                  >
                    {!mine && person && (
                      <Avatar initials={person.initials} size={18} tint={person.tint} accent={person.accent} />
                    )}
                    <div style={{ maxWidth: "76%" }}>
                      <div
                        className="mb-0.5 px-1 font-semibold"
                        style={{
                          fontSize: 7.5,
                          color: mine ? "rgba(255,181,107,0.85)" : "#A5A5B8",
                          textAlign: mine ? "right" : "left",
                        }}
                      >
                        {mine ? "You" : person?.name}
                      </div>
                      <div
                        style={{
                          padding: "5px 8px",
                          fontSize: 9.5,
                          lineHeight: 1.45,
                          borderRadius: 12,
                          borderBottomRightRadius: mine ? 4 : 12,
                          borderBottomLeftRadius: mine ? 12 : 4,
                          background: mine
                            ? "linear-gradient(145deg,#ff9a4a 0%,#ff7a1a 45%,#e56a0f 100%)"
                            : "linear-gradient(165deg, rgba(42,34,28,0.95), rgba(22,17,13,0.98))",
                          color: mine ? WARM.ink : "#FAFAFA",
                          border: mine
                            ? "1px solid rgba(255,210,160,0.35)"
                            : "1px solid rgba(255,181,107,0.14)",
                          boxShadow: mine
                            ? "0 1px 0 rgba(255,255,255,0.35) inset, 0 6px 16px -4px rgba(255,122,26,0.4)"
                            : "none",
                        }}
                      >
                        {l.text}
                        <div style={{ fontSize: 6.5, marginTop: 2, opacity: 0.6, textAlign: "right" }}>{l.time}</div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* composer */}
            <div
              className="flex flex-shrink-0 items-center gap-1.5 px-2.5"
              style={{
                height: 38,
                background: "rgba(16,12,9,0.98)",
                borderTop: "1px solid rgba(255,122,26,0.14)",
              }}
            >
              <div
                className="flex items-center justify-center rounded-full"
                style={{ width: 22, height: 22, background: "rgba(255,255,255,0.05)" }}
              >
                <Smile size={11} style={{ color: "#A5A5B8" }} />
              </div>
              <div
                className="flex flex-1 items-center rounded-xl px-2.5"
                style={{
                  height: 24,
                  fontSize: 9,
                  color: "#55556B",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                Message…
              </div>
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 22,
                  height: 22,
                  background: `linear-gradient(135deg,${WARM.from},${WARM.to})`,
                  boxShadow: "0 4px 12px rgba(255,122,26,0.35)",
                }}
              >
                <Send size={10} style={{ color: WARM.ink }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Screen>
  );
}

/* ================================================================ 7. live */

export function LiveScene({ t }: { t: number }) {
  const p = seg(t, 400, 6200);
  // 7:15 PM (1155 min) → 8:30 PM (1230 min)
  const minutes = Math.round(lerp(1155, 1230, p));
  const hh24 = Math.floor(minutes / 60);
  const mm = minutes % 60;
  const clock = `${hh24 > 12 ? hh24 - 12 : hh24}:${mm.toString().padStart(2, "0")} PM`;

  const skyTop = ["#3f7bb5", "#7b6fae", "#b56a54", "#5a2f4d", "#1d1830"];
  const skyBot = ["#ffc678", "#ff9a4a", "#e05f2c", "#6b2436", "#140f22"];
  // Ease the ramp so most of the shot sits in golden hour instead of racing
  // to a flat dusk mauve.
  const pSky = Math.pow(p, 1.7);
  const idx = Math.min(skyTop.length - 2, Math.floor(pSky * (skyTop.length - 1)));
  const local = pSky * (skyTop.length - 1) - idx;

  const mix = (a: string, b: string, q: number) => {
    const h2r = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const [r1, g1, b1] = h2r(a);
    const [r2, g2, b2] = h2r(b);
    return `rgb(${Math.round(lerp(r1, r2, q))},${Math.round(lerp(g1, g2, q))},${Math.round(lerp(b1, b2, q))})`;
  };

  const sunY = lerp(28, 74, p);

  return (
    <Screen bg="#0a0806">
      <div className="relative h-full w-full overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(${mix(skyTop[idx], skyTop[idx + 1], local)}, ${mix(skyBot[idx], skyBot[idx + 1], local)})`,
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 110,
            height: 110,
            left: "56%",
            top: `${sunY}%`,
            background: "radial-gradient(circle, #fffaf0 0%, #ffd591 38%, rgba(255,160,80,0) 70%)",
            opacity: lerp(1, 0.2, p),
          }}
        />
        {/* water */}
        <div
          className="absolute inset-x-0"
          style={{
            top: "56%",
            bottom: 0,
            background: `linear-gradient(${mix("#c9743c", "#171226", pSky)} 0%, ${mix("#6b3a26", "#0e0b18", pSky)} 45%, #0a0810 100%)`,
          }}
        />
        {/* sun reflection on the water */}
        <div
          className="absolute"
          style={{
            left: "56%",
            top: "56%",
            width: 46,
            height: "34%",
            transform: "translateX(6px)",
            background: "linear-gradient(rgba(255,214,145,0.5), rgba(255,190,120,0))",
            filter: "blur(3px)",
            opacity: lerp(0.95, 0.12, p),
          }}
        />
        <div
          className="absolute inset-x-0"
          style={{
            top: "44%",
            height: "16%",
            background: "#150d0f",
            clipPath:
              "polygon(0% 100%,0% 55%,6% 30%,11% 58%,17% 22%,23% 55%,30% 38%,37% 62%,44% 28%,51% 56%,58% 34%,66% 60%,73% 26%,80% 54%,88% 36%,95% 58%,100% 40%,100% 100%)",
          }}
        />
        {/* vignette instead of a flat scrim, so the HUD reads without
            flattening the whole frame */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 85% 70% at 50% 40%, rgba(4,2,8,0) 0%, rgba(4,2,8,0.35) 70%, rgba(4,2,8,0.72) 100%)",
          }}
        />

        {/* HUD */}
        <div className="absolute inset-0 flex flex-col justify-between p-4">
          <div className="flex items-start justify-between">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
              style={{ background: "rgba(10,7,5,0.7)", border: "1px solid rgba(255,122,26,0.35)", backdropFilter: "blur(8px)" }}
            >
              <span className="relative flex" style={{ width: 5, height: 5 }}>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full" style={{ background: "#4ade80", opacity: 0.7 }} />
                <span className="relative rounded-full" style={{ width: 5, height: 5, background: "#4ade80" }} />
              </span>
              <span className="font-bold uppercase" style={{ fontSize: 7.5, letterSpacing: "0.14em", color: "#FAFAFA" }}>
                Happening now
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl px-3 py-1.5 text-right"
              style={{ background: "rgba(10,7,5,0.62)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(8px)" }}
            >
              <div className="font-bold tabular-nums" style={{ fontSize: 18, color: "#FAFAFA" }}>
                {clock}
              </div>
              <div className="font-semibold uppercase" style={{ fontSize: 6.5, letterSpacing: "0.14em", color: "#ffb56b" }}>
                timelapse
              </div>
            </motion.div>
          </div>

          <div>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-display font-bold"
              style={{ fontSize: 26, color: "#fff", textShadow: "0 4px 20px rgba(0,0,0,0.7)" }}
            >
              {DEMO_ACTIVITY.emoji} {DEMO_ACTIVITY.title}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32 }}
              className="mt-1.5 flex items-center gap-3"
              style={{ fontSize: 10, color: "rgba(255,255,255,0.85)" }}
            >
              <span className="flex items-center gap-1">
                <MapPin size={9} style={{ color: "#ffb56b" }} /> {DEMO_ACTIVITY.zone}
              </span>
              <span className="flex items-center gap-1">
                <Users size={9} style={{ color: "#ffb56b" }} /> 5 wanderers here
              </span>
            </motion.div>

            <div className="mt-3 flex items-center gap-2">
              <div className="flex">
                {[{ initials: DEMO_USER.initials, tint: "rgba(255,122,26,0.28)", accent: "#ffd7ae" }, ...CAST].map(
                  (m, i) => (
                    <motion.div
                      key={m.initials}
                      initial={{ opacity: 0, scale: 0.5, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.09, type: "spring", stiffness: 300, damping: 20 }}
                      style={{ marginLeft: i === 0 ? 0 : -7 }}
                    >
                      <Avatar initials={m.initials} size={24} tint={m.tint} accent={m.accent} ring="rgba(10,8,6,0.9)" />
                    </motion.div>
                  ),
                )}
              </div>
              <div className="flex-1">
                <div className="mb-1 flex items-center justify-between" style={{ fontSize: 7.5, color: "rgba(255,255,255,0.7)" }}>
                  <span>Bridge by the dam · loop · done by 8:30</span>
                  <span className="tabular-nums">{Math.round(p * 100)}%</span>
                </div>
                <div className="w-full overflow-hidden rounded-full" style={{ height: 3, background: "rgba(255,255,255,0.18)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${p * 100}%`, background: `linear-gradient(90deg,${WARM.from},${WARM.to})` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Screen>
  );
}

/* ================================================================ 8. moment */

const CAPTION_TEXT = "golden hour did most of the work 🎞️";

export function MomentScene({ t }: { t: number }) {
  const posted = at(t, 4300);
  const comments = MOMENT_COMMENTS.filter((c) => at(t, c.at));
  const likes = 3 + comments.length * 4 + (at(t, 6800) ? 5 : 0);

  if (!posted) {
    return (
      <Screen>
        <AppTopBar active="Home" />
        <div className="relative flex items-center justify-center" style={{ height: CONTENT_H }}>
          <div className="absolute inset-0" style={{ background: "rgba(4,3,6,0.72)", backdropFilter: "blur(3px)" }} />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: EASE_OUT }}
            className="relative rounded-2xl p-4"
            style={{
              width: 400,
              background: "linear-gradient(165deg, #1a1510 0%, #100c09 55%, #0a0806 100%)",
              border: "1px solid rgba(255,181,107,0.2)",
              boxShadow: "0 22px 60px -18px rgba(0,0,0,0.85)",
            }}
          >
            <div className="flex items-center gap-2">
              <Camera size={13} style={{ color: WARM.to }} />
              <span className="font-display font-bold" style={{ fontSize: 14, color: "#FAFAFA" }}>
                Capture the moment
              </span>
            </div>

            <div className="mt-3 flex gap-3">
              <div
                className="overflow-hidden rounded-xl"
                style={{ width: 168, height: 126, border: "1px solid rgba(255,181,107,0.25)" }}
              >
                <motion.div initial={{ scale: 1.05, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.7 }} className="h-full w-full">
                  <FilmPhoto filter="contrast(1.08) saturate(1.12) brightness(1.04)" />
                </motion.div>
              </div>

              <div className="flex-1">
                <div className="font-semibold uppercase" style={{ fontSize: 7, letterSpacing: "0.14em", color: "#55556B" }}>
                  Filter
                </div>
                <div className="mt-1.5 flex gap-1.5">
                  {["Polaroid", "Grayscale", "Sepia"].map((f, i) => (
                    <div
                      key={f}
                      className="rounded-full font-semibold"
                      style={{
                        fontSize: 7.5,
                        padding: "3px 7px",
                        background: i === 0 ? `linear-gradient(135deg,${WARM.from},${WARM.to})` : "rgba(255,255,255,0.05)",
                        color: i === 0 ? WARM.ink : "#A5A5B8",
                        border: i === 0 ? "none" : "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      {f}
                    </div>
                  ))}
                </div>

                <div className="mt-3 font-semibold uppercase" style={{ fontSize: 7, letterSpacing: "0.14em", color: "#55556B" }}>
                  Caption
                </div>
                <div
                  className="mt-1.5 rounded-lg px-2 py-1.5"
                  style={{
                    minHeight: 34,
                    fontSize: 9.5,
                    color: "#FAFAFA",
                    background: "rgba(255,255,255,0.05)",
                    border: at(t, 900) ? "1px solid rgba(255,122,26,0.45)" : "1px solid rgba(255,255,255,0.1)",
                    transition: "border 220ms",
                  }}
                >
                  <Typed text={CAPTION_TEXT} t={t} from={1000} to={3300} caret />
                </div>
              </div>
            </div>

            <motion.div
              animate={{ scale: at(t, 3900) ? 0.97 : 1 }}
              transition={{ duration: 0.14 }}
              className="mt-3.5 flex items-center justify-center gap-1.5 rounded-full font-bold"
              style={{
                height: 30,
                fontSize: 10.5,
                background: `linear-gradient(135deg,${WARM.from},${WARM.to})`,
                color: WARM.ink,
                boxShadow: "0 10px 28px -12px rgba(255,122,26,0.6)",
              }}
            >
              <Share2 size={11} /> Save and post
            </motion.div>
          </motion.div>

          <DemoCursor
            x={at(t, 3400) ? 350 : 250}
            y={at(t, 3400) ? 300 : 170}
            clicking={at(t, 3900) && !at(t, 4300)}
          />
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppTopBar active="Home" />
      <div className="relative overflow-hidden" style={{ height: CONTENT_H }}>
        <Orb size={220} color="rgba(255,122,26,0.09)" top={-40} left={430} />
        <div className="relative flex h-full gap-4 px-4 pt-3">
          <div className="flex-1">
            <Kicker>Captured by wanderers</Kicker>
            <div className="mt-1 font-display font-bold" style={{ fontSize: 20, color: "#FAFAFA" }}>
              Recent moments
            </div>
            <div className="mt-1.5" style={{ fontSize: 9.5, color: "#A5A5B8", maxWidth: 210 }}>
              Every bubble ends with a Moment. It lands in the shared campus feed, not a dead group chat.
            </div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-3 flex items-baseline gap-1.5"
            >
              <span className="font-bold tabular-nums" style={{ fontSize: 17, color: WARM.to }}>
                1,248
              </span>
              <span style={{ fontSize: 8.5, color: "#55556B" }}>moments captured and counting</span>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 22, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, ease: EASE_OUT }}
            className="overflow-hidden rounded-2xl"
            style={{
              width: 268,
              background: "linear-gradient(165deg, #1a1510 0%, #100c09 55%, #0a0806 100%)",
              border: "1px solid rgba(255,181,107,0.2)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 16px 40px -16px rgba(0,0,0,0.75)",
            }}
          >
            <div className="flex items-center gap-1.5 px-2.5 pb-2 pt-2.5">
              <Avatar initials={DEMO_USER.initials} size={22} tint="rgba(255,122,26,0.3)" accent="#ffd7ae" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold" style={{ fontSize: 9.5, color: "#FAFAFA" }}>
                  {DEMO_USER.name}
                </div>
                <div style={{ fontSize: 7.5, color: "#55556B" }}>Just now · {DEMO_ACTIVITY.zone}</div>
              </div>
              <div
                className="rounded-full font-bold uppercase"
                style={{
                  fontSize: 6.5,
                  letterSpacing: "0.14em",
                  padding: "2px 6px",
                  background: WARM.tint,
                  border: `1px solid ${WARM.edge}`,
                  color: WARM.to,
                }}
              >
                Moment
              </div>
            </div>

            <div className="mx-2.5 overflow-hidden rounded-xl" style={{ aspectRatio: "4/3" }}>
              <FilmPhoto filter="contrast(1.08) saturate(1.12) brightness(1.04)" />
            </div>

            <div className="px-2.5 pt-2">
              <div className="font-display font-bold" style={{ fontSize: 11, color: "#FAFAFA" }}>
                {DEMO_ACTIVITY.title}
              </div>
              <div className="mt-1 flex items-center gap-2" style={{ fontSize: 7.5, color: "#A5A5B8" }}>
                <span className="flex items-center gap-0.5">
                  <MapPin size={7} style={{ color: WARM.from }} /> {DEMO_ACTIVITY.zone}
                </span>
                <span>5 wanderers here</span>
              </div>
              <div className="mt-1.5" style={{ fontSize: 9, color: "#FAFAFA" }}>
                {CAPTION_TEXT}
              </div>
              <div
                className="mt-1.5 font-semibold uppercase"
                style={{ fontSize: 7, letterSpacing: "0.12em", color: "rgba(255,181,107,0.7)" }}
              >
                #wandermoment
              </div>
            </div>

            <div
              className="mt-2 flex items-center gap-3 px-2.5 py-2"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <motion.div key={likes} initial={{ scale: 0.86 }} animate={{ scale: 1 }} className="flex items-center gap-1">
                <Heart size={10} fill="#f87171" style={{ color: "#f87171" }} />
                <span className="tabular-nums" style={{ fontSize: 8.5, color: "#A5A5B8" }}>
                  {likes}
                </span>
              </motion.div>
              <div className="flex items-center gap-1">
                <MessageCircle size={10} style={{ color: WARM.from }} />
                <span className="tabular-nums" style={{ fontSize: 8.5, color: "#A5A5B8" }}>
                  {comments.length}
                </span>
              </div>
              <Share2 size={10} className="ml-auto" style={{ color: "#A5A5B8" }} />
            </div>

            <div className="flex flex-col gap-1.5 px-2.5 pb-2.5">
              <AnimatePresence>
                {comments.map((c) => (
                  <motion.div
                    key={c.at}
                    initial={{ opacity: 0, x: -10, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: "auto" }}
                    className="flex items-center gap-1.5"
                  >
                    <Avatar
                      initials={CAST[c.who].initials}
                      size={16}
                      tint={CAST[c.who].tint}
                      accent={CAST[c.who].accent}
                    />
                    <span style={{ fontSize: 8.5, color: "#A5A5B8" }}>
                      <span style={{ color: "#FAFAFA", fontWeight: 600 }}>{CAST[c.who].name}</span> {c.text}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </Screen>
  );
}

/* ================================================================ 9. profile */

export function ProfileScene({ t }: { t: number }) {
  const accepted = [at(t, 2600), at(t, 4400)];
  const connections = 12 + accepted.filter(Boolean).length;
  const requests = [CAST[0], CAST[2]];

  return (
    <Screen>
      <AppTopBar active="Profile" title="Profile" />
      <div className="relative overflow-hidden" style={{ height: CONTENT_H }}>
        <div
          className="absolute inset-x-0 top-0"
          style={{
            height: 150,
            background: "radial-gradient(ellipse 70% 100% at 50% 0%, rgba(255,122,26,0.14) 0%, transparent 70%)",
          }}
        />

        <div className="relative flex h-full gap-4 px-4 pt-3">
          {/* left: identity */}
          <div className="flex flex-col items-center" style={{ width: 250 }}>
            <motion.div
              initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.6, ease: EASE }}
              className="relative"
            >
              <div
                className="absolute rounded-full"
                style={{
                  inset: -5,
                  background: `conic-gradient(from 180deg, ${WARM.from}, ${WARM.to}, ${WARM.from})`,
                  filter: "blur(6px)",
                  opacity: 0.6,
                }}
              />
              <div
                className="relative flex items-center justify-center rounded-full font-bold"
                style={{
                  width: 74,
                  height: 74,
                  fontSize: 24,
                  background: `linear-gradient(135deg,${WARM.from},${WARM.to})`,
                  color: WARM.ink,
                  border: "3px solid #140F0A",
                  boxShadow: "0 0 30px rgba(255,122,26,0.45)",
                }}
              >
                {DEMO_USER.initials}
              </div>
              <div
                className="absolute flex items-center justify-center rounded-full"
                style={{
                  right: -2,
                  bottom: -2,
                  width: 20,
                  height: 20,
                  background: "#140F0A",
                  border: "2px solid rgba(255,122,26,0.45)",
                }}
              >
                <BadgeCheck size={10} style={{ color: WARM.to }} />
              </div>
            </motion.div>

            <div className="mt-2.5 font-display font-bold" style={{ fontSize: 17, color: "#FAFAFA" }}>
              {DEMO_USER.name}
            </div>
            <div style={{ fontSize: 9, color: "#A5A5B8" }}>University of Waterloo</div>
            <div className="mt-1.5 flex items-start gap-1" style={{ fontSize: 8.5, color: "#A5A5B8", fontStyle: "italic" }}>
              <Quote size={8} style={{ color: WARM.from, flexShrink: 0, marginTop: 1 }} />
              Shoots film, walks far, back by curfew.
            </div>

            <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
              {["Explorer", "Coffee Shop Regular", "University of Waterloo"].map((v) => (
                <div
                  key={v}
                  className="rounded-full font-semibold"
                  style={{
                    fontSize: 7.5,
                    padding: "3px 7px",
                    background: WARM.tint,
                    border: `1px solid ${WARM.edge}`,
                    color: "#FAFAFA",
                  }}
                >
                  {v}
                </div>
              ))}
            </div>

            <div className="mt-3 grid w-full grid-cols-3 gap-1.5">
              {[
                { v: String(connections), l: "Connections" },
                { v: "13", l: "Events" },
                { v: "4.9 ★", l: "Vibe" },
              ].map((s, i) => (
                <div
                  key={s.l}
                  className="rounded-xl py-2 text-center"
                  style={{
                    background: "rgba(10,7,5,0.55)",
                    border: "1px solid rgba(255,122,26,0.16)",
                  }}
                >
                  <motion.div
                    key={s.v}
                    initial={i === 0 ? { scale: 0.7, color: "#4ade80" } : {}}
                    animate={{ scale: 1 }}
                    className="font-display font-bold tabular-nums"
                    style={{
                      fontSize: 15,
                      background: `linear-gradient(135deg,${WARM.from},${WARM.to})`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {s.v}
                  </motion.div>
                  <div className="font-semibold uppercase" style={{ fontSize: 6.5, letterSpacing: "0.12em", color: "#55556B" }}>
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* right: requests + interests */}
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <UserPlus size={9} style={{ color: WARM.from }} />
              <Kicker>Connection requests</Kicker>
            </div>

            <div className="mt-2 flex flex-col gap-1.5">
              {requests.map((person, i) => (
                <motion.div
                  key={person.name}
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 + i * 0.12 }}
                  className="flex items-center gap-2 rounded-xl p-2"
                  style={{
                    background: accepted[i] ? "rgba(74,222,128,0.07)" : "rgba(255,255,255,0.03)",
                    border: accepted[i] ? "1px solid rgba(74,222,128,0.28)" : "1px solid rgba(255,255,255,0.06)",
                    transition: "background 300ms, border 300ms",
                  }}
                >
                  <Avatar initials={person.initials} size={24} tint={person.tint} accent={person.accent} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold" style={{ fontSize: 9.5, color: "#FAFAFA" }}>
                      {person.name}
                    </div>
                    <div style={{ fontSize: 7.5, color: "#55556B" }}>
                      {accepted[i] ? "Now connected · met at the film walk" : "Wanna Wander?"}
                    </div>
                  </div>
                  <motion.div
                    animate={{ scale: accepted[i] ? [1, 1.25, 1] : 1 }}
                    transition={{ duration: 0.4 }}
                    className="flex items-center justify-center rounded-full"
                    style={{
                      width: 20,
                      height: 20,
                      background: accepted[i]
                        ? "rgba(74,222,128,0.18)"
                        : `linear-gradient(135deg,${WARM.from},${WARM.to})`,
                      border: accepted[i] ? "1px solid rgba(74,222,128,0.5)" : "none",
                    }}
                  >
                    <Check size={10} style={{ color: accepted[i] ? "#4ade80" : WARM.ink }} />
                  </motion.div>
                </motion.div>
              ))}
            </div>

            <div className="mt-3.5">
              <Kicker>Your circle</Kicker>
              <div className="mt-2 flex items-center gap-1.5">
                {CAST.map((p, i) => {
                  const isNew = (i === 0 && accepted[0]) || (i === 2 && accepted[1]);
                  return (
                    <motion.div
                      key={p.name}
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + i * 0.1, type: "spring", stiffness: 300, damping: 20 }}
                      className="relative flex flex-col items-center gap-1"
                    >
                      <div className="relative">
                        <Avatar initials={p.initials} size={30} tint={p.tint} accent={p.accent} />
                        {isNew && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute rounded-full"
                            style={{
                              right: -1,
                              bottom: -1,
                              width: 8,
                              height: 8,
                              background: "#4ade80",
                              border: "1.5px solid #140F0A",
                            }}
                          />
                        )}
                      </div>
                      <span style={{ fontSize: 6.5, color: "#55556B" }}>{p.name.split(" ")[0]}</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="mt-3.5">
              <Kicker>My interests</Kicker>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {["📷 Photography", "🥾 Hiking", "☕ Coffee", "📚 Studying", "🎵 Music"].map((int) => (
                  <div
                    key={int}
                    className="rounded-full font-bold"
                    style={{
                      fontSize: 7.5,
                      padding: "3px 7px",
                      background: `linear-gradient(135deg,${WARM.from},${WARM.to})`,
                      color: WARM.ink,
                    }}
                  >
                    {int}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DemoCursor
          x={666}
          y={at(t, 3600) ? 144 : 98}
          clicking={(at(t, 2400) && !at(t, 2900)) || (at(t, 4200) && !at(t, 4700))}
          visible={at(t, 1600) && !at(t, 5600)}
        />
      </div>
    </Screen>
  );
}

/* ================================================================ 10. explore */

function ActivityRow({ b, delay }: { b: DemoBubble; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.38, delay, ease: EASE }}
      className="flex items-center gap-2 rounded-xl p-2"
      style={{
        background: "#12121f",
        border: "1px solid rgba(255,255,255,0.08)",
        borderTop: `3px solid ${b.accent}`,
      }}
    >
      <span style={{ fontSize: 17 }}>{b.emoji}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-white" style={{ fontSize: 10 }}>
          {b.title}
        </div>
        <div className="mt-0.5 flex items-center gap-2" style={{ fontSize: 7.5, color: "rgba(255,255,255,0.5)" }}>
          <span className="flex items-center gap-0.5">
            <MapPin size={7} /> {b.zone}
          </span>
          <span className="flex items-center gap-0.5">
            <Clock size={7} /> {b.startingIn}
          </span>
        </div>
        <div className="mt-1.5">
          <CapacityBar pct={b.joined / b.max} from={b.from} to={b.to} height={2} />
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span
          className="rounded-full font-semibold tabular-nums"
          style={{ fontSize: 7, padding: "1px 5px", background: `${b.accent}26`, color: b.accent }}
        >
          {b.joined}/{b.max}
        </span>
        <div
          className="flex items-center justify-center rounded-lg font-bold text-white"
          style={{
            height: 18,
            padding: "0 8px",
            fontSize: 8,
            background: `linear-gradient(135deg,${b.from},${b.to})`,
          }}
        >
          Join
        </div>
      </div>
    </motion.div>
  );
}

export function ExploreScene({ t }: { t: number }) {
  const off = at(t, 4300);
  const list = off ? EXPLORE_OFF_CAMPUS : EXPLORE_ON_CAMPUS;

  const onPins = [
    { emoji: "🎹", x: 40, y: 30, accent: "#f472b6" },
    { emoji: "🎲", x: 62, y: 52, accent: "#a78bfa" },
    { emoji: "🧘", x: 30, y: 62, accent: "#22d3ee" },
  ];
  const offPins = [
    { emoji: "🧗", x: 22, y: 24, accent: "#fb923c" },
    { emoji: "🌽", x: 66, y: 38, accent: "#22d3ee" },
    { emoji: "🧥", x: 48, y: 70, accent: "#c084fc" },
  ];
  const pins = off ? offPins : onPins;

  return (
    <Screen bg="#0a0a15">
      <div className="flex h-full flex-col">
        <div
          className="flex flex-shrink-0 items-center gap-2 px-3"
          style={{ height: 34, background: "rgba(15,17,35,0.92)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <ArrowLeft size={11} style={{ color: "#A5A5B8" }} />
          <span className="font-bold text-white" style={{ fontSize: 12 }}>
            Discover
          </span>
          <span className="ml-auto" style={{ fontSize: 8, color: "#55556B" }}>
            {list.length} events matching filters
          </span>
        </div>

        <div
          className="flex flex-shrink-0 items-center gap-1.5 px-3"
          style={{ height: 28, background: "rgba(15,17,35,0.7)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <motion.div
            // rgba(...,0) rather than "transparent": framer-motion cannot
            // interpolate the keyword.
            animate={{
              background: off ? "rgba(99,102,241,0)" : "rgba(99,102,241,1)",
              color: off ? "#A5A5B8" : "#fff",
            }}
            className="rounded-full font-semibold"
            style={{
              fontSize: 7.5,
              padding: "2.5px 7px",
              border: off ? "1px solid rgba(255,255,255,0.1)" : "none",
            }}
          >
            🏫 On campus
          </motion.div>
          <motion.div
            animate={{
              background: off ? "rgba(245,158,11,1)" : "rgba(245,158,11,0)",
              color: off ? "#1a1200" : "#A5A5B8",
              boxShadow: off ? "0 0 10px rgba(245,158,11,0.5)" : "0 0 0px rgba(245,158,11,0)",
            }}
            className="rounded-full font-semibold"
            style={{
              fontSize: 7.5,
              padding: "2.5px 7px",
              border: off ? "none" : "1px solid rgba(255,255,255,0.1)",
            }}
          >
            🌍 Off campus
          </motion.div>
          <div style={{ width: 1, height: 12, background: "rgba(255,255,255,0.1)" }} />
          {["All", "🏀 Sports", "📚 Study", "🎵 Music", "🍕 Food"].map((c, i) => (
            <div
              key={c}
              className="rounded-full font-semibold"
              style={{
                fontSize: 7.5,
                padding: "2.5px 7px",
                background: i === 0 ? "rgba(255,255,255,0.12)" : "transparent",
                color: i === 0 ? "#fff" : "#A5A5B8",
                border: i === 0 ? "none" : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {c}
            </div>
          ))}
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="relative" style={{ width: "46%" }}>
            <MapCanvas>
              <AnimatePresence mode="popLayout">
                {pins.map((p, i) => (
                  <motion.div
                    key={`${off}-${p.emoji}`}
                    className="absolute"
                    style={{ left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%,-100%)" }}
                    initial={{ opacity: 0, y: -10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.4, delay: i * 0.1, ease: EASE_OUT }}
                  >
                    <div className="relative flex flex-col items-center">
                      <div
                        className="flex items-center justify-center rounded-full"
                        style={{
                          width: 22,
                          height: 22,
                          fontSize: 11,
                          background: "rgba(15,17,35,0.9)",
                          border: `1.5px solid ${p.accent}`,
                          boxShadow: `0 0 12px ${p.accent}66`,
                        }}
                      >
                        {p.emoji}
                      </div>
                      <div
                        style={{
                          width: 0,
                          height: 0,
                          borderLeft: "4px solid transparent",
                          borderRight: "4px solid transparent",
                          borderTop: `4px solid ${p.accent}`,
                        }}
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </MapCanvas>

            <AnimatePresence>
              {off && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute rounded-lg px-2 py-1.5"
                  style={{
                    left: 8,
                    right: 8,
                    bottom: 8,
                    fontSize: 8,
                    color: "#fde68a",
                    background: "rgba(20,14,4,0.9)",
                    border: "1px solid rgba(245,158,11,0.3)",
                    borderLeft: "3px solid #fbbf24",
                  }}
                >
                  🌍 Exploring beyond campus · some events may require travel
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div
            className="flex-1 overflow-hidden px-2.5 py-2.5"
            style={{ borderLeft: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="font-semibold text-white" style={{ fontSize: 10 }}>
                {off ? "Beyond campus" : "Nearby activities"}
              </span>
              <span className="flex items-center gap-1" style={{ fontSize: 7.5, color: "#55556B" }}>
                ⏰ Soonest <ChevronDown size={7} />
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <AnimatePresence mode="popLayout">
                {list.map((b, i) => (
                  <ActivityRow key={`${off}-${b.title}`} b={b} delay={i * 0.08} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <DemoCursor
        x={111}
        y={48}
        clicking={at(t, 3900) && !at(t, 4500)}
        visible={at(t, 3200) && !at(t, 5400)}
      />
    </Screen>
  );
}

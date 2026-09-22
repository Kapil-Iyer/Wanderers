/**
 * Faithful RN port of the web splash (src/components/ui/SplashIntro.tsx):
 * pin blooms + outline draws itself, a wide glowing trail unrolls, a
 * wanderer strides up it, companions appear at the summit, a flag unfurls
 * and waves, then "Wanderers" + tagline reveal. Same timings/colors as web,
 * translated from framer-motion (pathLength/offsetPath) to react-native-svg
 * dasharray draw-on + a manually-evaluated bezier point for the walker,
 * since RN has no offsetPath support.
 */

import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, Line, Path, Polygon, RadialGradient, Stop } from "react-native-svg";
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { colors } from "@/lib/theme";

// Reanimated's UI-thread prop updater only understands `transform` in RN's
// array-of-objects form - a plain SVG transform string (what react-native-svg
// itself accepts) crashes with "[Worklets] ... invalidTransform" the moment
// it's driven through useAnimatedProps. So nothing below animates `transform`:
// the walker moves via per-shape numeric coords (cx/cy/x1/y1 etc, offset by a
// shared derived point) and the flag "unfurls" via an animated `points` list
// on a Polygon instead of scale/skew.
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

// Same viewBox + paths as web (100 x 103).
const PIN_PATH =
  "M50 95 C50 95 15 66 15 42 C15 22.7 30.7 8 50 8 C69.3 8 85 22.7 85 42 C85 66 50 95 50 95 Z";
const TRAIL_PATH = "M50 90 C38 78 62 70 50 60 C40 51 60 47 50 40";
const SUMMIT = { x: 50, y: 40 };

type Seg = { p0: { x: number; y: number }; p1: { x: number; y: number }; p2: { x: number; y: number }; p3: { x: number; y: number } };

const PIN_SEGMENTS: Seg[] = [
  { p0: { x: 50, y: 95 }, p1: { x: 50, y: 95 }, p2: { x: 15, y: 66 }, p3: { x: 15, y: 42 } },
  { p0: { x: 15, y: 42 }, p1: { x: 15, y: 22.7 }, p2: { x: 30.7, y: 8 }, p3: { x: 50, y: 8 } },
  { p0: { x: 50, y: 8 }, p1: { x: 69.3, y: 8 }, p2: { x: 85, y: 22.7 }, p3: { x: 85, y: 42 } },
  { p0: { x: 85, y: 42 }, p1: { x: 85, y: 66 }, p2: { x: 50, y: 95 }, p3: { x: 50, y: 95 } },
];

const TRAIL_SEGMENTS: Seg[] = [
  { p0: { x: 50, y: 90 }, p1: { x: 38, y: 78 }, p2: { x: 62, y: 70 }, p3: { x: 50, y: 60 } },
  { p0: { x: 50, y: 60 }, p1: { x: 40, y: 51 }, p2: { x: 60, y: 47 }, p3: { x: 50, y: 40 } },
];

function cubicPoint(seg: Seg, t: number) {
  "worklet";
  const mt = 1 - t;
  const x = mt * mt * mt * seg.p0.x + 3 * mt * mt * t * seg.p1.x + 3 * mt * t * t * seg.p2.x + t * t * t * seg.p3.x;
  const y = mt * mt * mt * seg.p0.y + 3 * mt * mt * t * seg.p1.y + 3 * mt * t * t * seg.p2.y + t * t * t * seg.p3.y;
  return { x, y };
}

function pointOnSegments(segments: Seg[], t: number) {
  "worklet";
  const clamped = Math.max(0, Math.min(1, t));
  const segCount = segments.length;
  const scaled = clamped * segCount;
  const index = Math.min(segCount - 1, Math.floor(scaled));
  const localT = scaled - index;
  return cubicPoint(segments[index], localT);
}

function estimateLength(segments: Seg[], samplesPerSeg = 24): number {
  let length = 0;
  let prev = segments[0].p0;
  for (const seg of segments) {
    for (let i = 1; i <= samplesPerSeg; i++) {
      const t = i / samplesPerSeg;
      const mt = 1 - t;
      const x = mt * mt * mt * seg.p0.x + 3 * mt * mt * t * seg.p1.x + 3 * mt * t * t * seg.p2.x + t * t * t * seg.p3.x;
      const y = mt * mt * mt * seg.p0.y + 3 * mt * mt * t * seg.p1.y + 3 * mt * t * t * seg.p2.y + t * t * t * seg.p3.y;
      length += Math.hypot(x - prev.x, y - prev.y);
      prev = { x, y };
    }
  }
  return length;
}

const PIN_LENGTH = estimateLength(PIN_SEGMENTS);
const TRAIL_LENGTH = estimateLength(TRAIL_SEGMENTS);
const POLE_LENGTH = 18;

const EASE = Easing.bezier(0.25, 0.46, 0.45, 0.94);

export function SplashScreen() {
  const bloom = useSharedValue(0);
  const pinFill = useSharedValue(0);
  const pinOutline = useSharedValue(0);
  const trail = useSharedValue(0);
  const trailDashed = useSharedValue(0);
  const walker = useSharedValue(0);
  const companion1 = useSharedValue(0);
  const companion2 = useSharedValue(0);
  const pole = useSharedValue(0);
  const flag = useSharedValue(0);
  const spark = useSharedValue(0);
  const word = useSharedValue(0);
  const tagline = useSharedValue(0);

  useEffect(() => {
    bloom.value = withDelay(900, withTiming(1, { duration: 1200, easing: EASE }));
    pinOutline.value = withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) });
    pinFill.value = withDelay(1000, withTiming(1, { duration: 900, easing: EASE }));
    trail.value = withDelay(800, withTiming(1, { duration: 800, easing: EASE }));
    trailDashed.value = withDelay(1000, withTiming(1, { duration: 700, easing: Easing.linear }));
    walker.value = withDelay(1500, withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.ease) }));
    companion1.value = withDelay(2950, withTiming(1, { duration: 400, easing: Easing.out(Easing.back(1.4)) }));
    companion2.value = withDelay(3100, withTiming(1, { duration: 400, easing: Easing.out(Easing.back(1.4)) }));
    pole.value = withDelay(2750, withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) }));
    flag.value = withDelay(3000, withTiming(1, { duration: 600, easing: Easing.out(Easing.back(1.6)) }));
    spark.value = withDelay(3000, withTiming(1, { duration: 450, easing: Easing.out(Easing.back(1.6)) }));
    word.value = withDelay(3300, withTiming(1, { duration: 700, easing: EASE }));
    tagline.value = withDelay(3600, withTiming(1, { duration: 700, easing: EASE }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bloomProps = useAnimatedStyle(() => ({ opacity: bloom.value * 0.9 }));

  const pinFillProps = useAnimatedProps(() => ({ opacity: pinFill.value }));
  const pinOutlineProps = useAnimatedProps(() => ({
    strokeDashoffset: PIN_LENGTH * (1 - pinOutline.value),
    opacity: 0.9 + pinOutline.value * 0.1,
  }));

  const trailGlowProps = useAnimatedProps(() => ({ strokeDashoffset: TRAIL_LENGTH * (1 - trail.value) }));
  const trailDashedProps = useAnimatedProps(() => ({
    strokeDashoffset: TRAIL_LENGTH * (1 - trailDashed.value),
    opacity: trailDashed.value * 0.8,
  }));

  const walkerPoint = useDerivedValue(() => {
    const p = pointOnSegments(TRAIL_SEGMENTS, walker.value);
    const fade = walker.value < 0.12 ? walker.value / 0.12 : 1;
    return { x: p.x, y: p.y, opacity: fade };
  });

  const walkerHeadProps = useAnimatedProps(() => ({
    cx: walkerPoint.value.x,
    cy: walkerPoint.value.y - 4,
    opacity: walkerPoint.value.opacity,
  }));
  const walkerBodyProps = useAnimatedProps(() => ({
    x1: walkerPoint.value.x,
    y1: walkerPoint.value.y - 2.4,
    x2: walkerPoint.value.x,
    y2: walkerPoint.value.y + 1.4,
    opacity: walkerPoint.value.opacity,
  }));
  const walkerLegLProps = useAnimatedProps(() => ({
    x1: walkerPoint.value.x,
    y1: walkerPoint.value.y + 1.4,
    x2: walkerPoint.value.x - 2,
    y2: walkerPoint.value.y + 5,
    opacity: walkerPoint.value.opacity,
  }));
  const walkerLegRProps = useAnimatedProps(() => ({
    x1: walkerPoint.value.x,
    y1: walkerPoint.value.y + 1.4,
    x2: walkerPoint.value.x + 2,
    y2: walkerPoint.value.y + 4.6,
    opacity: walkerPoint.value.opacity,
  }));
  const walkerArmLProps = useAnimatedProps(() => ({
    x1: walkerPoint.value.x,
    y1: walkerPoint.value.y - 1.2,
    x2: walkerPoint.value.x - 1.8,
    y2: walkerPoint.value.y + 0.8,
    opacity: walkerPoint.value.opacity,
  }));
  const walkerArmRProps = useAnimatedProps(() => ({
    x1: walkerPoint.value.x,
    y1: walkerPoint.value.y - 1.2,
    x2: walkerPoint.value.x + 1.8,
    y2: walkerPoint.value.y - 0.6,
    opacity: walkerPoint.value.opacity,
  }));

  const companion1Props = useAnimatedProps(() => ({ opacity: companion1.value * 0.85 }));
  const companion2Props = useAnimatedProps(() => ({ opacity: companion2.value * 0.85 }));

  const poleProps = useAnimatedProps(() => ({ strokeDashoffset: POLE_LENGTH * (1 - pole.value) }));

  // "Unfurl" = interpolate each point from the pole-tip anchor (a
  // zero-area triangle) out to the full flag shape, instead of scaling.
  const FLAG_ANCHOR = { x: SUMMIT.x, y: SUMMIT.y - 18 };
  const FLAG_TARGET = [
    { x: SUMMIT.x, y: SUMMIT.y - 18 },
    { x: SUMMIT.x + 15, y: SUMMIT.y - 14.5 },
    { x: SUMMIT.x, y: SUMMIT.y - 11 },
  ];
  const flagProps = useAnimatedProps(() => {
    const t = flag.value;
    const pts = FLAG_TARGET.map((p) => `${FLAG_ANCHOR.x + (p.x - FLAG_ANCHOR.x) * t},${FLAG_ANCHOR.y + (p.y - FLAG_ANCHOR.y) * t}`);
    return { points: pts.join(" "), opacity: flag.value };
  });

  const sparkProps = useAnimatedProps(() => {
    const s = spark.value < 0.5 ? spark.value * 2 * 1.8 : 1.8 - (spark.value - 0.5) * 2 * 0.8;
    return { opacity: spark.value > 0 ? Math.min(1, spark.value * 1.4) : 0, r: 2.4 * s };
  });

  const wordStyle = useAnimatedStyle(() => ({
    opacity: word.value,
    transform: [{ translateY: (1 - word.value) * 18 }],
  }));
  const taglineStyle = useAnimatedStyle(() => ({ opacity: tagline.value }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.bloom, bloomProps]} pointerEvents="none">
        <Svg width={340} height={340}>
          <Defs>
            <RadialGradient id="bloom" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={colors.accentEnd} stopOpacity={0.35} />
              <Stop offset="1" stopColor={colors.accentEnd} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={170} cy={170} r={170} fill="url(#bloom)" />
        </Svg>
      </Animated.View>

      <Svg width={170} height={175} viewBox="-5 -5 110 113">
        <Defs>
          <RadialGradient id="pin-fill" cx="50%" cy="40%" r="65%">
            <Stop offset="0%" stopColor="rgba(224,51,158,0.4)" />
            <Stop offset="55%" stopColor="rgba(139,92,246,0.24)" />
            <Stop offset="100%" stopColor="rgba(139,92,246,0.04)" />
          </RadialGradient>
        </Defs>

        <AnimatedPath d={PIN_PATH} fill="url(#pin-fill)" animatedProps={pinFillProps} />
        <AnimatedPath
          d={PIN_PATH}
          stroke={colors.accentMid}
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={[PIN_LENGTH, PIN_LENGTH]}
          animatedProps={pinOutlineProps}
        />

        <AnimatedPath
          d={TRAIL_PATH}
          stroke={colors.accentMid}
          strokeWidth={9}
          strokeLinecap="round"
          fill="none"
          opacity={0.25}
          strokeDasharray={[TRAIL_LENGTH, TRAIL_LENGTH]}
          animatedProps={trailGlowProps}
        />
        <AnimatedPath
          d={TRAIL_PATH}
          stroke={colors.accentMid}
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={[TRAIL_LENGTH, TRAIL_LENGTH]}
          animatedProps={trailGlowProps}
        />
        <AnimatedPath
          d={TRAIL_PATH}
          stroke="rgba(255,245,225,0.9)"
          strokeWidth={1}
          strokeLinecap="round"
          strokeDasharray={[2, 4]}
          fill="none"
          animatedProps={trailDashedProps}
        />

        <AnimatedCircle r={1.6} fill="#FAFAFA" animatedProps={walkerHeadProps} />
        <AnimatedLine stroke="#FAFAFA" strokeWidth={1.2} strokeLinecap="round" animatedProps={walkerBodyProps} />
        <AnimatedLine stroke="#FAFAFA" strokeWidth={1.2} strokeLinecap="round" animatedProps={walkerLegLProps} />
        <AnimatedLine stroke="#FAFAFA" strokeWidth={1.2} strokeLinecap="round" animatedProps={walkerLegRProps} />
        <AnimatedLine stroke="#FAFAFA" strokeWidth={1} strokeLinecap="round" animatedProps={walkerArmLProps} />
        <AnimatedLine stroke="#FAFAFA" strokeWidth={1} strokeLinecap="round" animatedProps={walkerArmRProps} />

        <AnimatedCircle
          cx={SUMMIT.x - 9}
          cy={SUMMIT.y - 3.5}
          r={1.3}
          fill={colors.accentMid}
          animatedProps={companion1Props}
        />
        <AnimatedLine
          x1={SUMMIT.x - 9}
          y1={SUMMIT.y - 2.2}
          x2={SUMMIT.x - 9}
          y2={SUMMIT.y + 1.4}
          stroke={colors.accentMid}
          strokeWidth={1}
          strokeLinecap="round"
          animatedProps={companion1Props}
        />
        <AnimatedCircle
          cx={SUMMIT.x + 8}
          cy={SUMMIT.y - 3.5}
          r={1.3}
          fill={colors.accentMid}
          animatedProps={companion2Props}
        />
        <AnimatedLine
          x1={SUMMIT.x + 8}
          y1={SUMMIT.y - 2.2}
          x2={SUMMIT.x + 8}
          y2={SUMMIT.y + 1.4}
          stroke={colors.accentMid}
          strokeWidth={1}
          strokeLinecap="round"
          animatedProps={companion2Props}
        />

        <AnimatedLine
          x1={SUMMIT.x}
          y1={SUMMIT.y}
          x2={SUMMIT.x}
          y2={SUMMIT.y - POLE_LENGTH}
          stroke="#E5E7EB"
          strokeWidth={1.4}
          strokeLinecap="round"
          strokeDasharray={[POLE_LENGTH, POLE_LENGTH]}
          animatedProps={poleProps}
        />
        <AnimatedPolygon fill={colors.accentMid} animatedProps={flagProps} />
        <AnimatedCircle cx={SUMMIT.x} cy={SUMMIT.y - 18} r={2.4} fill={colors.accentMid} animatedProps={sparkProps} />
      </Svg>

      <Animated.Text style={[styles.wordmark, wordStyle]}>Wanderers</Animated.Text>
      <Animated.Text style={[styles.tagline, taglineStyle]}>- Find your people -</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
  bloom: {
    position: "absolute",
  },
  wordmark: {
    marginTop: 8,
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: colors.textPrimary,
  },
  tagline: {
    marginTop: 10,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 3,
    textTransform: "uppercase",
    color: colors.textSecondary,
  },
});

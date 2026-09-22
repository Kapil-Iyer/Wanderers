/**
 * RN substitute for the web app's Vanta.NET animated background - a WebGL
 * particle network can't run on React Native, so this reproduces the same
 * *effect* (soft magenta/violet/orange glow drifting over near-black) with
 * react-native-svg radial gradients animated via Reanimated. The web version
 * already dims Vanta heavily under a scrim so only soft color glow reads
 * anyway, which is what this reproduces directly.
 */

import { useEffect } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import Animated, { Easing, useAnimatedProps, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { colors } from "@/lib/theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type BlobProps = {
  fill: string;
  baseX: number;
  baseY: number;
  radius: number;
  driftX: number;
  driftY: number;
  duration: number;
};

function Blob({ fill, baseX, baseY, radius, driftX, driftY, duration }: BlobProps) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [duration]);

  const animatedProps = useAnimatedProps(() => ({
    cx: baseX + t.value * driftX,
    cy: baseY + t.value * driftY,
  }));

  return <AnimatedCircle animatedProps={animatedProps} r={radius} fill={fill} />;
}

export function AuroraBackground({ dimmed = false }: { dimmed?: boolean }) {
  const { width, height } = useWindowDimensions();

  return (
    <View style={[StyleSheet.absoluteFill, styles.base]} pointerEvents="none">
      <Svg width={width} height={height} style={{ opacity: dimmed ? 0.7 : 1 }}>
        <Defs>
          <RadialGradient id="g-magenta" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={colors.accentMid} stopOpacity={0.55} />
            <Stop offset="1" stopColor={colors.accentMid} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="g-violet" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={colors.accentEnd} stopOpacity={0.5} />
            <Stop offset="1" stopColor={colors.accentEnd} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="g-orange" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={colors.accentStart} stopOpacity={0.4} />
            <Stop offset="1" stopColor={colors.accentStart} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Blob fill="url(#g-magenta)" baseX={width * 0.22} baseY={height * 0.16} radius={width * 0.65} driftX={30} driftY={20} duration={9000} />
        <Blob fill="url(#g-violet)" baseX={width * 0.85} baseY={height * 0.45} radius={width * 0.7} driftX={-25} driftY={30} duration={11000} />
        <Blob fill="url(#g-orange)" baseX={width * 0.3} baseY={height * 0.85} radius={width * 0.55} driftX={20} driftY={-25} duration={13000} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.bg,
    overflow: "hidden",
  },
});

/**
 * Motion helpers - RN/Reanimated equivalent of src/lib/gsap.ts's role on web.
 * `Easing.out(Easing.cubic)` is the closest Reanimated analog to GSAP's
 * "power3.out", used throughout the web app's entrance reveals.
 */

import { useEffect } from "react";
import { AccessibilityInfo } from "react-native";
import { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";

const ENTRANCE_DURATION = 700;
const ENTRANCE_TRAVEL = 20;

/** Mount-triggered fade + rise reveal, optionally staggered by `delay` ms. */
export function useEntrance(delay = 0) {
  const progress = useSharedValue(0);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduced) => {
        if (cancelled) return;
        progress.value = withDelay(
          reduced ? 0 : delay,
          withTiming(1, { duration: reduced ? 0 : ENTRANCE_DURATION, easing: Easing.out(Easing.cubic) })
        );
      })
      .catch(() => {
        progress.value = withDelay(delay, withTiming(1, { duration: ENTRANCE_DURATION, easing: Easing.out(Easing.cubic) }));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay]);

  return useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * ENTRANCE_TRAVEL }],
  }));
}

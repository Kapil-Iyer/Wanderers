import Animated from "react-native-reanimated";
import type { StyleProp, ViewStyle } from "react-native";
import { useEntrance } from "@/lib/motion";

const STAGGER_MS = 60;
const MAX_STAGGER_MS = 480;

type Props = {
  index: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function AnimatedListItem({ index, children, style }: Props) {
  const entrance = useEntrance(Math.min(index * STAGGER_MS, MAX_STAGGER_MS));
  return <Animated.View style={[style, entrance]}>{children}</Animated.View>;
}

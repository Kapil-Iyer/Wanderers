import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { Pressable } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { colors, glow, gradients, radii } from "@/lib/theme";

type Props = {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "ghost";
  /** Shows a "Coming soon" alert instead of calling onPress - for stubbed actions. */
  comingSoon?: boolean;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function GradientButton({ label, onPress, loading, disabled, variant = "primary", comingSoon }: Props) {
  const scale = useSharedValue(1);
  const isPrimary = variant === "primary";

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled || loading ? 0.5 : 1,
  }));

  const handlePress = () => {
    if (comingSoon) {
      Alert.alert("Coming soon", "This isn't wired up yet.");
      return;
    }
    onPress?.();
  };

  const content = loading ? (
    <ActivityIndicator color={isPrimary ? "#FFFFFF" : colors.textPrimary} />
  ) : (
    <Text
      className="text-base font-semibold"
      style={{ color: isPrimary ? "#FFFFFF" : colors.textPrimary }}
    >
      {label}
    </Text>
  );

  return (
    <AnimatedPressable
      onPress={handlePress}
      disabled={disabled || loading}
      onPressIn={() => {
        scale.value = withSpring(0.97, { stiffness: 400, damping: 20 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { stiffness: 400, damping: 20 });
      }}
      style={animatedStyle}
    >
      {isPrimary ? (
        <LinearGradient
          colors={gradients.primaryButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.pill, glow]}
        >
          {content}
        </LinearGradient>
      ) : (
        <View style={[styles.pill, styles.ghost]}>{content}</View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: radii.pill,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  ghost: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
});

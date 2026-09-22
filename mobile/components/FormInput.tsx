import { useState, type ReactNode } from "react";
import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";
import { colors, radii } from "@/lib/theme";

type Props = TextInputProps & { label: string; trailing?: ReactNode };

export function FormInput({ label, onFocus, onBlur, trailing, ...props }: Props) {
  const [focused, setFocused] = useState(false);

  const animatedStyle = useAnimatedStyle(() => ({
    borderColor: withTiming(focused ? colors.inputBorderFocus : colors.inputBorder, { duration: 180 }),
  }));

  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-sm font-medium" style={{ color: colors.textSecondary }}>
        {label}
      </Text>
      <Animated.View style={[styles.field, animatedStyle, trailing ? styles.fieldRow : null]}>
        <TextInput
          placeholderTextColor={colors.textMuted}
          className="flex-1 text-base"
          style={{ color: colors.textPrimary }}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {trailing}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    borderRadius: radii.card - 4,
    borderWidth: 1,
    backgroundColor: colors.inputBg,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
  },
});

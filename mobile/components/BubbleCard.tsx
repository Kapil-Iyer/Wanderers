import { Pressable, StyleSheet, Text, View } from "react-native";
import { getCategoryTheme } from "@/lib/categoryThemes";
import { colors, radii } from "@/lib/theme";

type Props = {
  emoji: string;
  title: string;
  zone?: string | null;
  startingIn?: string;
  joined?: number;
  maxPeople?: number;
  category?: string | null;
  onPress?: () => void;
  /** Stacked tile layout (top accent stripe) for grid use, e.g. Explore. */
  compact?: boolean;
};

export function BubbleCard({
  emoji,
  title,
  zone,
  startingIn,
  joined,
  maxPeople,
  category,
  onPress,
  compact,
}: Props) {
  const theme = getCategoryTheme(category ?? undefined);

  if (compact) {
    return (
      <Pressable onPress={onPress} style={[styles.tile, { borderTopColor: theme.from }]}>
        <Text className="text-2xl">{emoji}</Text>
        <Text className="mt-2 text-sm font-semibold" style={{ color: colors.textPrimary }} numberOfLines={2}>
          {title}
        </Text>
        <Text className="mt-1 text-xs" style={{ color: colors.textSecondary }} numberOfLines={1}>
          {[zone, startingIn].filter(Boolean).join(" · ")}
        </Text>
        {joined !== undefined && maxPeople !== undefined ? (
          <Text className="mt-2 text-xs font-medium" style={{ color: theme.accent }}>
            {joined}/{maxPeople} joined
          </Text>
        ) : null}
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} style={[styles.card, { borderLeftColor: theme.from }]}>
      <Text className="mr-3 text-2xl">{emoji}</Text>
      <View className="flex-1">
        <Text className="text-base font-semibold" style={{ color: colors.textPrimary }} numberOfLines={1}>
          {title}
        </Text>
        <Text className="mt-0.5 text-sm" style={{ color: colors.textSecondary }} numberOfLines={1}>
          {[zone, startingIn].filter(Boolean).join(" · ")}
        </Text>
      </View>
      {joined !== undefined && maxPeople !== undefined ? (
        <Text className="ml-2 text-sm font-medium" style={{ color: colors.textSecondary }}>
          {joined}/{maxPeople}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    padding: 14,
    borderRadius: radii.card,
    backgroundColor: colors.cardGlassBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderLeftWidth: 3,
  },
  tile: {
    flex: 1,
    minHeight: 140,
    padding: 14,
    borderRadius: radii.card,
    backgroundColor: colors.cardGlassBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderTopWidth: 3,
  },
});

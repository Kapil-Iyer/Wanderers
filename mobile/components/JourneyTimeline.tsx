import { Text, View } from "react-native";
import { AnimatedListItem } from "@/components/AnimatedListItem";
import { colors, radii } from "@/lib/theme";

export type JourneyEntry = {
  id: string;
  emoji: string;
  title: string;
  meta: string;
  timeLabel: string;
};

export function JourneyTimeline({ items }: { items: JourneyEntry[] }) {
  return (
    <View className="pl-4">
      <View
        style={{
          position: "absolute",
          left: 5,
          top: 8,
          bottom: 8,
          width: 1,
          backgroundColor: colors.cardBorder,
        }}
      />
      <View style={{ gap: 10 }}>
        {items.map((entry, index) => (
          <AnimatedListItem key={entry.id} index={index}>
            <View className="flex-row items-center gap-3">
              <View
                style={{
                  height: 10,
                  width: 10,
                  borderRadius: 5,
                  backgroundColor: colors.accentStart,
                  marginLeft: -20,
                  marginRight: 8,
                }}
              />
              <View
                className="flex-1 flex-row items-center gap-3 p-3"
                style={{ backgroundColor: colors.cardGlassBg, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radii.card - 4 }}
              >
                <Text className="text-2xl">{entry.emoji}</Text>
                <View className="flex-1">
                  <Text className="text-sm font-semibold" style={{ color: colors.textPrimary }} numberOfLines={1}>
                    {entry.title}
                  </Text>
                  <Text className="text-xs" style={{ color: colors.textSecondary }} numberOfLines={1}>
                    {entry.meta}
                  </Text>
                </View>
                <Text className="text-[10px]" style={{ color: colors.textMuted }}>
                  {entry.timeLabel}
                </Text>
              </View>
            </View>
          </AnimatedListItem>
        ))}
      </View>
    </View>
  );
}

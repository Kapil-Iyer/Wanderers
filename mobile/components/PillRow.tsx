import { Text, View } from "react-native";
import { colors, radii } from "@/lib/theme";

type Props = {
  items: string[];
  variant: "solid" | "outline";
};

export function PillRow({ items, variant }: Props) {
  const isSolid = variant === "solid";
  return (
    <View className="flex-row flex-wrap gap-2">
      {items.map((item) => (
        <View
          key={item}
          style={{
            borderRadius: radii.pill,
            paddingHorizontal: 14,
            paddingVertical: 7,
            backgroundColor: isSolid ? colors.accentStart : colors.inputBg,
            borderWidth: isSolid ? 0 : 1,
            borderColor: colors.cardBorder,
          }}
        >
          <Text
            className="text-xs font-bold"
            style={{ color: isSolid ? "#2A1206" : colors.textSecondary }}
          >
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

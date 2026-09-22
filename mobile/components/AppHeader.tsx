import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/lib/theme";

type Props = { title: string; subtitle?: string };

export function AppHeader({ title, subtitle }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top + 12, borderColor: colors.cardBorder }} className="border-b px-5 pb-4">
      <LinearGradient
        colors={["rgba(224,51,158,0.22)", "rgba(139,92,246,0.08)", "transparent"]}
        style={{ position: "absolute", left: 0, right: 0, top: 0, height: 220 }}
        pointerEvents="none"
      />
      <View className="flex-row items-center gap-2">
        <View style={{ backgroundColor: colors.accentMid }} className="h-2 w-2 rounded-full" />
        <Text className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
          {title}
        </Text>
      </View>
      {subtitle ? (
        <Text className="mt-0.5 text-sm" style={{ color: colors.textSecondary }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

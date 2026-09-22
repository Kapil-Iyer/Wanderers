import { Pressable, ScrollView, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradients, radii } from "@/lib/theme";

type Props = {
  chips: string[];
  active: string;
  onChange: (chip: string) => void;
};

export function FilterChipRow({ chips, active, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2 pb-1"
    >
      {chips.map((chip) => {
        const isActive = chip === active;
        return (
          <Pressable key={chip} onPress={() => onChange(chip)}>
            {isActive ? (
              <LinearGradient
                colors={gradients.primaryButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: radii.pill, paddingHorizontal: 16, paddingVertical: 8 }}
              >
                <Text className="text-xs font-bold text-white">{chip}</Text>
              </LinearGradient>
            ) : (
              <Text
                className="text-xs font-semibold overflow-hidden"
                style={{
                  color: colors.textPrimary,
                  backgroundColor: colors.inputBg,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  borderRadius: radii.pill,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                }}
              >
                {chip}
              </Text>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

import { StyleSheet, View, type ViewProps } from "react-native";
import { colors, radii } from "@/lib/theme";

export function GlassCard({ style, ...props }: ViewProps) {
  return <View style={[styles.card, style]} {...props} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardGlassBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.card,
    padding: 20,
  },
});

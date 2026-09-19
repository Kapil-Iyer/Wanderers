import { Text, View } from "react-native";

type Props = { emoji?: string; title: string; subtitle?: string };

export function EmptyState({ emoji = "🫧", title, subtitle }: Props) {
  return (
    <View className="items-center justify-center py-16 px-8">
      <Text className="mb-2 text-4xl">{emoji}</Text>
      <Text className="text-center text-base font-medium text-foreground">{title}</Text>
      {subtitle ? (
        <Text className="mt-1 text-center text-sm text-muted-foreground">{subtitle}</Text>
      ) : null}
    </View>
  );
}

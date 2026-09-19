import { ActivityIndicator, View } from "react-native";

export function LoadingState() {
  return (
    <View className="flex-1 items-center justify-center py-16">
      <ActivityIndicator color="#FF5A36" />
    </View>
  );
}

import { useEffect } from "react";
import { router } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "@/contexts/AuthContext";

export default function Index() {
  const { authed, checking } = useAuth();

  useEffect(() => {
    if (checking) return;
    router.replace(authed ? "/(tabs)/home" : "/(auth)/login");
  }, [checking, authed]);

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator color="#FF5A36" />
    </View>
  );
}

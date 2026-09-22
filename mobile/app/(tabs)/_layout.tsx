import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useGuest } from "@/contexts/GuestContext";
import { supabase } from "@/lib/supabase";
import { colors } from "@/lib/theme";

export default function TabsLayout() {
  const { authed, checking, user } = useAuth();
  const { isGuest } = useGuest();

  // Real (non-guest) users with no vibe set yet haven't been through
  // onboarding - route them there first (see onboarding.tsx).
  const vibeQuery = useQuery({
    queryKey: ["profile-vibe", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("users").select("vibe").eq("id", user!.id).maybeSingle();
      return data?.vibe ?? null;
    },
    enabled: authed && !isGuest && !!user,
    staleTime: Infinity,
  });

  if (checking || (authed && !isGuest && vibeQuery.isLoading)) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.accentStart} />
      </View>
    );
  }

  if (!authed) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!isGuest && !vibeQuery.data) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accentStart,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.cardBorder },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, size }) => <Ionicons name="compass" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

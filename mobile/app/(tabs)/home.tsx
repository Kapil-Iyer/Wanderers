import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { AppHeader } from "@/components/AppHeader";
import { BubbleCard } from "@/components/BubbleCard";
import { AnimatedListItem } from "@/components/AnimatedListItem";
import { GlassCard } from "@/components/GlassCard";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { useGuest } from "@/contexts/GuestContext";
import { recommendations, type RecommendedBubble } from "@/api/recommendations";
import { campusEvents, type CampusEvent } from "@/api/campusEvents";
import { DEMO_BUBBLES } from "@/lib/demoData";
import { colors, glow, gradients } from "@/lib/theme";
import { AuroraBackground } from "@/components/AuroraBackground";

export default function HomeScreen() {
  const { isGuest } = useGuest();

  const bubblesQuery = useQuery({
    queryKey: ["recommendations"],
    queryFn: recommendations,
    enabled: !isGuest,
  });

  const eventsQuery = useQuery({
    queryKey: ["campus-events"],
    queryFn: campusEvents,
  });

  type DisplayBubble = {
    id: string;
    emoji: string;
    title: string;
    zone?: string | null;
    joined?: number;
    maxPeople?: number;
    startingIn?: string;
    category?: string;
  };

  const bubbles: DisplayBubble[] = isGuest
    ? DEMO_BUBBLES.map((b) => ({
        id: b.id,
        emoji: b.emoji,
        title: b.title,
        zone: b.zone,
        joined: b.joined,
        maxPeople: b.maxPeople,
        startingIn: b.startingIn,
        category: b.category,
      }))
    : (bubblesQuery.data?.recommended_bubbles ?? []).map((b: RecommendedBubble) => ({
        id: b.id,
        emoji: b.emoji,
        title: b.title,
        zone: b.zone,
        joined: b.joined,
        maxPeople: b.maxPeople,
        startingIn: b.startingIn,
      }));

  const events: CampusEvent[] = eventsQuery.data?.data ?? [];
  const loading = (!isGuest && bubblesQuery.isLoading) || eventsQuery.isLoading;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bg }}>
      <AuroraBackground dimmed />
      <AppHeader title="Home" subtitle="Waterloo" />
      <FlatList
        data={bubbles}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-5 pt-4 pb-24"
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              bubblesQuery.refetch();
              eventsQuery.refetch();
            }}
            tintColor={colors.accentStart}
          />
        }
        ListHeaderComponent={
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
              Happening near you
            </Text>
            <Pressable
              onPress={() => router.push("/map")}
              className="flex-row items-center gap-1 rounded-full border px-3 py-1.5"
              style={{ borderColor: colors.cardBorder }}
            >
              <Ionicons name="map-outline" size={14} color={colors.textPrimary} />
              <Text className="text-xs font-medium" style={{ color: colors.textPrimary }}>
                Map
              </Text>
            </Pressable>
          </View>
        }
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <BubbleCard
              emoji={item.emoji}
              title={item.title}
              zone={item.zone}
              startingIn={item.startingIn}
              joined={item.joined}
              maxPeople={item.maxPeople}
              category={item.category}
              onPress={() => router.push(`/chat/${item.id}`)}
            />
          </AnimatedListItem>
        )}
        ListEmptyComponent={
          loading ? (
            <LoadingState />
          ) : !isGuest && bubblesQuery.isError ? (
            <EmptyState
              emoji="⚠️"
              title="Couldn't load bubbles"
              subtitle={bubblesQuery.error instanceof Error ? bubblesQuery.error.message : "Check your connection and pull to retry."}
            />
          ) : (
            <EmptyState title="Nothing happening right now" subtitle="Check back soon." />
          )
        }
        ListFooterComponent={
          <View className="mt-6">
            <Text className="mb-2 text-lg font-semibold" style={{ color: colors.textPrimary }}>
              Campus events
            </Text>
            {events.length === 0 ? (
              <EmptyState emoji="📅" title="No upcoming events" />
            ) : (
              events.map((e) => (
                <GlassCard key={e.id} style={{ marginBottom: 12, padding: 16 }}>
                  <Text className="text-base font-semibold" style={{ color: colors.textPrimary }}>
                    {e.title}
                  </Text>
                  <Text className="mt-0.5 text-sm" style={{ color: colors.textSecondary }}>
                    {e.location}
                    {e.organizer ? ` · ${e.organizer}` : ""}
                  </Text>
                </GlassCard>
              ))
            )}
          </View>
        }
      />
      <Pressable
        onPress={() => (isGuest ? router.push("/(auth)/signup") : router.push("/create-bubble"))}
        className="absolute bottom-24 right-5"
      >
        <LinearGradient
          colors={gradients.primaryButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[{ height: 56, width: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" }, glow]}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

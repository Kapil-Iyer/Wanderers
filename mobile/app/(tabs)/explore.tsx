import { useMemo, useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { BubbleCard } from "@/components/BubbleCard";
import { FilterChipRow } from "@/components/FilterChipRow";
import { AnimatedListItem } from "@/components/AnimatedListItem";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { useGuest } from "@/contexts/GuestContext";
import { myBubbles } from "@/api/bubbles";
import { DEMO_BUBBLES } from "@/lib/demoData";
import { filterChips } from "@/lib/mockData";
import { inferCategory, formatStartingIn, timingBucket, type TimingBucket } from "@/lib/bubbleHelpers";
import { colors } from "@/lib/theme";
import { AuroraBackground } from "@/components/AuroraBackground";

type DisplayBubble = {
  id: string;
  emoji: string;
  title: string;
  zone?: string;
  joined?: number;
  maxPeople?: number;
  startingIn?: string;
  category: string;
  timing: TimingBucket;
};

export default function ExploreScreen() {
  const { isGuest } = useGuest();
  const [activeFilter, setActiveFilter] = useState("All");

  const query = useQuery({
    queryKey: ["bubbles-mine"],
    queryFn: myBubbles,
    enabled: !isGuest,
  });

  const items: DisplayBubble[] = useMemo(() => {
    if (isGuest) {
      return DEMO_BUBBLES.map((b) => ({
        id: b.id,
        emoji: b.emoji,
        title: b.title,
        zone: b.zone ?? undefined,
        joined: b.joined,
        maxPeople: b.maxPeople,
        startingIn: b.startingIn,
        category: b.category,
        timing: (b.startingIn.includes("min") ? "now" : b.startingIn.includes("hr") ? "soon" : "unknown") as TimingBucket,
      }));
    }
    return (query.data?.data ?? []).map((b) => ({
      id: b.id,
      emoji: b.emoji ?? "🫧",
      title: b.activity ?? "Activity",
      zone: b.zone ?? undefined,
      joined: b.members_count,
      maxPeople: b.max_members ?? undefined,
      startingIn: formatStartingIn(b.start_time),
      category: inferCategory(b.activity),
      timing: timingBucket(b.start_time, b.duration_minutes),
    }));
  }, [isGuest, query.data]);

  const filtered = useMemo(() => {
    if (activeFilter === "All") return items;
    if (activeFilter === "Happening Now") return items.filter((b) => b.timing === "now");
    if (activeFilter === "Starting Soon") return items.filter((b) => b.timing === "soon");
    return items.filter((b) => b.category === activeFilter);
  }, [items, activeFilter]);

  const loading = !isGuest && query.isLoading;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bg }}>
      <AuroraBackground dimmed />
      <AppHeader title="Explore" subtitle="Around campus" />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerClassName="px-5 pt-4 pb-24"
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => query.refetch()} tintColor={colors.accentStart} />
        }
        ListHeaderComponent={
          <View className="mb-4">
            <FilterChipRow chips={filterChips} active={activeFilter} onChange={setActiveFilter} />
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index} style={{ flex: 1 }}>
            <BubbleCard
              compact
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
          ) : !isGuest && query.isError ? (
            <EmptyState
              emoji="⚠️"
              title="Couldn't load your bubbles"
              subtitle={query.error instanceof Error ? query.error.message : "Check your connection and pull to retry."}
            />
          ) : items.length === 0 ? (
            <EmptyState title="No bubbles yet" subtitle="Join one from Home to see it here." />
          ) : (
            <EmptyState title="Nothing matches this filter" subtitle="Try a different filter." />
          )
        }
      />
    </View>
  );
}

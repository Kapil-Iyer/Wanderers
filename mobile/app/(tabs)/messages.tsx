import { useMemo, useState } from "react";
import { Pressable, RefreshControl, SectionList, Text, View } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { AppHeader } from "@/components/AppHeader";
import { GlassCard } from "@/components/GlassCard";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { useGuest } from "@/contexts/GuestContext";
import { myBubbles, starBubble, unstarBubble, type MyBubble } from "@/api/bubbles";
import { DEMO_BUBBLES } from "@/lib/demoData";
import { colors } from "@/lib/theme";
import { AuroraBackground } from "@/components/AuroraBackground";

function isEnded(b: MyBubble): boolean {
  if (b.status === "expired") return true;
  if (b.expires_at) return new Date(b.expires_at).getTime() < Date.now();
  return false;
}

function ConvoRow({
  emoji,
  title,
  zone,
  ended,
  starred,
  onPress,
  onToggleStar,
}: {
  emoji: string;
  title: string;
  zone?: string | null;
  ended?: boolean;
  starred?: boolean;
  onPress: () => void;
  onToggleStar?: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      <GlassCard style={{ marginBottom: 10, flexDirection: "row", alignItems: "center", padding: 14 }}>
        <View className="mr-3 h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: colors.inputBg }}>
          <Text className="text-xl">{emoji}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-base font-medium" style={{ color: colors.textPrimary }} numberOfLines={1}>
            {title}
          </Text>
          {zone ? (
            <Text className="mt-0.5 text-sm" style={{ color: colors.textSecondary }} numberOfLines={1}>
              {zone}
            </Text>
          ) : null}
        </View>
        {onToggleStar ? (
          <Pressable onPress={onToggleStar} hitSlop={8} className="mr-2">
            <Ionicons
              name={starred ? "star" : "star-outline"}
              size={18}
              color={starred ? colors.accentStart : colors.textMuted}
            />
          </Pressable>
        ) : null}
        <View
          className="rounded-full px-2 py-0.5"
          style={{ backgroundColor: ended ? colors.inputBg : "rgba(74,222,128,0.12)" }}
        >
          <Text className="text-[10px] font-semibold" style={{ color: ended ? colors.textMuted : "#4ADE80" }}>
            {ended ? "Ended" : "Live"}
          </Text>
        </View>
      </GlassCard>
    </Pressable>
  );
}

export default function MessagesScreen() {
  const { isGuest } = useGuest();
  const [showPast, setShowPast] = useState(false);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["bubbles-mine"],
    queryFn: myBubbles,
    enabled: !isGuest,
  });

  const starMutation = useMutation({
    mutationFn: ({ id, starred }: { id: string; starred: boolean }) => (starred ? unstarBubble(id) : starBubble(id)),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["bubbles-mine"] }),
  });

  const demoItems = DEMO_BUBBLES.map((b) => ({ id: b.id, emoji: b.emoji, title: b.title, zone: b.zone ?? undefined }));

  const { active, starred, past } = useMemo(() => {
    const rows = query.data?.data ?? [];
    const endedRows = rows.filter(isEnded);
    return {
      active: rows.filter((b) => !isEnded(b)),
      starred: endedRows.filter((b) => b.starred),
      past: endedRows.filter((b) => !b.starred),
    };
  }, [query.data]);

  const loading = !isGuest && query.isLoading;

  const toRow = (b: MyBubble) => ({
    id: b.id,
    emoji: b.emoji ?? "🫧",
    title: b.activity ?? "Activity",
    zone: b.zone,
    starred: b.starred,
  });

  const sections = [
    { key: "active", title: "", data: active.map(toRow), ended: false },
    ...(starred.length > 0 ? [{ key: "starred", title: `★ Starred · ${starred.length}`, data: starred.map(toRow), ended: true }] : []),
    ...(past.length > 0
      ? [{ key: "past", title: `Past · ${past.length}`, data: showPast ? past.map(toRow) : [], ended: true }]
      : []),
  ];

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bg }}>
      <AuroraBackground dimmed />
      <AppHeader
        title="Messages"
        subtitle={!isGuest ? `${active.length} active${starred.length + past.length ? ` · ${starred.length + past.length} ended` : ""}` : undefined}
      />

      {isGuest ? (
        <SectionList
          sections={[{ key: "demo", title: "", data: demoItems, ended: false }]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 96 }}
          renderItem={({ item }) => (
            <ConvoRow emoji={item.emoji} title={item.title} zone={item.zone} onPress={() => router.push(`/chat/${item.id}`)} />
          )}
          ListEmptyComponent={<EmptyState emoji="💬" title="No conversations yet" subtitle="Join a bubble to start chatting." />}
        />
      ) : loading ? (
        <LoadingState />
      ) : query.isError ? (
        <EmptyState
          emoji="⚠️"
          title="Couldn't load messages"
          subtitle={query.error instanceof Error ? query.error.message : "Check your connection and try again."}
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 96 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => query.refetch()} tintColor={colors.accentStart} />}
          renderSectionHeader={({ section }) => {
            if (!section.title) return null;
            const isPast = section.key === "past";
            return (
              <Pressable
                onPress={isPast ? () => setShowPast((v) => !v) : undefined}
                className="mb-2 mt-2 flex-row items-center gap-1.5"
              >
                <Text className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.textMuted }}>
                  {section.title}
                </Text>
                {isPast ? (
                  <Ionicons
                    name={showPast ? "chevron-down" : "chevron-forward"}
                    size={12}
                    color={colors.textMuted}
                  />
                ) : null}
              </Pressable>
            );
          }}
          renderItem={({ item, section }) => (
            <ConvoRow
              emoji={item.emoji}
              title={item.title}
              zone={item.zone}
              ended={section.ended}
              starred={item.starred}
              onPress={() => router.push(`/chat/${item.id}`)}
              onToggleStar={() => starMutation.mutate({ id: item.id, starred: item.starred })}
            />
          )}
          ListEmptyComponent={<EmptyState emoji="💬" title="No conversations yet" subtitle="Join a bubble to start chatting." />}
        />
      )}
    </View>
  );
}

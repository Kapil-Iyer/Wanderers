import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { AppHeader } from "@/components/AppHeader";
import { GlassCard } from "@/components/GlassCard";
import { LoadingState } from "@/components/LoadingState";
import { GradientButton } from "@/components/GradientButton";
import { PillRow } from "@/components/PillRow";
import { JourneyTimeline } from "@/components/JourneyTimeline";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useGuest } from "@/contexts/GuestContext";
import { DEMO_PROFILE, DEMO_BUBBLES } from "@/lib/demoData";
import { interestOptions, personalityTraits } from "@/lib/mockData";
import { inferCategory, timeAgo } from "@/lib/bubbleHelpers";
import { myBubbles } from "@/api/bubbles";
import { updateProfile } from "@/api/profile";
import { deleteAccount } from "@/api/authApi";
import { colors, radii } from "@/lib/theme";
import { AuroraBackground } from "@/components/AuroraBackground";

const BIO_QUOTE = "Seeking the quiet corners and the loud laughter.";

const VIBE_LABELS: Record<string, string> = {
  late_night_grinder: "Late Night Grinder",
  coffee_regular: "Coffee Shop Regular",
  sports: "Sports",
  study_buddy: "Study Buddy",
  explorer: "Explorer",
};

function SectionLabel({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <View className="mb-3 mt-7 flex-row items-center justify-between">
      <Text className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: colors.textMuted }}>
        {children}
      </Text>
      {action}
    </View>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <View
      className="flex-1 items-center rounded-2xl p-3"
      style={{ backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.cardBorder }}
    >
      <Text className="text-xl font-bold" style={{ color: colors.textPrimary }}>
        {value}
      </Text>
      <Text className="mt-0.5 text-[10px] font-medium uppercase tracking-wider" style={{ color: colors.textMuted }}>
        {label}
      </Text>
    </View>
  );
}

/** Toggleable chip catalog - used in-place of PillRow while editing. */
function EditableChips({ catalog, selected, onToggle }: { catalog: string[]; selected: string[]; onToggle: (item: string) => void }) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {catalog.map((item) => {
        const active = selected.includes(item);
        return (
          <Pressable
            key={item}
            onPress={() => onToggle(item)}
            style={{
              borderRadius: radii.pill,
              paddingHorizontal: 14,
              paddingVertical: 7,
              backgroundColor: active ? colors.accentMid : colors.inputBg,
              borderWidth: 1,
              borderColor: active ? colors.accentMid : colors.cardBorder,
            }}
          >
            <Text className="text-xs font-bold" style={{ color: active ? "#FFFFFF" : colors.textSecondary }}>
              {item}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function ProfileScreen() {
  const { user } = useAuth();
  const { isGuest, exitGuestMode } = useGuest();
  const queryClient = useQueryClient();
  const [editingInterests, setEditingInterests] = useState(false);
  const [editingTraits, setEditingTraits] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("users").select("*").eq("id", user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !isGuest && !!user,
  });

  const bubblesQuery = useQuery({
    queryKey: ["bubbles-mine"],
    queryFn: myBubbles,
    enabled: !isGuest,
  });

  const saveMutation = useMutation({
    mutationFn: (payload: { interests?: string[]; personality_traits?: string[] }) => updateProfile(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile", user?.id] }),
  });

  const onSignOut = async () => {
    if (isGuest) {
      exitGuestMode();
    } else {
      await supabase.auth.signOut();
    }
    router.replace("/(auth)/login");
  };

  const onDeleteAccount = () => {
    Alert.alert(
      "Delete your account?",
      "This permanently deletes your account, profile, and bubbles you created. Messages and Wander Moments you posted stay visible to others but are no longer attributed to you. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              const res = await deleteAccount();
              if (!res.success) throw new Error(res.error);
              await supabase.auth.signOut();
              router.replace("/(auth)/login");
            } catch (e) {
              Alert.alert("Couldn't delete account", e instanceof Error ? e.message : "Try again.");
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (isGuest) {
    const journeyItems = DEMO_BUBBLES.slice(0, 4).map((b) => ({
      id: b.id,
      emoji: b.emoji,
      title: b.title,
      meta: `${b.joined} wanderers · ${b.category}`,
      timeLabel: b.startingIn,
    }));

    return (
      <View className="flex-1" style={{ backgroundColor: colors.bg }}>
        <AuroraBackground dimmed />
        <ScrollView className="flex-1">
          <AppHeader title="Profile" />
          <View className="px-5 pt-6 pb-10">
            <GlassCard style={{ alignItems: "center" }}>
              <View className="mb-4 h-20 w-20 items-center justify-center rounded-full" style={{ backgroundColor: colors.inputBg }}>
                <Text className="text-4xl">{DEMO_PROFILE.avatar}</Text>
              </View>
              <Text className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                {DEMO_PROFILE.name}
              </Text>
              <Text className="mt-1 text-center text-sm italic" style={{ color: colors.textSecondary }}>
                {DEMO_PROFILE.bio}
              </Text>
              <View className="mt-6 w-full">
                <GradientButton label="Sign up to save your activity" onPress={() => router.push("/(auth)/signup")} />
              </View>
            </GlassCard>

            <SectionLabel>My Interests</SectionLabel>
            <PillRow items={DEMO_PROFILE.interests} variant="solid" />

            <SectionLabel>Personality</SectionLabel>
            <PillRow items={DEMO_PROFILE.personalityTraits} variant="outline" />

            <SectionLabel>Your Journey</SectionLabel>
            <JourneyTimeline items={journeyItems} />
          </View>
        </ScrollView>
      </View>
    );
  }

  if (profileQuery.isLoading) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.bg }}>
        <AuroraBackground dimmed />
        <AppHeader title="Profile" />
        <LoadingState />
      </View>
    );
  }

  const name = profileQuery.data?.name ?? user?.email?.split("@")[0] ?? "Wanderer";
  const email = profileQuery.data?.email ?? user?.email ?? "";
  const initials = name.slice(0, 2).toUpperCase();
  const vibe = profileQuery.data?.vibe as string | null | undefined;
  const vibeTags = [vibe ? VIBE_LABELS[vibe] : null, "University of Waterloo"].filter(Boolean) as string[];

  // Real per-user data (users.interests / users.personality_traits) - falls
  // back to a starter set so the section isn't empty before a user has
  // picked anything (e.g. skipped onboarding's vibe-based defaults).
  const myInterests: string[] = (profileQuery.data?.interests as string[] | null) ?? [];
  const myTraits: string[] = (profileQuery.data?.personality_traits as string[] | null) ?? [];

  const toggleInterest = (item: string) => {
    const next = myInterests.includes(item) ? myInterests.filter((i) => i !== item) : [...myInterests, item];
    saveMutation.mutate({ interests: next });
  };
  const toggleTrait = (item: string) => {
    const next = myTraits.includes(item) ? myTraits.filter((i) => i !== item) : [...myTraits, item];
    saveMutation.mutate({ personality_traits: next });
  };

  const joinedBubbles = bubblesQuery.data?.data ?? [];
  const journeyItems = joinedBubbles.slice(0, 4).map((b) => ({
    id: b.id,
    emoji: b.emoji ?? "🫧",
    title: b.activity ?? "Activity",
    meta: `${b.members_count} wanderers · ${inferCategory(b.activity)}`,
    timeLabel: timeAgo(b.start_time),
  }));

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bg }}>
      <AuroraBackground dimmed />
      <ScrollView className="flex-1">
        <AppHeader title="Profile" />
        <View className="px-5 pt-6 pb-10">
          <GlassCard style={{ alignItems: "center" }}>
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-full" style={{ backgroundColor: colors.inputBg }}>
              <Text className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                {initials}
              </Text>
            </View>
            <Text className="text-xl font-bold" style={{ color: colors.textPrimary }}>
              {name}
            </Text>
            <Text className="mt-1 text-sm" style={{ color: colors.textSecondary }}>
              {email}
            </Text>
            <Text className="mt-3 text-center text-sm italic" style={{ color: colors.textSecondary }}>
              {BIO_QUOTE}
            </Text>

            <View className="mt-4 flex-row flex-wrap justify-center gap-2">
              {vibeTags.map((tag) => (
                <View
                  key={tag}
                  style={{
                    borderRadius: radii.pill,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    backgroundColor: "rgba(255,90,54,0.12)",
                    borderWidth: 1,
                    borderColor: "rgba(255,90,54,0.25)",
                  }}
                >
                  <Text className="text-xs font-semibold" style={{ color: colors.textPrimary }}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          </GlassCard>

          <View className="mt-5 flex-row gap-3">
            <StatTile label="Connections" value="—" />
            <StatTile label="Bubbles Joined" value={String(joinedBubbles.length)} />
            <StatTile label="Vibe Rating" value="—" />
          </View>

          <SectionLabel
            action={
              <Pressable onPress={() => setEditingInterests((v) => !v)} className="flex-row items-center gap-1">
                <Ionicons name={editingInterests ? "checkmark" : "pencil"} size={12} color={colors.textPrimary} />
                <Text className="text-xs font-medium" style={{ color: colors.textPrimary }}>
                  {editingInterests ? "Done" : "Edit"}
                </Text>
              </Pressable>
            }
          >
            My Interests
          </SectionLabel>
          {editingInterests ? (
            <EditableChips catalog={interestOptions} selected={myInterests} onToggle={toggleInterest} />
          ) : myInterests.length > 0 ? (
            <PillRow items={myInterests} variant="solid" />
          ) : (
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              No interests picked yet — tap Edit to add some.
            </Text>
          )}

          <SectionLabel
            action={
              <Pressable onPress={() => setEditingTraits((v) => !v)} className="flex-row items-center gap-1">
                <Ionicons name={editingTraits ? "checkmark" : "pencil"} size={12} color={colors.textPrimary} />
                <Text className="text-xs font-medium" style={{ color: colors.textPrimary }}>
                  {editingTraits ? "Done" : "Edit"}
                </Text>
              </Pressable>
            }
          >
            Personality
          </SectionLabel>
          {editingTraits ? (
            <EditableChips catalog={personalityTraits} selected={myTraits} onToggle={toggleTrait} />
          ) : myTraits.length > 0 ? (
            <PillRow items={myTraits} variant="outline" />
          ) : (
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              No traits picked yet — tap Edit to add some.
            </Text>
          )}

          <SectionLabel>Your Journey</SectionLabel>
          {journeyItems.length > 0 ? (
            <JourneyTimeline items={journeyItems} />
          ) : (
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              Join a bubble to start your journey.
            </Text>
          )}

          <View className="mt-8">
            <GradientButton label="Sign Out" onPress={onSignOut} variant="ghost" />
          </View>
          {!isGuest && (
            <Pressable onPress={onDeleteAccount} disabled={deleting} className="mt-3 items-center py-2">
              <Text className="text-sm" style={{ color: colors.textMuted }}>
                {deleting ? "Deleting…" : "Delete Account"}
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

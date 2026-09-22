/**
 * "Who are you on campus?" vibe picker - unlike web's version (which never
 * persists anything, confirmed by reading src/app/onboarding/page.tsx), this
 * actually saves to the real (previously unused) users.vibe/interests
 * columns via PATCH /api/profile. Single-select here, not multi-select like
 * web's cosmetic UI, since users.vibe is one string, not an array.
 */

import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router, Stack } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { updateProfile } from "@/api/profile";
import { useAuth } from "@/contexts/AuthContext";
import { colors, radii } from "@/lib/theme";
import { AuroraBackground } from "@/components/AuroraBackground";
import { GradientButton } from "@/components/GradientButton";

const VIBE_CARDS = [
  {
    id: "late_night_grinder",
    label: "Late Night Grinder",
    emoji: "🌙",
    desc: "DC at 2am, energy drinks, the grind never stops",
    interests: ["📚 Studying", "🧑‍💻 Coding"],
  },
  {
    id: "coffee_regular",
    label: "Coffee Shop Regular",
    emoji: "☕",
    desc: "SLC, your corner table, oat milk flat white, vibes only",
    interests: ["☕ Coffee", "📷 Photography"],
  },
  {
    id: "sports",
    label: "Pick-up Sports Guy",
    emoji: "🏀",
    desc: "PAC courts, 3v3, doesn't matter who — let's run it",
    interests: ["🏀 Basketball", "⚽ Soccer", "🏃 Running", "🏊 Swimming"],
  },
  {
    id: "study_buddy",
    label: "Study Buddy",
    emoji: "📖",
    desc: "Group rooms, shared notes, accountability partners",
    interests: ["📚 Studying", "🧑‍💻 Coding", "🎲 Board Games"],
  },
  {
    id: "explorer",
    label: "Explorer",
    emoji: "🧭",
    desc: "Hikes, open mics, random events — if it's new, you're in",
    interests: ["🥾 Hiking", "🎵 Music", "🎭 Theater", "🎨 Arts"],
  },
];

export default function OnboardingScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => {
      const card = VIBE_CARDS.find((c) => c.id === selected)!;
      return updateProfile({ vibe: card.id, interests: card.interests });
    },
    onSuccess: async () => {
      // The tabs layout caches a `profile-vibe` check with staleTime:
      // Infinity to decide whether to redirect here - without invalidating
      // it, it'd still see no vibe and bounce straight back to onboarding.
      await queryClient.invalidateQueries({ queryKey: ["profile-vibe", user?.id] });
      await queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      router.replace("/(tabs)/home");
    },
  });

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bg }}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      <AuroraBackground />
      <ScrollView contentContainerClassName="px-5 pb-10" contentContainerStyle={{ paddingTop: 64 }}>
        <Text className="mb-1 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: colors.textPrimary }}>
          Step 1 of 1
        </Text>
        <Text className="mb-2 text-3xl font-bold" style={{ color: colors.textPrimary }}>
          Who are you{"\n"}
          <Text style={{ color: colors.accentMid }}>on campus?</Text>
        </Text>
        <Text className="mb-6 text-sm" style={{ color: colors.textSecondary }}>
          Pick the one that fits best — we'll match you with your kind of bubbles.
        </Text>

        <View style={{ gap: 12 }}>
          {VIBE_CARDS.map((card) => {
            const isSelected = selected === card.id;
            return (
              <Pressable
                key={card.id}
                onPress={() => setSelected(card.id)}
                style={{
                  borderRadius: radii.card,
                  padding: 18,
                  backgroundColor: colors.cardGlassBg,
                  borderWidth: 1.5,
                  borderColor: isSelected ? colors.accentMid : colors.cardBorder,
                }}
              >
                <View className="flex-row items-center gap-4">
                  <Text className="text-3xl">{card.emoji}</Text>
                  <View className="flex-1">
                    <Text className="text-base font-semibold" style={{ color: colors.textPrimary }}>
                      {card.label}
                    </Text>
                    <Text className="mt-0.5 text-xs" style={{ color: colors.textSecondary }} numberOfLines={2}>
                      {card.desc}
                    </Text>
                  </View>
                  {isSelected ? (
                    <View className="h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: colors.accentMid }}>
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    </View>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View className="mt-8">
          <GradientButton
            label={selected ? "That's me →" : "Pick one to continue"}
            onPress={() => mutation.mutate()}
            disabled={!selected}
            loading={mutation.isPending}
          />
          <Text className="mt-3 text-center text-xs" style={{ color: colors.textMuted }}>
            You can always update this from your profile.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

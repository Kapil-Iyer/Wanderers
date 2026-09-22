import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createBubble } from "@/api/bubbles";
import { inferCategory } from "@/lib/bubbleHelpers";
import { colors } from "@/lib/theme";
import { AuroraBackground } from "@/components/AuroraBackground";
import { GlassCard } from "@/components/GlassCard";
import { FormInput } from "@/components/FormInput";
import { GradientButton } from "@/components/GradientButton";

const ZONE_OPTIONS = ["PAC", "SLC", "DC Library", "MC", "Village 1", "Uptown Waterloo"];
const DURATION_OPTIONS = [
  { label: "30 min", minutes: 30 },
  { label: "1 hr", minutes: 60 },
  { label: "2 hr", minutes: 120 },
  { label: "3 hr", minutes: 180 },
];
const MAX_MEMBERS_OPTIONS = [4, 6, 8, 10, 12];

const CATEGORY_EMOJI: Record<string, string> = {
  Sports: "🏀",
  Study: "📚",
  Gaming: "🎮",
  Music: "🎵",
  Outdoors: "🥾",
  Casual: "🫧",
};

function ChipGroup<T extends string | number>({
  options,
  labels,
  value,
  onChange,
}: {
  options: T[];
  labels: string[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((opt, i) => {
        const active = value === opt;
        return (
          <Pressable
            key={String(opt)}
            onPress={() => onChange(opt)}
            style={{
              borderRadius: 999,
              paddingHorizontal: 14,
              paddingVertical: 8,
              backgroundColor: active ? colors.accentMid : colors.inputBg,
              borderWidth: 1,
              borderColor: active ? colors.accentMid : colors.cardBorder,
            }}
          >
            <Text className="text-xs font-semibold" style={{ color: active ? "#FFFFFF" : colors.textSecondary }}>
              {labels[i]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function CreateBubbleScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [activity, setActivity] = useState("");
  const [zone, setZone] = useState("");
  const [duration, setDuration] = useState(60);
  const [maxMembers, setMaxMembers] = useState<number | null>(8);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      createBubble({
        activity: activity.trim(),
        zone: zone.trim(),
        duration_minutes: duration,
        max_members: maxMembers ?? undefined,
        description: description.trim() || undefined,
        emoji: CATEGORY_EMOJI[inferCategory(activity)],
      }),
    onSuccess: async (res) => {
      if (!res.success) {
        setError(res.error ?? "Couldn't create that bubble.");
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["bubbles-mine"] });
      await queryClient.invalidateQueries({ queryKey: ["recommendations"] });
      await queryClient.invalidateQueries({ queryKey: ["bubbles-list"] });
      router.replace(`/chat/${res.data.id}`);
    },
    onError: (e: unknown) => {
      Alert.alert("Couldn't create bubble", e instanceof Error ? e.message : "Try again.");
    },
  });

  const onSubmit = () => {
    setError(null);
    if (!activity.trim() || !zone.trim()) {
      setError("Activity and zone are required.");
      return;
    }
    mutation.mutate();
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bg }}>
      <Stack.Screen options={{ headerShown: false }} />
      <AuroraBackground dimmed />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={{ paddingTop: insets.top + 12, borderColor: colors.cardBorder }} className="flex-row items-center border-b px-4 pb-3">
          <Pressable onPress={() => router.back()} className="mr-3">
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
            Create a bubble
          </Text>
        </View>

        <ScrollView contentContainerClassName="px-5 py-5" keyboardShouldPersistTaps="handled">
          <GlassCard>
            <FormInput
              label="What's happening?"
              value={activity}
              onChangeText={setActivity}
              placeholder="e.g. 3v3 Basketball at PAC"
              maxLength={100}
            />

            <FormInput label="Where?" value={zone} onChangeText={setZone} placeholder="e.g. PAC Courts" maxLength={80} />
            <View className="-mt-2 mb-4">
              <ChipGroup options={ZONE_OPTIONS} labels={ZONE_OPTIONS} value={zone || null} onChange={setZone} />
            </View>

            <Text className="mb-1.5 text-sm font-medium" style={{ color: colors.textSecondary }}>
              Duration
            </Text>
            <View className="mb-4">
              <ChipGroup
                options={DURATION_OPTIONS.map((d) => d.minutes)}
                labels={DURATION_OPTIONS.map((d) => d.label)}
                value={duration}
                onChange={setDuration}
              />
            </View>

            <Text className="mb-1.5 text-sm font-medium" style={{ color: colors.textSecondary }}>
              Max people
            </Text>
            <View className="mb-4">
              <ChipGroup
                options={MAX_MEMBERS_OPTIONS}
                labels={MAX_MEMBERS_OPTIONS.map(String)}
                value={maxMembers}
                onChange={setMaxMembers}
              />
            </View>

            <FormInput
              label="Description (optional)"
              value={description}
              onChangeText={setDescription}
              placeholder="Anything people should know before joining"
              multiline
              maxLength={500}
            />

            {error ? <Text className="mb-4 text-sm text-destructive">{error}</Text> : null}

            <GradientButton label="Start this bubble" onPress={onSubmit} loading={mutation.isPending} />
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

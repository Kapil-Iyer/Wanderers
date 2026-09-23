import { useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { confirmBubble } from "@/api/bubbles";
import { uploadMoment } from "@/api/moments";
import { colors } from "@/lib/theme";
import { AuroraBackground } from "@/components/AuroraBackground";
import { GlassCard } from "@/components/GlassCard";
import { FormInput } from "@/components/FormInput";
import { GradientButton } from "@/components/GradientButton";

type PickedPhoto = { uri: string; name: string; type: string };

function assetToPhoto(asset: ImagePicker.ImagePickerAsset): PickedPhoto {
  const name = asset.fileName || asset.uri.split("/").pop() || `moment-${Date.now()}.jpg`;
  const type = asset.mimeType || "image/jpeg";
  return { uri: asset.uri, name, type };
}

/**
 * End event -> Wander Moment. Mirrors the web app's EndEventModal flow:
 * confirm the bubble (mark it expired), then optionally post a photo +
 * caption to the shared feed. Reachable from the chat screen's "End Event"
 * action.
 */
export default function EndEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Camera access needed", "Enable camera access in Settings to take a photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (!result.canceled && result.assets[0]) setPhoto(assetToPhoto(result.assets[0]));
  };

  const pickFromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Photo access needed", "Enable photo library access in Settings to choose a photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (!result.canceled && result.assets[0]) setPhoto(assetToPhoto(result.assets[0]));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const confirmRes = await confirmBubble(id);
      if (!confirmRes.success) throw new Error(confirmRes.error ?? "Couldn't end this event.");
      return uploadMoment(id, caption.trim(), photo ?? undefined);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["bubbles-mine"] });
      await queryClient.invalidateQueries({ queryKey: ["moments"] });
      router.replace("/(tabs)/home");
    },
    onError: (e: unknown) => {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    },
  });

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
            End event
          </Text>
        </View>

        <ScrollView contentContainerClassName="px-5 py-5" keyboardShouldPersistTaps="handled">
          <GlassCard>
            <Text className="mb-3 text-sm" style={{ color: colors.textSecondary }}>
              Capture a Wander Moment before you go - or skip the photo and just end the event.
            </Text>

            {photo ? (
              <View className="mb-4">
                <Image source={{ uri: photo.uri }} style={{ width: "100%", aspectRatio: 1, borderRadius: 16 }} />
                <Pressable onPress={() => setPhoto(null)} className="mt-2 self-start">
                  <Text className="text-xs font-medium" style={{ color: colors.accentMid }}>
                    Remove photo
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View className="mb-4 flex-row gap-3">
                <Pressable
                  onPress={takePhoto}
                  className="flex-1 items-center justify-center rounded-2xl border py-6"
                  style={{ borderColor: colors.cardBorder, backgroundColor: colors.inputBg }}
                >
                  <Ionicons name="camera-outline" size={26} color={colors.textPrimary} />
                  <Text className="mt-2 text-xs font-medium" style={{ color: colors.textSecondary }}>
                    Take Photo
                  </Text>
                </Pressable>
                <Pressable
                  onPress={pickFromLibrary}
                  className="flex-1 items-center justify-center rounded-2xl border py-6"
                  style={{ borderColor: colors.cardBorder, backgroundColor: colors.inputBg }}
                >
                  <Ionicons name="images-outline" size={26} color={colors.textPrimary} />
                  <Text className="mt-2 text-xs font-medium" style={{ color: colors.textSecondary }}>
                    Choose from Library
                  </Text>
                </Pressable>
              </View>
            )}

            <FormInput
              label="Caption (optional)"
              value={caption}
              onChangeText={setCaption}
              placeholder="How'd it go?"
              multiline
              maxLength={280}
            />

            {error ? <Text className="mb-4 text-sm text-destructive">{error}</Text> : null}

            <GradientButton
              label="End Event"
              onPress={() => {
                setError(null);
                mutation.mutate();
              }}
              loading={mutation.isPending}
            />
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

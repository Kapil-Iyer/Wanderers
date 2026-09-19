/**
 * Reached after a forgot-password OTP verify (see verify-otp.tsx mode=reset).
 * That flow only proves identity and signs you in with the OLD password
 * still set - this is what actually changes it, matching web's
 * src/app/change-password/page.tsx (supabase.auth.updateUser).
 */

import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { router, Stack } from "expo-router";
import { supabase } from "@/lib/supabase";
import { colors } from "@/lib/theme";
import { AuroraBackground } from "@/components/AuroraBackground";
import { GlassCard } from "@/components/GlassCard";
import { FormInput } from "@/components/FormInput";
import { GradientButton } from "@/components/GradientButton";

export default function ChangePasswordScreen() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.replace("/(tabs)/home"), 700);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bg }}>
      <Stack.Screen options={{ headerShown: false }} />
      <AuroraBackground />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerClassName="flex-1 justify-center px-6 py-10" keyboardShouldPersistTaps="handled">
          <Text className="mb-1 text-3xl font-bold" style={{ color: colors.textPrimary }}>
            Change password
          </Text>
          <Text className="mb-6 text-base" style={{ color: colors.textSecondary }}>
            You're signed in. Set a new password for next time, or skip and go to Home.
          </Text>

          <GlassCard>
            {done ? (
              <Text className="text-sm font-semibold" style={{ color: "#4ADE80" }}>
                Password updated — heading to Home…
              </Text>
            ) : (
              <>
                <FormInput label="New password" value={password} onChangeText={setPassword} secureTextEntry placeholder="Min. 8 characters" />
                <FormInput label="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry placeholder="Re-enter password" />

                {error ? <Text className="mb-4 text-sm text-destructive">{error}</Text> : null}

                <GradientButton label="Update password" onPress={onSubmit} loading={loading} />

                <Pressable onPress={() => router.replace("/(tabs)/home")} className="mt-4 items-center">
                  <Text className="text-sm" style={{ color: colors.textSecondary }}>
                    Skip for now → Home
                  </Text>
                </Pressable>
              </>
            )}
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

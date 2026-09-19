import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { router, useLocalSearchParams } from "expo-router";
import { verifyOtp } from "@/api/authApi";
import { supabase } from "@/lib/supabase";
import { useEntrance } from "@/lib/motion";
import { colors } from "@/lib/theme";
import { AuroraBackground } from "@/components/AuroraBackground";
import { GlassCard } from "@/components/GlassCard";
import { FormInput } from "@/components/FormInput";
import { GradientButton } from "@/components/GradientButton";

export default function VerifyOtpScreen() {
  const params = useLocalSearchParams<{ email: string; mode: string; rememberDevice?: string }>();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const headingStyle = useEntrance();
  const cardStyle = useEntrance(120);

  const email = params.email ?? "";
  const rememberDevice = params.rememberDevice === "1";

  const onSubmit = async () => {
    setError(null);
    if (code.trim().length < 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setLoading(true);
    try {
      const res = await verifyOtp(email, code.trim(), rememberDevice);
      if (!res.success) {
        setError(res.error);
        return;
      }
      if (res.session) {
        await supabase.auth.setSession(res.session);
      }
      // A "forgot password" OTP only proves identity - the old password is
      // still set until change-password actually updates it.
      router.replace(params.mode === "reset" ? "/change-password" : "/(tabs)/home");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bg }}>
      <AuroraBackground />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerClassName="flex-1 justify-center px-6 py-10" keyboardShouldPersistTaps="handled">
          <Animated.View style={headingStyle}>
            <Text className="mb-1 text-3xl font-bold" style={{ color: colors.textPrimary }}>
              Enter your code
            </Text>
            <Text className="mb-6 text-base" style={{ color: colors.textSecondary }}>
              We sent a 6-digit code to {email}.
            </Text>
          </Animated.View>

          <Animated.View style={cardStyle}>
            <GlassCard>
              <FormInput
                label="Code"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="123456"
              />

              {error ? (
                <Text className="mb-4 text-sm text-destructive">{error}</Text>
              ) : null}

              <GradientButton label="Verify" onPress={onSubmit} loading={loading} />
            </GlassCard>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { router } from "expo-router";
import { forgotPassword } from "@/api/authApi";
import { useEntrance } from "@/lib/motion";
import { colors } from "@/lib/theme";
import { AuroraBackground } from "@/components/AuroraBackground";
import { GlassCard } from "@/components/GlassCard";
import { FormInput } from "@/components/FormInput";
import { GradientButton } from "@/components/GradientButton";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const headingStyle = useEntrance();
  const cardStyle = useEntrance(120);

  const onSubmit = async () => {
    setError(null);
    if (!email) {
      setError("Enter your email.");
      return;
    }
    setLoading(true);
    try {
      const res = await forgotPassword(email.trim().toLowerCase());
      if (!res.success) {
        setError(res.error);
        return;
      }
      router.push({
        pathname: "/(auth)/verify-otp",
        params: { email: email.trim().toLowerCase(), mode: "reset" },
      });
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
              Reset password
            </Text>
            <Text className="mb-6 text-base" style={{ color: colors.textSecondary }}>
              We'll send a 6-digit code to your email.
            </Text>
          </Animated.View>

          <Animated.View style={cardStyle}>
            <GlassCard>
              <FormInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="you@uwaterloo.ca"
              />

              {error ? (
                <Text className="mb-4 text-sm text-destructive">{error}</Text>
              ) : null}

              <GradientButton label="Send Code" onPress={onSubmit} loading={loading} />
            </GlassCard>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

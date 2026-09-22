import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { router, Link } from "expo-router";
import { login } from "@/api/authApi";
import { supabase } from "@/lib/supabase";
import { useGuest } from "@/contexts/GuestContext";
import { useEntrance } from "@/lib/motion";
import { colors } from "@/lib/theme";
import { AuroraBackground } from "@/components/AuroraBackground";
import { GlassCard } from "@/components/GlassCard";
import { FormInput } from "@/components/FormInput";
import { GradientButton } from "@/components/GradientButton";

export default function LoginScreen() {
  const { enterGuestMode } = useGuest();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberDevice, setRememberDevice] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const headingStyle = useEntrance();
  const cardStyle = useEntrance(120);

  const onSubmit = async () => {
    setError(null);
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await login(email.trim().toLowerCase(), password, rememberDevice);
      if (!res.success) {
        setError(res.error);
        return;
      }
      if (res.session) {
        await supabase.auth.setSession(res.session);
        router.replace("/(tabs)/home");
        return;
      }
      if (res.requiresOtp) {
        router.push({
          pathname: "/(auth)/verify-otp",
          params: { email: email.trim().toLowerCase(), mode: "login", rememberDevice: rememberDevice ? "1" : "0" },
        });
        return;
      }
      setError("Unexpected response from server.");
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
              Welcome back
            </Text>
            <Text className="mb-6 text-base" style={{ color: colors.textSecondary }}>
              Sign in to keep exploring campus.
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
              <FormInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="••••••••"
              />

              <View className="mb-6 flex-row items-center justify-between">
                <Text className="text-sm" style={{ color: colors.textSecondary }}>
                  Remember this device
                </Text>
                <Switch value={rememberDevice} onValueChange={setRememberDevice} trackColor={{ true: colors.accentStart }} />
              </View>

              {error ? (
                <Text className="mb-4 text-sm text-destructive">{error}</Text>
              ) : null}

              <GradientButton label="Log In" onPress={onSubmit} loading={loading} />
            </GlassCard>
          </Animated.View>

          <Pressable onPress={() => router.push("/(auth)/forgot-password")} className="mt-5 items-center">
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              Forgot password?
            </Text>
          </Pressable>

          <View className="mt-6 flex-row justify-center gap-1">
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              New here?
            </Text>
            <Link href="/(auth)/signup" className="text-sm font-semibold" style={{ color: colors.accentMid }}>
              Create an account
            </Link>
          </View>

          <Pressable
            onPress={() => {
              enterGuestMode();
              router.replace("/(tabs)/home");
            }}
            className="mt-6 items-center"
          >
            <Text className="text-sm font-medium" style={{ color: colors.textSecondary }}>
              Continue as guest
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

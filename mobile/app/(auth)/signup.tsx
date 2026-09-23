import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { signup } from "@/api/authApi";
import { useEntrance } from "@/lib/motion";
import { colors } from "@/lib/theme";
import { AuroraBackground } from "@/components/AuroraBackground";
import { GlassCard } from "@/components/GlassCard";
import { FormInput } from "@/components/FormInput";
import { GradientButton } from "@/components/GradientButton";

export default function SignupScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await signup(email.trim().toLowerCase(), password, name.trim() || undefined);
      if (!res.success) {
        setError(res.error);
        return;
      }
      router.replace("/(auth)/login");
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
              Create your account
            </Text>
            <Text className="mb-6 text-base" style={{ color: colors.textSecondary }}>
              Join what's happening on campus.
            </Text>
          </Animated.View>

          <Animated.View style={cardStyle}>
            <GlassCard>
              <FormInput label="Name" value={name} onChangeText={setName} placeholder="Your name" />
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
                secureTextEntry={!showPassword}
                placeholder="At least 8 characters"
                trailing={
                  <Pressable
                    onPress={() => setShowPassword((v) => !v)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={colors.textMuted}
                    />
                  </Pressable>
                }
              />

              {error ? (
                <Text className="mb-4 text-sm text-destructive">{error}</Text>
              ) : null}

              <GradientButton label="Sign Up" onPress={onSubmit} loading={loading} />
            </GlassCard>
          </Animated.View>

          <View className="mt-6 flex-row justify-center gap-1">
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              Already have an account?
            </Text>
            <Pressable onPress={() => router.replace("/(auth)/login")}>
              <Text className="text-sm font-semibold" style={{ color: colors.accentMid }}>
                Log in
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

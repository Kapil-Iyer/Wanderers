import "../global.css";
import { useEffect, useState } from "react";
import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { GuestProvider } from "@/contexts/GuestContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { SplashScreen } from "@/components/SplashScreen";

const queryClient = new QueryClient();
const SPLASH_DURATION_MS = 4500;

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaProvider>
      <GuestProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <StatusBar style="light" />
            {showSplash ? <SplashScreen /> : <Slot />}
          </QueryClientProvider>
        </AuthProvider>
      </GuestProvider>
    </SafeAreaProvider>
  );
}

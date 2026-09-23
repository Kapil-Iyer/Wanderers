import "../global.css";
import { useCallback, useEffect, useState } from "react";
import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import * as NativeSplashScreen from "expo-splash-screen";
import { GuestProvider } from "@/contexts/GuestContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { SplashScreen } from "@/components/SplashScreen";

// Keep the native splash (app.json's expo-splash-screen config - same pin
// mark, same dark background) on screen until our animated SplashScreen
// component has actually rendered its first frame, so there's no gap
// between them on a cold start. Must run at module scope, before mount.
NativeSplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient();
const SPLASH_DURATION_MS = 4500;

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  // Fires after the first paint, i.e. once our SplashScreen (below) is
  // already on screen - hiding the native one here reveals it seamlessly
  // instead of racing it.
  const onFirstPaint = useCallback(() => {
    NativeSplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaProvider onLayout={onFirstPaint}>
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

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppSettingsProvider } from "@/contexts/AppSettingsContext";
import { ExercisesProvider } from "@/contexts/ExercisesContext";
import { WorkoutSessionProvider } from "@/contexts/WorkoutSessionContext";
import { UserProvider, useUser } from "@/contexts/UserContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useUser();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'login';

    if (!isAuthenticated && !inAuthGroup) {
      console.log('[AuthGuard] Not authenticated, redirecting to login');
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      console.log('[AuthGuard] Authenticated, redirecting to tabs');
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments, router]);

  return <>{children}</>;
}

function RootLayoutNav() {
  return (
    <AuthGuard>
      <Stack
        screenOptions={{
          headerBackTitle: "Back",
          headerShown: false,
        }}
      >
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </AuthGuard>
  );
}

export default function RootLayout() {
  useEffect(() => {
    console.log("[RootLayout] mounted", { platform: Platform.OS });
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppSettingsProvider>
        <UserProvider>
          <ExercisesProvider>
            <WorkoutSessionProvider>
              {Platform.OS === "web" ? (
                <View style={styles.container} testID="root-web-container">
                  <RootLayoutNav />
                </View>
              ) : (
                <GestureHandlerRootView
                  style={styles.container}
                  testID="root-gesture-handler-container"
                >
                  <RootLayoutNav />
                </GestureHandlerRootView>
              )}
            </WorkoutSessionProvider>
          </ExercisesProvider>
        </UserProvider>
      </AppSettingsProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

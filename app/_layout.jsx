import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { View, ActivityIndicator } from "react-native";
import "../global.css";

function RootNavigation() {
  const { user, token, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inTabsGroup = segments[0] === "(tabs)";
    const inSetupGroup = segments[0] === "shop-setup";

    if (!token && (inTabsGroup || inSetupGroup)) {
      // 1. Not logged in? Boot to login page
      router.replace("/");
    } else if (token) {
      // 2. Check if the user has completed their shop profile
      const hasCompletedSetup = !!user?.business_name; 

      if (!hasCompletedSetup && !inSetupGroup) {
        // Logged in, but no business name? Force to Setup
        router.replace("/shop-setup");
      } else if (hasCompletedSetup && !inTabsGroup) {
        // Logged in and setup complete? Proceed to Dashboard
        router.replace("/(tabs)");
      }
    }
  }, [token, user, loading, segments]);

  if (loading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color="#1f2617" size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="shop-setup" />
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigation />
    </AuthProvider>
  );
}
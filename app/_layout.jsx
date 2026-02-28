import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from "expo-router";
import { AppProvider, useApp } from "@/src/context/AppContext";
import { View, ActivityIndicator } from 'react-native';
import "../global.css";

function RootLayoutNav() {
  const { token, loading } = useApp();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Wait until loadStorageData finishes

    const inAuthGroup = segments[0] === "(auth)" || segments.length === 0;

    if (!token && !inAuthGroup) {
      // Not logged in? Go to login
      router.replace("/");
    } else if (token && inAuthGroup) {
      // Logged in? Jump straight to dashboard
      router.replace("/dashboard");
    }
  }, [token, loading, segments]);

  if (loading) {
    return (
      <View className="flex-1 bg-[#1f2617] items-center justify-center">
        <ActivityIndicator size="large" color="#e5fc01" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="dashboard" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <RootLayoutNav />
    </AppProvider>
  );
}
import { useEffect } from "react";
import { Stack, useRouter, useSegments, useRootNavigationState } from "expo-router";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { AppProvider } from "../src/context/AppContext";
import { View, ActivityIndicator } from "react-native";
import "../global.css";

function RootNavigation() {
  const { user, token, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const rootNavState = useRootNavigationState();

  useEffect(() => {
    if (loading || !rootNavState?.key) return;

    const currentRoute = segments[0] ?? '';
    const isAuthRoute  = currentRoute === '' || currentRoute === 'staff-login';
    const isSetupRoute = currentRoute === 'shop-setup';

    const isStaff = user?.role === 'Staff' || user?.permissions !== undefined;
    const hasShopProfile = !!user?.business_name || isStaff;

    if (!token) {
      if (!isAuthRoute) router.replace('/');
      return;
    }

    if (!hasShopProfile) {
      if (!isSetupRoute) router.replace('/shop-setup');
      return;
    }

    // Fully set up — redirect away from auth/setup screens
    if (isAuthRoute || isSetupRoute) {
      router.replace('/(tabs)');
    }

  }, [token, user, loading, segments, rootNavState?.key]);

  if (loading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color="#1f2617" size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      {/* ── Auth & Onboarding ── */}
      <Stack.Screen name="index" />
      <Stack.Screen name="staff-login" />
      <Stack.Screen name="shop-setup" />
      <Stack.Screen name="setup-inventory" />

      {/* ── Main App ── */}
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />

      {/* ── Modal / Push Screens ── */}
      <Stack.Screen name="subscription" />
      <Stack.Screen name="customer" />
      <Stack.Screen name="review" />

      {/* ── Dynamic Routes ── */}
      <Stack.Screen name="subcategory/[id]" />
      <Stack.Screen name="products/[id]" />
      <Stack.Screen name="bill/[id]" />
      <Stack.Screen name="khata/[id]" />
      <Stack.Screen name="staff/index" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppProvider>
        <RootNavigation />
      </AppProvider>
    </AuthProvider>
  );
}
import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { AppProvider } from "../src/context/AppContext";
import { View, ActivityIndicator } from "react-native";
import "../global.css";

function RootNavigation() {
  const { user, token, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Identify which type of route the user is currently on
    const isAuthRoute = segments.length === 0 || segments[0] === "index"; // The Login Screen
    const isSetupRoute = segments[0] === "shop-setup"; // The Setup Screen
    
    // Check if the user is fully logged in and has completed setup
    const hasCompletedSetup = !!user?.business_name;

    if (!token && !isAuthRoute) {
      // 1. Not logged in, but trying to access protected pages? Boot to login.
      router.replace("/");
    } 
    else if (token) {
      if (!hasCompletedSetup && !isSetupRoute) {
        // 2. Logged in, but setup is incomplete? Force to Setup screen.
        router.replace("/shop-setup");
      } 
      else if (hasCompletedSetup && (isAuthRoute || isSetupRoute)) {
        // 3. Fully setup, but trying to view Login or Setup? Force to Dashboard.
        // THIS IS THE FIX: We only redirect to (tabs) if they are on auth/setup pages.
        // We now allow them to freely visit /subcategory or /products!
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
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="shop-setup" />
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      {/* Expo Router automatically handles /subcategory/[id] and /products/[id] without needing explicit Stack.Screens here, as long as the layout doesn't block them */}
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
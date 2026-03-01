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

    const isAuthRoute = segments.length === 0 || segments[0] === "index" || segments[0] === "staff-login"; 
    const isSetupRoute = segments[0] === "shop-setup"; 
    
    // --- THE MAGIC FIX ---
    // If the user object has "permissions" or role="Staff", they are an employee.
    // Employees bypass the shop setup screen automatically.
    const isStaff = user?.role === 'Staff' || user?.permissions !== undefined;
    const hasCompletedSetup = !!user?.business_name || isStaff;

    if (!token && !isAuthRoute) {
      router.replace("/");
    } 
    else if (token) {
      if (!hasCompletedSetup && !isSetupRoute) {
        router.replace("/shop-setup");
      } 
      else if (hasCompletedSetup && (isAuthRoute || isSetupRoute)) {
        router.replace("/(tabs)");
      }
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
      <Stack.Screen name="index" />
      <Stack.Screen name="staff-login" />
      <Stack.Screen name="shop-setup" />
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      
      <Stack.Screen name="subcategory/[id]" />
      <Stack.Screen name="products/[id]" />
      <Stack.Screen name="customer" />
      <Stack.Screen name="review" />
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
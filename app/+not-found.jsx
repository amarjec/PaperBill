import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    // We use the dark primary color (#1f2617) as the background to make it feel premium and final
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#1f2617' }}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View className="flex-1 justify-center px-6">
        
        {/* ── 1. Secure Status Icon ── */}
        <View className="items-center mb-8">
          <View 
            className="w-24 h-24 rounded-[32px] items-center justify-center mb-6"
            style={{ 
              backgroundColor: 'rgba(229, 252, 1, 0.08)', 
              borderWidth: 1, 
              borderColor: 'rgba(229, 252, 1, 0.2)' 
            }}
          >
            <MaterialCommunityIcons name="shield-lock-outline" size={48} color="#e5fc01" />
          </View>
          <Text className="text-white text-3xl font-black tracking-tight mb-2">
            Session Ended
          </Text>
          <Text className="text-white/60 text-center text-sm font-bold px-4 leading-5">
            You have been securely logged out. Your khata and inventory are safely backed up in the cloud.
          </Text>
        </View>

        {/* ── 2. Premium Promotion Card ── */}
        <View 
          className="bg-white/5 rounded-[28px] p-6 mb-10 border border-white/10"
          style={{ shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 }}
        >
          <View className="flex-row items-center mb-4">
            <View className="bg-[#e5fc01] p-2.5 rounded-xl mr-4 shadow-sm">
              <MaterialCommunityIcons name="star-shooting" size={22} color="#1f2617" />
            </View>
            <View>
              <Text className="text-white font-black text-lg tracking-tight">KachaBill Premium</Text>
              <Text className="text-[#e5fc01] text-[10px] font-black uppercase tracking-widest mt-0.5">
                Smart Shop Manager
              </Text>
            </View>
          </View>
          
          <Text className="text-white/70 text-xs font-bold leading-5 mb-5">
            Join thousands of smart shop owners saving time every day. Manage inventory, send PDF bills on WhatsApp, and track customer Udhaar with zero hassle.
          </Text>

          {/* Mini feature badges */}
          <View className="flex-row items-center gap-4 opacity-90">
            <View className="flex-row items-center">
              <Feather name="check-circle" size={12} color="#4ade80" />
              <Text className="text-white text-[10px] font-bold ml-1.5">Secure</Text>
            </View>
            <View className="flex-row items-center">
              <Feather name="check-circle" size={12} color="#4ade80" />
              <Text className="text-white text-[10px] font-bold ml-1.5">Fast</Text>
            </View>
            <View className="flex-row items-center">
              <Feather name="check-circle" size={12} color="#4ade80" />
              <Text className="text-white text-[10px] font-bold ml-1.5">Reliable</Text>
            </View>
          </View>
        </View>

        {/* ── 3. Return to Login Button ── */}
        <Pressable 
          onPress={() => router.replace('/')}
          className="bg-[#e5fc01] flex-row items-center justify-center py-5 px-8 rounded-[20px] w-full active:opacity-80"
          style={{ 
            shadowColor: '#e5fc01', 
            shadowOpacity: 0.3, 
            shadowRadius: 12, 
            shadowOffset: { width: 0, height: 4 }, 
            elevation: 6 
          }}
        >
          <Feather name="log-in" size={18} color="#1f2617" />
          <Text className="text-[#1f2617] font-black text-[15px] uppercase tracking-widest ml-3">
            Log In Again
          </Text>
        </Pressable>

      </View>
    </SafeAreaView>
  );
}
import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function PremiumLock({ children, featureName, description, icon = "lock" }) {
  const router = useRouter();
  const { user } = useAuth();

  // If the user is an Owner with Premium, or a Staff member (whose owner is premium), let them in!
  // Note: Your backend auth middleware should also enforce this for API calls
  const isPremium = user?.isPremium || user?.subscription?.status === 'active';

  if (isPremium) {
    return <>{children}</>;
  }

  // --- FREE USER LOCK SCREEN ---
  return (
    <SafeAreaView className="flex-1 bg-bg justify-center">
      <View className="px-6 py-4 flex-row items-center absolute top-10 left-0 z-10 w-full">
        <Pressable onPress={() => router.back()} className="bg-card p-3 rounded-2xl active:opacity-50">
          <Feather name="arrow-left" size={20} color="#1f2617" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 32 }}>
        <View className="items-center mb-8">
          <View className="bg-accent/20 w-28 h-28 rounded-full items-center justify-center mb-8 border border-accent/30 shadow-lg shadow-accent/20">
            <MaterialCommunityIcons name={icon} size={48} color="#eab308" />
            <View className="absolute -bottom-2 -right-2 bg-primaryText p-2 rounded-full border-2 border-bg">
              <MaterialCommunityIcons name="crown" size={16} color="#eab308" />
            </View>
          </View>
          
          <Text className="text-primaryText text-3xl font-black text-center tracking-tight mb-3">
            Unlock {featureName}
          </Text>
          <Text className="text-secondaryText font-medium text-center text-sm leading-6 px-4">
            {description}
          </Text>
        </View>

        <View className="bg-white p-6 rounded-[32px] border border-card shadow-sm mb-10">
          <View className="flex-row items-center mb-3">
            <View className="bg-card p-2 rounded-full mr-3">
              <Feather name="trending-up" size={14} color="#1f2617" />
            </View>
            <Text className="text-primaryText font-bold text-xs flex-1">Grow your business faster</Text>
          </View>
          <View className="flex-row items-center mb-3">
            <View className="bg-card p-2 rounded-full mr-3">
              <Feather name="shield" size={14} color="#1f2617" />
            </View>
            <Text className="text-primaryText font-bold text-xs flex-1">Secure your shop data</Text>
          </View>
          <View className="flex-row items-center">
            <View className="bg-card p-2 rounded-full mr-3">
              <Feather name="zap" size={14} color="#1f2617" />
            </View>
            <Text className="text-primaryText font-bold text-xs flex-1">Save hours of manual work</Text>
          </View>
        </View>

        <Pressable 
          onPress={() => router.push('/subscription')}
          className="bg-primaryText py-5 rounded-3xl items-center shadow-2xl active:opacity-70 flex-row justify-center mb-4 border border-primaryText"
        >
          <MaterialCommunityIcons name="crown" size={20} color="#e5fc01" />
          <Text className="text-accent font-black uppercase tracking-widest ml-2 text-sm">Upgrade to Premium</Text>
        </Pressable>
        
        <Pressable onPress={() => router.back()} className="py-4 items-center">
          <Text className="text-secondaryText font-bold uppercase tracking-widest text-[10px]">Maybe Later</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
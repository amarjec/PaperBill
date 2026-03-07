import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function PremiumLock({ children, featureName, description, icon = "lock", onClose }) {
  const router = useRouter();
  const { user } = useAuth();

  // 1. Identify if the current user is staff (they will have an owner_id)
  const isStaff = Boolean(user?.owner_id || user?.ownerId);

  // 2. Safely check both the direct user and the populated owner object
  // (Handling both camelCase and snake_case just in case your API formats it differently)
  const owner = user?.owner_id || user?.ownerId;
  const isPremium = 
    user?.isPremium || 
    user?.subscription?.status === 'active' || 
    owner?.isPremium || 
    owner?.subscription?.status === 'active';

  if (isPremium) {
    return <>{children}</>;
  }

  const handleBack = () => {
    if (onClose) {
      onClose(); 
    } else {
      router.back(); 
    }
  };

  // --- FREE USER LOCK SCREEN ---
  return (
    <SafeAreaView className="flex-1 bg-bg justify-center">
      <View className="px-6 py-4 flex-row items-center absolute top-10 left-0 z-10 w-full">
        <Pressable onPress={handleBack} className="bg-card p-3 rounded-2xl active:opacity-50">
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

        {/* 3. Conditional UI: Hide the purchase button if the user is a staff member */}
        {isStaff ? (
          <View className="bg-red-50 p-4 rounded-2xl border border-red-100 mb-4">
            <Text className="text-red-500 font-bold text-center text-xs">
              This is a Premium feature. Ask your shop owner to upgrade their account to unlock it for the team.
            </Text>
          </View>
        ) : (
          <Pressable 
            onPress={() => {
              if (onClose) onClose();
              router.push('/subscription');
            }}
            className="bg-primaryText py-5 rounded-3xl items-center shadow-2xl active:opacity-70 flex-row justify-center mb-4 border border-primaryText"
          >
            <MaterialCommunityIcons name="crown" size={20} color="#e5fc01" />
            <Text className="text-accent font-black uppercase tracking-widest ml-2 text-sm">Upgrade to Premium</Text>
          </Pressable>
        )}
        
        <Pressable onPress={handleBack} className="py-4 items-center">
          <Text className="text-secondaryText font-bold uppercase tracking-widest text-[10px]">Maybe Later</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
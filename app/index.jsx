import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; // ADDED ROUTER
import { useLogin } from '../src/hooks/useLogin';

export default function LoginScreen() {
  const router = useRouter();
  const { handleGoogleLogin, isLoggingIn } = useLogin();

  return (
    <View className="flex-1 bg-bg px-8 justify-between pb-12">
      <StatusBar barStyle="dark-content" />
      
      {/* Brand Section */}
      <View className="items-center mt-24">
        <View className="bg-secondaryText w-20 h-20 rounded-[28px] items-center justify-center border border-secondary/30 mb-6 shadow-sm">
          <MaterialCommunityIcons name="store-edit-outline" color="#e5fc01" size={40} />
        </View>
        <Text className="text-primaryText text-5xl font-black tracking-tighter">Paper Bill</Text>
        <Text className="text-secondary font-medium mt-2">Smart Billing for Modern Shops</Text>
      </View>

      {/* Feature Highlights */}
      <View className="gap-y-3">
        <FeatureItem icon="zap" text="Instant Digital Invoicing" />
        <FeatureItem icon="shield" text="Secure Cloud Sync" />
      </View>

      {/* Action Section */}
      <View>
        {/* Owner Login */}
        <TouchableOpacity 
          onPress={handleGoogleLogin} 
          disabled={isLoggingIn}
          activeOpacity={0.9}
          className="bg-primaryText py-5 rounded-[22px] flex-row items-center justify-center shadow-lg"
        >
          {isLoggingIn ? (
            <ActivityIndicator color="#e5fc01" />
          ) : (
            <>
              <MaterialCommunityIcons name="google" size={20} color="#e5fc01" />
              <Text className="text-accent font-black text-lg ml-3 uppercase tracking-widest">
                Owner Login
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Visual Separator */}
        <View className="flex-row items-center my-5 opacity-20">
          <View className="flex-1 h-[1px] bg-primaryText" />
          <Text className="mx-4 font-black uppercase tracking-widest text-[10px] text-primaryText">OR</Text>
          <View className="flex-1 h-[1px] bg-primaryText" />
        </View>

        {/* Staff Login Portal */}
        <TouchableOpacity 
          onPress={() => router.push('/staff-login')}
          activeOpacity={0.7}
          className="bg-card/40 py-5 rounded-[22px] flex-row items-center justify-center border border-secondary/10"
        >
          <Feather name="users" size={20} color="#1f2617" />
          <Text className="text-primaryText font-black text-lg ml-3 uppercase tracking-widest">
            Staff Portal
          </Text>
        </TouchableOpacity>

        <Text className="text-secondary text-center mt-6 text-[10px] font-bold uppercase tracking-widest opacity-40">
          Secure Login • Paper Bill v2.0
        </Text>
      </View>
    </View>
  );
}

// Atomic Sub-component for reuse
const FeatureItem = ({ icon, text }) => (
  <View className="flex-row items-center bg-card/20 p-5 rounded-2xl border border-secondary/10">
    <Feather name={icon} size={18} color="#1f2617" />
    <Text className="text-primaryText font-bold ml-4">{text}</Text>
  </View>
);
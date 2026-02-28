import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useApp } from '@/src/context/AppContext'; 
import * as Device from 'expo-device';

export default function LoginScreen() {
  const router = useRouter();
  const { loginOwner, deviceId } = useApp();
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '67101226269-osb1bmb7a2b40hjnr0nolmrrps0lelcc.apps.googleusercontent.com',
      iosClientId: '67101226269-n21pml7l3og8aadasvfltmic8p65pref.apps.googleusercontent.com',
      offlineAccess: true,
    });
  }, []);

  const handleOwnerLogin = async () => {
    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        const idToken = response.data.idToken;
        if (!idToken) throw new Error('No ID token found.');
        
        const result = await loginOwner(idToken);
        
        if (result.success) {
          router.replace('/dashboard')
        } else {
          Alert.alert("Auth Error", result.message);
        }
      }
    } catch (error) {
      Alert.alert('Login Failed', 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-[#1f2617]">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 px-8 justify-between pb-12">
          
          {/* Header Section */}
          <View className="items-center mt-20">
            <View className="bg-[#393f35] w-20 h-20 rounded-[28px] items-center justify-center border border-[#bfb5a830] mb-6">
              <MaterialCommunityIcons name="store-edit-outline" color="#e5fc01" size={44} />
            </View>
            <Text className="text-[#f9f8f7] text-5xl font-black tracking-tighter">Paper Bill</Text>
            <Text className="text-[#bfb5a8] text-base font-medium mt-2">Smart Billing for Modern Shops</Text>
          </View>

          {/* Action Card - Staff UI removed for now */}
          <View>
            <TouchableOpacity 
              onPress={handleOwnerLogin}
              disabled={loading}
              className="bg-[#e5fc01] py-5 rounded-[22px] flex-row items-center justify-center shadow-lg active:scale-95"
            >
              {loading ? (
                <ActivityIndicator color="#1f2617" />
              ) : (
                <>
                  <MaterialCommunityIcons name="google" size={22} color="#1f2617" />
                  <Text className="text-[#1f2617] font-black text-lg ml-3">Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>
            <Text className="text-[#bfb5a8] text-center mt-6 text-xs font-medium opacity-60">
              Owner Login • Securely manage inventory & profits.
            </Text>
          </View>

          {/* Footer */}
          <View className="items-center">
            <Text className="text-[#bfb5a840] text-[10px] font-bold tracking-widest uppercase">
              Secure Device ID: {deviceId?.substring(0, 16)}...
            </Text>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
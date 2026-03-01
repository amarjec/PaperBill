import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/src/context/AuthContext';

export default function StaffLoginScreen() {
  const router = useRouter();
  
  // 1. Grab the specific staffLogin function we added to the context
  const { staffLogin } = useAuth(); 
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  // Helper to get or create a persistent Device ID for the Single-Device Policy
  const getDeviceId = async () => {
    let deviceId = await AsyncStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = `device_${Math.random().toString(36).substring(2, 15)}`;
      await AsyncStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  };

  const handleStaffLogin = async () => {
    if (!phoneNumber || pin.length !== 4) {
      return Alert.alert("Error", "Please enter a valid phone number and 4-digit PIN.");
    }

    setLoading(true);
    try {
      const deviceId = await getDeviceId();
      
      // 2. Call the context function directly. It handles the API call AND state updates!
      const res = await staffLogin(phoneNumber, pin, deviceId);
      
      if (!res.success) {
        Alert.alert("Login Failed", res.message || "Invalid credentials.");
      }
      // If success is true, AuthContext sets the user/token state automatically,
      // and your _layout.jsx will instantly redirect them to the dashboard!
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 px-8 justify-center">
        
        <Pressable onPress={() => router.back()} className="absolute top-4 left-6 bg-card p-3 rounded-2xl active:opacity-50">
          <Feather name="arrow-left" size={20} color="#1f2617" />
        </Pressable>

        <View className="mb-10">
          <View className="bg-primaryText w-16 h-16 rounded-[20px] items-center justify-center mb-6 shadow-lg shadow-primaryText/20">
            <Feather name="user-check" size={28} color="#e5fc01" />
          </View>
          <Text className="text-primaryText text-4xl font-black tracking-tighter">Staff Portal</Text>
          <Text className="text-secondaryText font-medium text-sm mt-2 leading-5">
            Enter your registered phone number and the 4-digit PIN provided by your shop owner.
          </Text>
        </View>

        <View className="mb-4">
          <Text className="text-secondaryText text-[10px] font-bold uppercase tracking-widest ml-2 mb-2">Phone Number</Text>
          <TextInput 
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            className="bg-white p-5 rounded-2xl border border-card font-bold text-lg shadow-sm text-primaryText"
            placeholder="e.g. 9876543210"
          />
        </View>

        <View className="mb-10">
          <Text className="text-secondaryText text-[10px] font-bold uppercase tracking-widest ml-2 mb-2">4-Digit PIN</Text>
          <TextInput 
            value={pin}
            onChangeText={setPin}
            keyboardType="numeric"
            secureTextEntry
            maxLength={4}
            className="bg-white p-5 rounded-2xl border border-card font-black text-3xl tracking-[10px] text-center shadow-sm text-primaryText"
            placeholder="••••"
          />
        </View>

        <Pressable 
          onPress={handleStaffLogin} 
          disabled={loading}
          className="bg-primaryText py-5 rounded-2xl items-center shadow-xl shadow-primaryText/30 active:opacity-70"
        >
          {loading ? (
            <ActivityIndicator color="#e5fc01" />
          ) : (
            <Text className="text-accent font-black text-lg uppercase tracking-widest">Authorize Device</Text>
          )}
        </Pressable>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

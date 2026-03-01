import React from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useProfile } from '@/src/hooks/useProfile';

export default function ProfileScreen() {
  const {
    profile, loading, isProcessing,
    editModalVisible, setEditModalVisible, editForm, setEditForm, openEditModal, handleUpdateProfile,
    pinModalVisible, setPinModalVisible, pinForm, setPinForm, handleSetPin,
    handleLogout, handleDeleteAccount
  } = useProfile();

  if (loading || !profile) {
    return (
      <SafeAreaView className="flex-1 bg-bg justify-center items-center">
        <ActivityIndicator size="large" color="#1f2617" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="px-6 py-4 flex-row justify-between items-center">
        <Text className="text-primaryText text-3xl font-black">Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}>
        
        {/* User Badge */}
        <View className="items-center mb-8 mt-4">
          <View className="bg-primaryText/10 w-24 h-24 rounded-full items-center justify-center mb-4">
            <Feather name="user" size={40} color="#1f2617" />
          </View>
          <Text className="text-primaryText font-black text-2xl">{profile.name}</Text>
          <Text className="text-secondaryText font-bold text-xs mt-1">{profile.email}</Text>
        </View>

        {/* Business Details Card */}
        <View className="mb-6">
          <View className="flex-row justify-between items-end mb-3 ml-2">
            <Text className="text-secondaryText text-[10px] font-bold uppercase tracking-widest">Business Details</Text>
            <Pressable onPress={openEditModal} className="active:opacity-50">
              <Text className="text-accent font-black text-[10px] uppercase tracking-widest bg-primaryText px-2 py-1 rounded">Edit</Text>
            </Pressable>
          </View>
          <View className="bg-white p-6 rounded-[32px] border border-card shadow-sm">
            <View className="mb-4">
              <Text className="text-secondaryText text-[10px] uppercase font-bold tracking-widest mb-1">Shop Name</Text>
              <Text className="text-primaryText font-black text-lg">{profile.business_name || 'Not Set'}</Text>
            </View>
            <View className="mb-4">
              <Text className="text-secondaryText text-[10px] uppercase font-bold tracking-widest mb-1">Phone Number</Text>
              <Text className="text-primaryText font-bold text-base">{profile.phone_number || 'Not Set'}</Text>
            </View>
            <View>
              <Text className="text-secondaryText text-[10px] uppercase font-bold tracking-widest mb-1">Address</Text>
              <Text className="text-primaryText font-bold text-sm leading-5">{profile.address || 'Not Set'}</Text>
            </View>
          </View>
        </View>

        {/* Security Card */}
        <View className="mb-6">
          <Text className="text-secondaryText text-[10px] font-bold uppercase tracking-widest mb-3 ml-2">Security</Text>
          <Pressable 
            onPress={() => setPinModalVisible(true)}
            className="bg-primaryText p-5 rounded-3xl flex-row justify-between items-center active:opacity-70 shadow-lg"
          >
            <View className="flex-row items-center">
              <View className="bg-white/10 p-2 rounded-full mr-3">
                <Feather name="lock" size={16} color="#e5fc01" />
              </View>
              <View>
                <Text className="text-accent font-black text-sm uppercase tracking-widest">Owner PIN</Text>
                <Text className="text-secondary font-bold text-[10px] mt-0.5 opacity-80">Used to view profits & unlock app</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color="#e5fc01" />
          </Pressable>
        </View>

        {/* Subscription Info */}
        <View className="mb-8">
          <Text className="text-secondaryText text-[10px] font-bold uppercase tracking-widest mb-3 ml-2">Plan Details</Text>
          <View className="bg-card/30 p-5 rounded-3xl border border-secondary/10 flex-row justify-between items-center">
            <View className="flex-row items-center">
              <MaterialCommunityIcons name={profile.isPremium ? "crown" : "star-outline"} size={24} color={profile.isPremium ? "#eab308" : "#bfb5a8"} />
              <View className="ml-3">
                <Text className="text-primaryText font-black text-sm uppercase tracking-widest">{profile.subscription?.plan_name || 'Free Plan'}</Text>
                <Text className="text-secondaryText font-bold text-[10px] mt-0.5">
                  {profile.isPremium ? 'Active Subscription' : 'Upgrade to unlock more features'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Danger Zone */}
        <View className="mb-10 border-t border-card/50 pt-6">
          <Pressable onPress={handleLogout} className="bg-card p-5 rounded-3xl flex-row items-center justify-center mb-4 active:opacity-50">
            <Feather name="log-out" size={18} color="#1f2617" />
            <Text className="text-primaryText font-black uppercase tracking-widest ml-3">Log Out</Text>
          </Pressable>
          
          <Pressable onPress={handleDeleteAccount} className="bg-red-500/10 border border-red-500/20 p-5 rounded-3xl flex-row items-center justify-center active:opacity-50">
            <Feather name="trash-2" size={18} color="#ef4444" />
            <Text className="text-red-500 font-black uppercase tracking-widest ml-3">Delete Account</Text>
          </Pressable>
        </View>

      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-black/70 justify-end">
          <View className="bg-bg p-8 rounded-t-[40px]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-primaryText text-2xl font-black">Edit Shop Details</Text>
              <Pressable onPress={() => setEditModalVisible(false)} className="bg-card p-2 rounded-full active:opacity-50">
                <Feather name="x" size={20} color="#1f2617" />
              </Pressable>
            </View>

            <View className="mb-4">
              <Text className="text-secondaryText text-[10px] font-bold uppercase ml-2 mb-2">Shop Name</Text>
              <TextInput value={editForm.business_name} onChangeText={v => setEditForm({...editForm, business_name: v})} className="bg-white p-4 rounded-2xl border border-card font-bold shadow-sm text-primaryText" placeholder="Shop Name" />
            </View>
            <View className="mb-4">
              <Text className="text-secondaryText text-[10px] font-bold uppercase ml-2 mb-2">Phone Number</Text>
              <TextInput value={editForm.phone_number} onChangeText={v => setEditForm({...editForm, phone_number: v})} keyboardType="phone-pad" className="bg-white p-4 rounded-2xl border border-card font-bold shadow-sm text-primaryText" placeholder="Phone Number" />
            </View>
            <View className="mb-8">
              <Text className="text-secondaryText text-[10px] font-bold uppercase ml-2 mb-2">Address</Text>
              <TextInput value={editForm.address} onChangeText={v => setEditForm({...editForm, address: v})} multiline numberOfLines={3} className="bg-white p-4 rounded-2xl border border-card font-bold shadow-sm text-primaryText" placeholder="Full Address" />
            </View>

            <Pressable onPress={handleUpdateProfile} disabled={isProcessing} className="bg-primaryText py-5 rounded-[22px] items-center mb-10 shadow-lg active:opacity-70">
              {isProcessing ? <ActivityIndicator color="#e5fc01" /> : <Text className="text-accent font-black text-lg tracking-widest uppercase">Save Details</Text>}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Set/Update Security PIN Modal */}
      <Modal visible={pinModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-black/80 justify-center px-8">
          <View className="bg-bg p-8 rounded-[40px] shadow-2xl items-center">
            <View className="bg-primaryText/10 w-16 h-16 rounded-full items-center justify-center mb-6">
              <Feather name="lock" size={28} color="#1f2617" />
            </View>
            <Text className="text-primaryText text-2xl font-black mb-2 text-center">Set Owner PIN</Text>
            <Text className="text-secondaryText font-medium text-xs mb-6 text-center">Enter a 4-digit PIN to secure your profits and settings.</Text>
            
            <TextInput 
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
              value={pinForm.pin}
              onChangeText={v => setPinForm({...pinForm, pin: v})}
              className="bg-white w-full p-4 rounded-2xl border border-card font-black text-2xl text-center tracking-[10px] mb-4 shadow-sm"
              placeholder="••••"
            />
            <TextInput 
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
              value={pinForm.confirmPin}
              onChangeText={v => setPinForm({...pinForm, confirmPin: v})}
              className="bg-white w-full p-4 rounded-2xl border border-card font-black text-2xl text-center tracking-[10px] mb-6 shadow-sm"
              placeholder="Confirm ••••"
            />
            
            <View className="flex-row gap-3 w-full">
              <Pressable onPress={() => { setPinModalVisible(false); setPinForm({pin:'', confirmPin:''}); }} className="flex-1 bg-card py-4 rounded-2xl items-center active:opacity-50">
                <Text className="text-primaryText font-bold">Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSetPin} disabled={isProcessing} className="flex-[1.5] bg-primaryText py-4 rounded-2xl items-center active:opacity-50">
                {isProcessing ? <ActivityIndicator color="#e5fc01" /> : <Text className="text-accent font-black uppercase tracking-widest">Set PIN</Text>}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}
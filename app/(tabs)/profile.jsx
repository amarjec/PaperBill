import React from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useProfile } from '@/src/hooks/useProfile';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();
  const {
    profile, loading, isProcessing, isStaff,
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

  // Helper to render staff permissions beautifully
  const renderPermissions = () => {
    if (!isStaff || !profile.permissions) return null;
    const modules = Object.keys(profile.permissions);
    
    return (
      <View className="mb-6">
        <Text className="text-secondaryText text-[10px] font-bold uppercase tracking-widest mb-3 ml-2">Your Access Level</Text>
        <View className="bg-white p-6 rounded-[32px] border border-card shadow-sm flex-row flex-wrap justify-between">
          {modules.map(mod => {
            const hasRead = profile.permissions[mod].read;
            const hasCreate = profile.permissions[mod].create;
            const hasUpdate = profile.permissions[mod].update;
            const hasDelete = profile.permissions[mod].delete;
            
            let level = "No Access";
            let color = "text-red-500";
            if (hasRead && !hasCreate && !hasUpdate && !hasDelete) { level = "View Only"; color = "text-orange-400"; }
            else if (hasRead && hasCreate && !hasDelete) { level = "Standard"; color = "text-blue-500"; }
            else if (hasRead && hasCreate && hasUpdate && hasDelete) { level = "Full Access"; color = "text-[#4ade80]"; }

            return (
              <View key={mod} className="w-[48%] mb-4 bg-bg p-3 rounded-2xl border border-card items-center justify-center py-4">
                <Text className="text-primaryText font-black text-xs uppercase tracking-widest">{mod}</Text>
                <Text className={`font-bold text-[10px] uppercase mt-1 ${color}`}>{level}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="px-6 py-4 flex-row justify-between items-center">
        <Text className="text-primaryText text-3xl font-black">{isStaff ? 'Staff Profile' : 'Shop Profile'}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}>
        
        {/* User Badge */}
        <View className="items-center mb-8 mt-4">
          <View className="bg-primaryText/10 w-24 h-24 rounded-full items-center justify-center mb-4">
            <Feather name={isStaff ? "user-check" : "user"} size={40} color="#1f2617" />
          </View>
          <Text className="text-primaryText font-black text-2xl">{profile.name}</Text>
          <Text className="text-secondaryText font-bold text-xs mt-1">
            {isStaff ? `Employee ID: ${profile.phone_number}` : profile.email}
          </Text>
          {isStaff && (
  <View className={`px-3 py-1 rounded-md mt-3 border ${profile.status === 'Suspended' ? 'bg-red-500/10 border-red-500/20' : 'bg-[#4ade80]/10 border-[#4ade80]/20'}`}>
    <Text className={`text-[10px] font-black uppercase tracking-widest ${profile.status === 'Suspended' ? 'text-red-500' : 'text-[#4ade80]'}`}>
      {profile.status === 'Suspended' ? 'Suspended Account' : 'Staff Member'}
    </Text>
  </View>
)}
        </View>

        {/* --- OWNER ONLY SECTIONS --- */}
        {!isStaff && (
          <>
            {/* Subscription & Upgrade Card - MOVED TO TOP FOR VISIBILITY */}
            <View className="mb-8">
              <Text className="text-secondaryText text-[10px] font-bold uppercase tracking-widest mb-3 ml-2">Plan Details</Text>
              <Pressable 
                onPress={() => !profile.isPremium && router.push('/subscription')}
                className={`p-6 rounded-[32px] border flex-row justify-between items-center shadow-sm ${profile.isPremium ? 'bg-primaryText border-primaryText' : 'bg-white border-card active:opacity-70'}`}
              >
                <View className="flex-row items-center flex-1">
                  <View className={`p-3 rounded-2xl mr-4 ${profile.isPremium ? 'bg-accent/20' : 'bg-card'}`}>
                    <MaterialCommunityIcons name={profile.isPremium ? "crown" : "star-outline"} size={24} color={profile.isPremium ? "#eab308" : "#1f2617"} />
                  </View>
                  <View className="flex-1 pr-2">
                    <Text className={`font-black text-base uppercase tracking-widest ${profile.isPremium ? 'text-accent' : 'text-primaryText'}`}>
                      {profile.isPremium ? 'Premium Active' : 'Free Plan'}
                    </Text>
                    <Text className={`font-medium text-[10px] mt-1 ${profile.isPremium ? 'text-secondary opacity-80' : 'text-secondaryText'}`}>
                      {profile.isPremium ? 'All features unlocked' : 'Tap to unlock analytics & staff'}
                    </Text>
                  </View>
                </View>
                {!profile.isPremium && (
                  <View className="bg-accent px-3 py-2 rounded-xl">
                    <Text className="text-primaryText font-black text-[10px] uppercase tracking-widest">Upgrade</Text>
                  </View>
                )}
              </Pressable>
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

            {/* Quick Actions Grid */}
            <View className="mb-6">
              <Text className="text-secondaryText text-[10px] font-bold uppercase tracking-widest mb-3 ml-2">Management</Text>
              
              <Pressable 
                onPress={() => router.push('/staff')} 
                className="bg-white p-5 rounded-3xl flex-row justify-between items-center border border-card shadow-sm mb-3 active:opacity-70"
              >
                <View className="flex-row items-center">
                  <View className="bg-blue-500/10 p-3 rounded-2xl mr-4">
                    <Feather name="users" size={18} color="#3b82f6" />
                  </View>
                  <View>
                    <Text className="text-primaryText font-black text-sm uppercase tracking-widest">Manage Staff</Text>
                    <Text className="text-secondaryText font-bold text-[10px] mt-0.5">Control access and permissions</Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={20} color="#bfb5a8" />
              </Pressable>

              <Pressable 
                onPress={() => router.push('/setup-inventory')} 
                className="bg-white p-5 rounded-3xl flex-row justify-between items-center border border-card shadow-sm active:opacity-70"
              >
                <View className="flex-row items-center">
                  <View className="bg-orange-500/10 p-3 rounded-2xl mr-4">
                    <Feather name="package" size={18} color="#f97316" />
                  </View>
                  <View>
                    <Text className="text-primaryText font-black text-sm uppercase tracking-widest">Bulk Add Products</Text>
                    <Text className="text-secondaryText font-bold text-[10px] mt-0.5">Auto inventory setup</Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={20} color="#bfb5a8" />
              </Pressable>
            </View>

            {/* Security Card */}
            <View className="mb-6">
              <Text className="text-secondaryText text-[10px] font-bold uppercase tracking-widest mb-3 ml-2">Security</Text>
              <Pressable 
                onPress={() => setPinModalVisible(true)}
                className="bg-white p-5 rounded-3xl flex-row justify-between items-center border border-card shadow-sm active:opacity-70"
              >
                <View className="flex-row items-center">
                  <View className="bg-primaryText/5 p-3 rounded-2xl mr-4">
                    <Feather name="lock" size={18} color="#1f2617" />
                  </View>
                  <View>
                    <Text className="text-primaryText font-black text-sm uppercase tracking-widest">Owner PIN</Text>
                    <Text className="text-secondaryText font-bold text-[10px] mt-0.5">Used to view profits & unlock app</Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={20} color="#bfb5a8" />
              </Pressable>
            </View>
          </>
        )}

        {/* --- STAFF ONLY SECTIONS --- */}
        {isStaff && renderPermissions()}

        {/* --- COMMON SECTIONS (Logout/Delete) --- */}
        <View className="mb-10 border-t border-card/50 pt-8 mt-2">
          <Pressable onPress={handleLogout} className="bg-card/40 border border-secondary/10 py-5 rounded-2xl flex-row items-center justify-center mb-4 active:opacity-50">
            <Feather name="log-out" size={18} color="#1f2617" />
            <Text className="text-primaryText font-black uppercase tracking-widest ml-3">Log Out</Text>
          </Pressable>
          
          {!isStaff && (
            <Pressable onPress={handleDeleteAccount} className="py-4 flex-row items-center justify-center active:opacity-50">
              <Feather name="trash-2" size={14} color="#ef4444" />
              <Text className="text-red-500 font-bold uppercase tracking-widest text-[10px] ml-2">Delete Account Forever</Text>
            </Pressable>
          )}
        </View>

      </ScrollView>

      {/* --- MODALS --- */}
      {!isStaff && (
        <>
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
        </>
      )}

    </SafeAreaView>
  );
}
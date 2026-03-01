import React from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStaff } from '@/src/hooks/useStaff';

export default function StaffManagementScreen() {
  const router = useRouter();
  const {
    staffList, loading, isProcessing,
    modalVisible, setModalVisible, isEditing, formData, setFormData,
    openAddModal, openEditModal, togglePermission, handleSubmit, handleDelete
  } = useStaff();

  const MODULES = ['bills', 'products', 'customers', 'khata'];
  const ACTIONS = ['create', 'read', 'update', 'delete'];

  // Custom Checkbox Component for the Permission Grid
  const Checkbox = ({ isChecked, onPress, label }) => (
    <Pressable onPress={onPress} className="flex-row items-center mb-3 w-[48%] active:opacity-70">
      <View className={`w-5 h-5 rounded flex-items-center justify-center border mr-2 ${isChecked ? 'bg-[#4ade80] border-[#4ade80]' : 'bg-transparent border-card'}`}>
        {isChecked && <Feather name="check" size={14} color="#1f2617" />}
      </View>
      <Text className="text-secondaryText font-bold text-xs capitalize">{label}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-bg">
      {/* Header */}
      <View className="px-6 py-4 flex-row justify-between items-center">
        <Pressable onPress={() => router.back()} className="bg-card p-3 rounded-2xl active:opacity-50">
          <Feather name="arrow-left" size={20} color="#1f2617" />
        </Pressable>
        <Text className="text-primaryText text-xl font-black">Staff Management</Text>
        <Pressable onPress={openAddModal} className="bg-primaryText p-3 rounded-2xl active:opacity-50 shadow-sm">
          <Feather name="plus" size={20} color="#e5fc01" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#1f2617" className="mt-10" />
        ) : staffList.length === 0 ? (
          <View className="items-center mt-20 opacity-50">
            <Feather name="users" size={48} color="#393f35" className="mb-4" />
            <Text className="text-primaryText font-bold">No staff members added yet.</Text>
            <Text className="text-secondaryText text-xs text-center mt-2">Add staff to delegate tasks while keeping your sensitive data secure.</Text>
          </View>
        ) : (
          staffList.map((staff) => (
            <View key={staff._id} className="bg-white p-5 rounded-[32px] mb-4 border border-card shadow-sm">
              <View className="flex-row justify-between items-start mb-4">
                <View className="flex-row items-center flex-1">
                  <View className="bg-primaryText/10 w-12 h-12 rounded-full items-center justify-center mr-3">
                    <Feather name="user" size={20} color="#1f2617" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-primaryText font-black text-lg" numberOfLines={1}>{staff.name}</Text>
                    <Text className="text-secondaryText font-bold text-xs">{staff.phone_number}</Text>
                  </View>
                </View>
                <View className={`px-2 py-1 rounded border ${staff.status === 'Active' ? 'bg-[#4ade80]/10 border-[#4ade80]/20 text-[#4ade80]' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                  <Text className={`text-[9px] font-black uppercase tracking-widest ${staff.status === 'Active' ? 'text-[#4ade80]' : 'text-red-500'}`}>{staff.status}</Text>
                </View>
              </View>

              <View className="flex-row justify-between pt-4 border-t border-card/50">
                <Pressable onPress={() => handleDelete(staff._id)} className="bg-red-50 px-4 py-2 rounded-xl border border-red-100 active:opacity-50">
                  <Text className="text-red-500 font-bold text-xs uppercase tracking-widest">Remove</Text>
                </Pressable>
                <Pressable onPress={() => openEditModal(staff)} className="bg-primaryText px-6 py-2 rounded-xl active:opacity-50">
                  <Text className="text-accent font-black text-xs uppercase tracking-widest">Edit Details</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add/Edit Staff Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-bg">
          <View className="px-6 py-4 flex-row justify-between items-center border-b border-card/50 pb-4">
            <Text className="text-primaryText text-2xl font-black">{isEditing ? 'Edit Staff' : 'Add Staff'}</Text>
            <Pressable onPress={() => setModalVisible(false)} className="bg-card p-3 rounded-full active:opacity-50">
              <Feather name="x" size={20} color="#1f2617" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
            {/* Basic Info */}
            <View className="mb-6">
              <Text className="text-secondaryText text-[10px] uppercase font-bold tracking-widest mb-2 ml-1">Basic Info</Text>
              <TextInput 
                value={formData.name} onChangeText={v => setFormData({...formData, name: v})}
                placeholder="Full Name" className="bg-white p-4 rounded-2xl border border-card font-bold shadow-sm mb-3" 
              />
              <TextInput 
                value={formData.phone_number} onChangeText={v => setFormData({...formData, phone_number: v})}
                placeholder="Phone Number (Login ID)" keyboardType="phone-pad" className="bg-white p-4 rounded-2xl border border-card font-bold shadow-sm mb-3" 
              />
              <TextInput 
                value={formData.assigned_pin} onChangeText={v => setFormData({...formData, assigned_pin: v})}
                placeholder={isEditing ? "Enter new PIN to reset (leave blank to keep)" : "Set 4-Digit Login PIN"} 
                keyboardType="numeric" maxLength={4} className="bg-white p-4 rounded-2xl border border-card font-black tracking-[5px] shadow-sm text-center" 
              />
            </View>

            {/* Status Toggle */}
            <View className="bg-card/30 p-4 rounded-2xl flex-row justify-between items-center border border-secondary/10 mb-8">
              <View>
                <Text className="text-primaryText font-bold text-sm">Account Status</Text>
                <Text className="text-secondaryText text-[10px] mt-0.5">Suspended staff cannot log in.</Text>
              </View>
              <Switch 
                value={formData.status === 'Active'}
                onValueChange={(val) => setFormData({...formData, status: val ? 'Active' : 'Suspended'})}
                trackColor={{ false: '#393f35', true: '#4ade80' }}
                thumbColor="#fff"
              />
            </View>

            {/* Permissions Grid */}
            <Text className="text-secondaryText text-[10px] uppercase font-bold tracking-widest mb-4 ml-1">Granular Permissions</Text>
            {MODULES.map((module) => (
              <View key={module} className="bg-white p-5 rounded-[24px] mb-4 border border-card shadow-sm">
                <Text className="text-primaryText font-black text-sm uppercase tracking-widest mb-4 border-b border-card pb-2">{module}</Text>
                <View className="flex-row flex-wrap">
                  {ACTIONS.map((action) => (
                    <Checkbox 
                      key={`${module}-${action}`}
                      label={action}
                      isChecked={formData.permissions[module][action]}
                      onPress={() => togglePermission(module, action)}
                    />
                  ))}
                </View>
              </View>
            ))}

          </ScrollView>

          {/* Save Button */}
          <View className="p-6 border-t border-card/50 bg-bg">
            <Pressable onPress={handleSubmit} disabled={isProcessing} className="bg-primaryText py-5 rounded-2xl items-center shadow-lg active:opacity-70">
              {isProcessing ? <ActivityIndicator color="#e5fc01" /> : <Text className="text-accent font-black uppercase tracking-widest text-lg">Save Staff Member</Text>}
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
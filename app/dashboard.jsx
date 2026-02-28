import React from 'react';
import { View, Text, ScrollView, TouchableOpacity} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useApp } from '@/src/context/AppContext';
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Dashboard() {
  const { user, logout } = useApp();

  return (
    <SafeAreaView className="flex-1 bg-[#1f2617]">
      <ScrollView className="px-6 pt-6">
        
        {/* Header: User Welcome */}
        <View className="flex-row justify-between items-center mb-8">
          <View>
            <Text className="text-[#bfb5a8] text-sm font-medium">Welcome back,</Text>
            <Text className="text-[#f9f8f7] text-2xl font-black">{user?.name || 'Owner'}</Text>
          </View>
          <TouchableOpacity onPress={logout} className="bg-[#393f35] p-3 rounded-2xl border border-[#bfb5a820]">
            <Feather name="log-out" size={20} color="#e5fc01" />
          </TouchableOpacity>
        </View>

        {/* Business Summary Card */}
        <View className="bg-[#e5fc01] p-6 rounded-[32px] mb-8 shadow-xl">
          <Text className="text-[#1f2617] font-bold uppercase text-[10px] tracking-widest mb-1">Total Outstanding (Khata)</Text>
          <Text className="text-[#1f2617] text-4xl font-black mb-4">₹ 0.00</Text>
          <View className="flex-row justify-between border-t border-[#1f261710] pt-4">
            <View>
              <Text className="text-[#1f261760] text-[10px] font-bold uppercase">Total Bills</Text>
              <Text className="text-[#1f2617] font-black text-lg">0</Text>
            </View>
            <View className="items-end">
              <Text className="text-[#1f261760] text-[10px] font-bold uppercase">Shop Status</Text>
              <Text className="text-[#1f2617] font-black text-lg">Active</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions Grid */}
        <Text className="text-[#f9f8f7] text-lg font-black mb-4">Quick Actions</Text>
        <View className="flex-row flex-wrap justify-between">
          <ActionButton icon="plus-circle" label="Create Bill" color="#393f35" />
          <ActionButton icon="users" label="Customers" color="#393f35" />
          <ActionButton icon="box" label="Inventory" color="#393f35" />
          <ActionButton icon="bar-chart-2" label="Analytics" color="#393f35" />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// Sub-component for clean Action Tiles
const ActionButton = ({ icon, label, color }) => (
  <TouchableOpacity 
    style={{ backgroundColor: color }}
    className="w-[48%] aspect-square rounded-[28px] p-6 mb-4 justify-between border border-[#bfb5a810] shadow-sm active:scale-95"
  >
    <View className="bg-[#1f2617] w-12 h-12 rounded-2xl items-center justify-center">
      <Feather name={icon} size={22} color="#e5fc01" />
    </View>
    <Text className="text-[#d8d0c4] font-black text-base">{label}</Text>
  </TouchableOpacity>
);
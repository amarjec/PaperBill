import React from 'react';
import { View, Text, TextInput, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useKhataList } from '@/src/hooks/useKhataList';

export default function KhataScreen() {
  const router = useRouter();
  const { debtors, totalMarketDebt, loading, searchTerm, setSearchTerm } = useKhataList();

  return (
    <SafeAreaView className="flex-1 bg-bg">
      {/* Header */}
      <View className="px-6 py-4 flex-row justify-between items-center">
        <View>
          <Text className="text-primaryText text-3xl font-black">Khata Book</Text>
          <Text className="text-secondaryText font-medium text-sm mt-1">Manage pending payments</Text>
        </View>
      </View>

      {/* Total Market Debt Card */}
      <View className="px-6 mb-6 mt-2">
        <View className="bg-red-500/10 p-6 rounded-[32px] border border-red-500/20 shadow-sm flex-row items-center justify-between">
          <View>
            <Text className="text-red-600/80 text-[10px] font-bold uppercase tracking-widest mb-1">To Collect</Text>
            <Text className="text-red-500 text-3xl font-black">₹{totalMarketDebt}</Text>
          </View>
          <View className="bg-red-500/20 w-12 h-12 rounded-full items-center justify-center">
            <MaterialCommunityIcons name="hand-coin" size={24} color="#ef4444" />
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View className="px-6 mb-4">
        <View className="bg-white flex-row items-center px-4 py-3 rounded-2xl border border-card shadow-sm">
          <Feather name="search" size={20} color="#bfb5a8" />
          <TextInput 
            placeholder="Search customer name or phone..." 
            placeholderTextColor="#bfb5a8"
            value={searchTerm}
            onChangeText={setSearchTerm}
            className="flex-1 ml-3 text-primaryText font-bold"
          />
          {searchTerm.length > 0 && (
            <Pressable onPress={() => setSearchTerm('')} className="p-1 active:opacity-50">
              <Feather name="x-circle" size={18} color="#bfb5a8" />
            </Pressable>
          )}
        </View>
      </View>

      {/* List of Debtors */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#1f2617" />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
          <Text className="text-secondaryText text-[10px] font-bold uppercase tracking-widest mb-3 ml-2">Customers with Due</Text>
          
          {debtors.length === 0 ? (
            <View className="items-center justify-center mt-10 opacity-40">
              <MaterialCommunityIcons name="check-decagram" size={48} color="#393f35" />
              <Text className="text-primaryText font-bold mt-4 text-center">All clear!{'\n'}No pending payments.</Text>
            </View>
          ) : (
            debtors.map(customer => (
              <Pressable 
                key={customer._id} 
                onPress={() => router.push(`/khata/${customer._id}`)}
                className="bg-white p-5 rounded-3xl mb-3 border border-card shadow-sm flex-row justify-between items-center active:opacity-70"
              >
                <View className="flex-row items-center flex-1">
                  <View className="bg-red-500/10 w-12 h-12 rounded-full items-center justify-center mr-4">
                    <Feather name="user" size={20} color="#ef4444" />
                  </View>
                  <View className="flex-1 pr-4">
                    <Text className="text-primaryText font-black text-lg" numberOfLines={1}>{customer.name}</Text>
                    <Text className="text-secondaryText text-[10px] font-bold mt-1 uppercase tracking-widest">{customer.phone || 'No Phone'}</Text>
                  </View>
                </View>
                <View className="items-end pl-2">
                  <Text className="text-secondaryText text-[10px] uppercase font-bold tracking-widest mb-1">Due</Text>
                  <Text className="text-red-500 font-black text-lg">₹{customer.total_debt}</Text>
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
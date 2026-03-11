import React from 'react';
import { View, Text, TextInput, ScrollView, Pressable, ActivityIndicator } from 'react-native';
// Replaced SafeAreaView with standard View to prevent double-padding under the global header
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useKhataList } from '@/src/hooks/useKhataList';
import { SearchBar } from '@/src/components/ui/SearchBar';

export default function KhataScreen() {
  const router = useRouter();
  const { debtors, totalMarketDebt, loading, searchTerm, setSearchTerm } = useKhataList();

  return (
    // Changed SafeAreaView to View. The flex-1 ensures it takes the full screen under the header.
    <View className="flex-1 bg-bg">
      
      {/* 1. Reusable Search Bar (Matches Home/SubCategory UI) */}
      <SearchBar
        value={searchTerm} 
        onChangeText={setSearchTerm} 
        placeholder="Search name or phone..." 
      />

      {/* 3. Header Tags (Matching Home UI) */}
      <View className="px-8 flex-row justify-between items-center mb-4 mt-2">
        <Text className="text-primaryText font-black text-lg tracking-tight">Active Ledger</Text>
        <Text className="text-secondaryText font-bold text-[10px] uppercase tracking-widest">
          {debtors.length} Customers
        </Text>
      </View>

      {/* List of Debtors */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#e5fc01" />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
          
          {debtors.length === 0 ? (
            <View className="items-center justify-center mt-12 bg-card/20 border-2 border-dashed border-card/60 rounded-[32px] p-10">
              <View className="w-16 h-16 bg-white rounded-2xl items-center justify-center shadow-sm mb-4">
                <MaterialCommunityIcons name="check-decagram" size={32} color="#bfb5a8" />
              </View>
              <Text className="text-primaryText font-black text-lg mb-1 text-center">All Clear!</Text>
              <Text className="text-secondaryText font-medium text-xs leading-5 text-center">
                No pending payments. Your market collection is zero.
              </Text>
            </View>
          ) : (
            debtors.map(customer => (
              <Pressable 
                key={customer._id} 
                onPress={() => router.push(`/khata/${customer._id}`)}
                className="bg-white px-5 py-4 rounded-[28px] mb-3 border border-card/60 shadow-sm flex-row justify-between items-center active:opacity-70"
                style={{ shadowColor: '#d8d0c4', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }}
              >
                <View className="flex-row items-center flex-1">
                  <View className="bg-primaryText w-12 h-12 rounded-[20px] items-center justify-center mr-4 shadow-sm">
                    <Feather name="user" size={20} color="#e5fc01" />
                  </View>
                  <View className="flex-1 pr-4">
                    <Text className="text-primaryText font-black text-md tracking-tight leading-tight" numberOfLines={1}>
                      {customer.name}
                    </Text>
                    <Text className="text-secondaryText text-[9px] font-black mt-1.5 uppercase tracking-widest opacity-60">
                      {customer.phone || 'No Phone'}
                    </Text>
                  </View>
                </View>
                <View className="items-end pl-2">
                  <Text className="text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded text-[9px] uppercase font-black tracking-widest mb-1.5">
                    Due
                  </Text>
                  <Text className="text-primaryText font-black text-md tracking-tighter">₹{customer.total_debt}</Text>
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

import React from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDashboard } from '@/src/hooks/useDashboard';

export default function DashboardScreen() {
  const router = useRouter();
  const { stats, loading, refresh } = useDashboard();

  return (
    <SafeAreaView className="flex-1 bg-bg">
      {/* Header */}
      <View className="px-6 py-4 flex-row justify-between items-center">
        <View>
          <Text className="text-secondaryText font-bold text-xs uppercase tracking-widest">Welcome Back</Text>
          <Text className="text-primaryText text-2xl font-black">Shop Overview</Text>
        </View>
        <Pressable className="bg-card p-3 rounded-2xl active:opacity-50">
          <Feather name="settings" size={20} color="#1f2617" />
        </Pressable>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#1f2617" />}
      >
        
        {/* Main Stats Grid */}
        <View className="px-6 mt-4 flex-row flex-wrap justify-between gap-y-4">
          
          {/* Revenue Card */}
          <View className="w-[48%] bg-white p-5 rounded-[32px] border border-card shadow-sm">
            <View className="bg-blue-500/10 w-10 h-10 rounded-full items-center justify-center mb-4">
              <Feather name="trending-up" size={18} color="#3b82f6" />
            </View>
            <Text className="text-secondaryText text-[10px] font-bold uppercase tracking-widest">Total Revenue</Text>
            <Text className="text-primaryText font-black text-xl mt-1">₹{stats.totalRevenue}</Text>
          </View>

          {/* Profit Card */}
          <View className="w-[48%] bg-primaryText p-5 rounded-[32px] shadow-lg">
            <View className="bg-accent/20 w-10 h-10 rounded-full items-center justify-center mb-4">
              <MaterialCommunityIcons name="finance" size={18} color="#e5fc01" />
            </View>
            <Text className="text-secondary font-bold text-[10px] uppercase tracking-widest">Gross Profit</Text>
            <Text className="text-accent font-black text-xl mt-1">₹{stats.grossProfit}</Text>
          </View>

          {/* Khata Pending Card */}
          <View className="w-full bg-red-500/10 p-6 rounded-[32px] border border-red-500/20 flex-row justify-between items-center">
            <View>
              <Text className="text-red-600/80 text-[10px] font-bold uppercase tracking-widest">Market Pending (Khata)</Text>
              <Text className="text-red-500 font-black text-3xl mt-1">₹{stats.totalPendingKhata}</Text>
            </View>
            <View className="bg-red-500/20 w-12 h-12 rounded-full items-center justify-center">
              <MaterialCommunityIcons name="hand-back-left" size={24} color="#ef4444" />
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-6 mt-8">
          <Text className="text-secondaryText text-[10px] font-bold uppercase tracking-widest mb-4 ml-2">Quick Actions</Text>
          <View className="flex-row gap-3">
            <Pressable 
              onPress={() => router.push('/(tabs)/billing')}
              className="flex-1 bg-card/40 p-6 rounded-[32px] border border-secondary/10 items-center active:opacity-70"
            >
              <Feather name="plus-circle" size={24} color="#1f2617" />
              <Text className="text-primaryText font-black text-[10px] uppercase tracking-widest mt-2">New Bill</Text>
            </Pressable>
            
            <Pressable 
              onPress={() => router.push('/(tabs)/khata')}
              className="flex-1 bg-card/40 p-6 rounded-[32px] border border-secondary/10 items-center active:opacity-70"
            >
              <MaterialCommunityIcons name="book-open-variant" size={24} color="#1f2617" />
              <Text className="text-primaryText font-black text-[10px] uppercase tracking-widest mt-2">Check Khata</Text>
            </Pressable>
          </View>
        </View>

        {/* Bill Volume Summary */}
        <View className="px-6 mt-8">
          <View className="bg-white p-6 rounded-[32px] border border-card shadow-sm flex-row items-center">
            <View className="bg-accent w-12 h-12 rounded-full items-center justify-center mr-4">
              <Feather name="file-text" size={20} color="#1f2617" />
            </View>
            <View>
              <Text className="text-primaryText font-black text-lg">{stats.totalBillsGenerated}</Text>
              <Text className="text-secondaryText text-[10px] font-bold uppercase tracking-widest">Invoices Processed</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
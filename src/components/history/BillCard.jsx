import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export const BillCard = ({ bill }) => {
  const router = useRouter();

  // Dynamic Status Colors
  const getStatusColor = (status) => {
    switch(status) {
      case 'Paid': return 'text-[#4ade80] bg-[#4ade80]/10 border-[#4ade80]/20';
      case 'Unpaid': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'Partially Paid': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'Cancelled': return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
      default: return 'text-accent bg-accent/10 border-accent/20';
    }
  };

  // Format Date (e.g., "12 Oct 2026")
  const dateObj = new Date(bill.createdAt);
  const dateString = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <Pressable
      onPress={() => router.push(`/bill/${bill._id}`)}
      className="bg-white p-5 rounded-3xl mb-3 border border-card shadow-sm active:opacity-70"
    >
      <View className="flex-row justify-between items-start mb-3">
        <View>
          <Text className="text-primaryText font-black text-lg">
            {bill.customer_id?.name || 'Walk-in Customer'}
          </Text>
          <Text className="text-secondaryText text-[11px] font-bold tracking-widest uppercase mt-0.5">
            {bill.bill_number} • {dateString}
          </Text>
        </View>
        <View className={`px-2.5 py-1 rounded-md border ${getStatusColor(bill.status)}`}>
          <Text className={`text-[10px] font-black uppercase tracking-widest ${getStatusColor(bill.status).split(' ')[0]}`}>
            {bill.is_estimate ? 'Estimate' : bill.status}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center border-t border-card pt-3">
        <View className="flex-row items-center">
          <Feather name="shopping-bag" size={14} color="#bfb5a8" />
          <Text className="text-secondaryText font-bold text-xs ml-2">{bill.items?.length || 0} Items</Text>
        </View>
        <Text className="text-primaryText font-black text-lg">₹{bill.total_amount}</Text>
      </View>
    </Pressable>
  );
};
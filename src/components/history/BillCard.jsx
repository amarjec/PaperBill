import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export const BillCard = ({ bill }) => {
  const router = useRouter();

  // Format Date
  const dateObj = new Date(bill.createdAt);
  const dateString = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  // Mode Styling (Colors for Wholesale vs Retail)
  const isWholesale = bill.price_mode === 'Wholesale';
  const modeTextColor = isWholesale ? 'text-purple-600' : 'text-blue-600';
  const modeBgColor = isWholesale ? 'bg-purple-50' : 'bg-blue-50';

  // Safely extract creator name
  const creatorName = bill.created_by?.name || (typeof bill.created_by === 'string' ? bill.created_by : 'Admin');

  return (
    <Pressable
      onPress={() => router.push(`/bill/${bill._id}`)}
      className="bg-white px-5 py-4 rounded-[28px] mb-3 mt-1 border border-card/60 shadow-sm flex-row justify-between items-center "
    >
      <View className="bg-primaryText w-12 h-12 rounded-[20px] items-center justify-center mr-4 shadow-sm">
              <Feather name="user" size={20} color="#e5fc01" />
          </View>
      {/* Left Side: Name, Mode Badge, and Date/Creator */}
      <View className="flex-1 pr-3">
        
        <View className="flex-row items-center mb-2">
          <Text className="text-primaryText font-extrabold text-[15px] flex-shrink" numberOfLines={1}>
            {bill.customer_id?.name || 'Walk-in Customer'}
          </Text>
          
          {/* Dynamic Retail/Wholesale Tag */}
          <View className={`${modeBgColor} px-1.5 py-0.5 rounded ml-2`}>
            <Text className={`${modeTextColor} text-[8px] font-black uppercase tracking-widest`}>
              {bill.price_mode || 'Retail'}
            </Text>
          </View>
        </View>
        
        {/* Subtitle: Date and Creator */}
        <Text className="text-secondaryText text-[10px] font-bold uppercase mt-0.5">
          {dateString}
        </Text>
      </View>

      {/* Right Side: Just the Amount */}
      <View className="flex items-end justify-center">
        <Text className="text-primaryText font-black text-[14px] py-0.5">
          ₹{bill.total_amount?.toLocaleString('en-IN') || 0}
        </Text>
        <Text className="text-secondaryText text-[10px] font-medium uppercase mt-1">By {creatorName}</Text>
      </View>
    </Pressable>
  );
};
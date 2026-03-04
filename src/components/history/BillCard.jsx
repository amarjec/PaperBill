import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

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
      className="bg-white px-4 py-4 rounded-2xl mb-3 border border-card shadow-sm active:opacity-70 flex-row justify-between items-center"
    >
      {/* Left Side: Name, Mode Badge, and Date/Creator */}
      <View className="flex-1 pr-3">
        <View className="flex-row items-center mb-1">
          <Text className="text-primaryText font-black text-[15px] flex-shrink" numberOfLines={1}>
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
        <Text className="text-primaryText font-black text-[14px]">
          ₹{bill.total_amount?.toLocaleString('en-IN') || 0}
        </Text>
        <Text className="text-secondaryText text-[10px] font-medium uppercase mt-0.5">By {creatorName}</Text>
      </View>
    </Pressable>
  );
};
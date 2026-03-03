import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

export const CustomerCard = ({ customer, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    className="bg-white p-5 rounded-[24px] mb-3 flex-row items-center justify-between border border-card shadow-sm"
  >
    <View className="flex-row items-center flex-1">
      <View className="bg-primaryText/10 w-12 h-12 rounded-full items-center justify-center mr-4">
        <Feather name="user" size={20} color="#1f2617" />
      </View>
      <View className="flex-1">
        <Text className="text-primaryText font-black text-lg" numberOfLines={1}>
          {customer.name}
        </Text>
        <Text className="text-secondaryText text-xs font-bold mt-1">
          {customer.phone || 'No phone number'}
        </Text>
      </View>
    </View>
    <Feather name="chevron-right" size={20} color="#bfb5a8" />
  </TouchableOpacity>
);
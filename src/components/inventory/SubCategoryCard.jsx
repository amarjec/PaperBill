import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

export const SubCategoryCard = ({ subCategory, onPress, onLongPress }) => (
  <TouchableOpacity
    onPress={onPress}
    onLongPress={onLongPress}
    activeOpacity={0.8}
    delayLongPress={300}
    className="bg-card/30 p-5 rounded-[28px] mb-3 flex-row items-center border border-secondary/20 shadow-sm"
  >
    <View className="bg-primaryText w-12 h-12 rounded-full items-center justify-center mr-4">
      <Feather name="folder" size={20} color="#e5fc01" />
    </View>
    
    <View className="flex-1">
      <Text className="text-primaryText font-black text-lg" numberOfLines={1}>
        {subCategory.name}
      </Text>
      <Text className="text-secondaryText text-[10px] font-bold uppercase mt-1 opacity-70">
        Hold to Edit
      </Text>
    </View>
    
    <Feather name="chevron-right" size={20} color="#bfb5a8" />
  </TouchableOpacity>
);
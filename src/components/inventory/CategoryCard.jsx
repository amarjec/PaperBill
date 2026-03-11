import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const CategoryCard = ({ category, onPress, onLongPress }) => (
  <TouchableOpacity 
    onPress={onPress}
    onLongPress={onLongPress}
    activeOpacity={0.8}
    delayLongPress={300} // Triggers long press after 300ms
    className="bg-card w-[48%] aspect-square rounded-[32px] p-5 mb-4 justify-between border border-secondary/20 shadow-sm"
  >
    <View className="bg-primaryText w-12 h-12 rounded-2xl items-center justify-center">
      <MaterialCommunityIcons name="layers-outline" size={24} color="#e5fc01" />
    </View>
    
    <View>
      <Text className="text-primaryText font-black text-lg leading-tight" numberOfLines={2}>
        {category.name}
      </Text>
      <Text className="text-secondaryText text-[10px] font-bold uppercase mt-1">
        Hold to Edit
      </Text>
    </View>
  </TouchableOpacity>
);
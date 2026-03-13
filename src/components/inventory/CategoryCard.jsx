import React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const CategoryCard = ({ category, onPress, onLongPress }) => (
  // The outer View handles the styling, border, and strictly clips the ripple effect
  <View className="w-[48%] aspect-square mb-4 rounded-[32px] overflow-hidden shadow-sm border border-secondary/20 bg-card">
    <Pressable 
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={300}
      // This creates the native Android ripple using your dark text color at 15% opacity
      android_ripple={{ color: 'rgba(31, 38, 23, 0.15)' }} 
      className="flex-1 p-5 justify-between"
      // This ensures iOS still gets a nice fade effect since it doesn't support android_ripple
      style={({ pressed }) => [
        Platform.OS === 'ios' && pressed && { opacity: 0.8 } 
      ]}
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
    </Pressable>
  </View>
);
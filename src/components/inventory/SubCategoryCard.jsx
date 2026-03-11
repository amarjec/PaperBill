import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

export const SubCategoryCard = ({ subCategory, onPress, onLongPress, hasItems }) => (
  <TouchableOpacity
    onPress={onPress}
    onLongPress={onLongPress}
    activeOpacity={0.8}
    delayLongPress={300}
    className={`w-[48%] aspect-square rounded-[32px] p-5 mb-4 justify-between border shadow-sm
      ${hasItems
        ? 'bg-primaryText border-primaryText'
        : 'bg-card border-secondary/20'
      }`}
  >
    {/* Icon — black circle normally, ticked accent circle when items added */}
    <View
      className={`w-12 h-12 rounded-full items-center justify-center
        ${hasItems ? 'bg-accent' : 'bg-primaryText'}`}
    >
      {hasItems ? (
        <Feather name="check" size={22} color="#1f2617" />
      ) : (
        // Empty circle — just the border gives the "black circle" look
        <View className="w-5 h-5 rounded-full border-2 border-secondary/40" />
      )}
    </View>

    {/* Name + hint */}
    <View>
      <Text
        className={`font-black text-lg leading-tight ${hasItems ? 'text-accent' : 'text-primaryText'}`}
        numberOfLines={2}
      >
        {subCategory.name}
      </Text>
      <Text
        className={`text-[10px] font-bold uppercase mt-1 ${hasItems ? 'text-secondary' : 'text-secondaryText opacity-70'}`}
      >
        {hasItems ? 'Items Added ✓' : 'Hold to Edit'}
      </Text>
    </View>
  </TouchableOpacity>
);
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

export const ProductCard = ({ product, quantity, onAdd, onRemove, onLongPress }) => (
  <TouchableOpacity
    onLongPress={onLongPress}
    activeOpacity={0.9}
    delayLongPress={300}
    className="bg-card/20 p-5 rounded-[28px] mb-3 flex-row items-center justify-between border border-secondary/20 shadow-sm"
  >
    <View className="flex-1 pr-4">
      {/* FIX: Use item_name */}
      <Text className="text-primaryText font-black text-lg" numberOfLines={1}>
        {product.item_name}
      </Text>
      <View className="flex-row items-center mt-1">
        {/* FIX: Use retail_price */}
        <Text className="text-primaryText font-bold">₹{product.retail_price}</Text>
        <Text className="text-secondaryText text-[10px] font-bold uppercase ml-2 opacity-60">
          / {product.unit || 'pcs'}
        </Text>
      </View>
    </View>

    <View className="flex-row items-center bg-primaryText rounded-2xl px-2 py-1 shadow-md">
      <TouchableOpacity onPress={onRemove} className="p-2">
        <Feather name="minus" size={18} color="#e5fc01" />
      </TouchableOpacity>
      <Text className="text-bg font-black mx-3 min-w-[20px] text-center">
        {quantity}
      </Text>
      <TouchableOpacity onPress={onAdd} className="p-2">
        <Feather name="plus" size={18} color="#e5fc01" />
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
);
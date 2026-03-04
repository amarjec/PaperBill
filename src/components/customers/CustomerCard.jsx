import React from 'react';
import { View, Text, TouchableOpacity, Vibration } from 'react-native';
import { Feather } from '@expo/vector-icons';

export const CustomerCard = ({ customer, onPress, onLongPress }) => {
  const initials = customer.name
    ?.split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '')
    .join('') || '?';

  const hasDebt = (customer.total_debt || 0) > 0;

  const handleLongPress = () => {
    Vibration.vibrate(50);
    onLongPress?.();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={handleLongPress}
      delayLongPress={300}
      activeOpacity={0.82}
      className="bg-white rounded-[22px] mb-3 flex-row items-center px-4 py-3.5 border border-card"
      style={{
        shadowColor: '#c8c0b4',
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
      }}
    >
      {/* Initials avatar */}
      <View className="w-11 h-11 rounded-2xl bg-primaryText items-center justify-center mr-4" style={{ flexShrink: 0 }}>
        <Text className="text-accent font-black text-sm">{initials}</Text>
      </View>

      {/* Name + phone + address */}
      <View className="flex-1 mr-3">
        <Text className="text-primaryText font-black text-[15px] leading-tight" numberOfLines={1}>
          {customer.name}
        </Text>
        <Text className="text-secondaryText text-[11px] font-bold mt-0.5" numberOfLines={1}>
          {customer.phone ? `📞 ${customer.phone}` : 'No phone'}
          {customer.address ? `   •   ${customer.address}` : ''}
        </Text>
      </View>

      {/* Right: debt badge or chevron */}
      {hasDebt ? (
        <View className="bg-red-50 border border-red-200 px-2.5 py-1 rounded-xl">
          <Text className="text-red-500 font-black text-[10px]">₹{customer.total_debt} due</Text>
        </View>
      ) : (
        <Feather name="chevron-right" size={18} color="#c8c0b4" />
      )}
    </TouchableOpacity>
  );
};
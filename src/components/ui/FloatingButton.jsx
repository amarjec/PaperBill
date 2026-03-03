import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

export const FloatingButton = ({ onPress, icon = "plus", bottomOffset = 30 }) => {
  return (
    <TouchableOpacity 
      activeOpacity={0.8}
      onPress={onPress}
      // Using arbitrary values for bottom offset so it can be adjusted if needed on different screens
      className={`absolute right-6 bg-accent w-16 h-16 rounded-[22px] items-center justify-center shadow-xl border border-accent/50`}
      style={{ 
        bottom: bottomOffset,
        shadowColor: '#e5fc01', 
        shadowOpacity: 0.4, 
        shadowRadius: 15, 
        shadowOffset: { width: 0, height: 8 } 
      }}
    >
      <Feather name={icon} size={28} color="#1f2617" />
    </TouchableOpacity>
  );
};
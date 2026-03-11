import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

export const SearchBar = ({ value, onChangeText, placeholder = "Search..." }) => {
  return (
    <View className="px-6 pt-3 mb-2">
      <View className="bg-white flex-row items-center px-4 py-2.5 rounded-full border border-card shadow-sm">
        <Feather name="search" size={20} color="#bfb5a8" />
        <TextInput 
          placeholder={placeholder} 
          placeholderTextColor="#bfb5a8"
          value={value}
          onChangeText={onChangeText}
          className="flex-1 ml-3 text-primaryText font-bold text-base"
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={() => onChangeText('')} className="bg-bg p-1 rounded-full">
            <Feather name="x" size={16} color="#1f2617" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
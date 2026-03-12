import React from 'react';
import { View, TextInput, Pressable, Platform } from 'react-native';
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
          underlineColorAndroid="transparent" // Ensures no default Android input line appears
        />
        {value.length > 0 && (
          // We wrap it in a view with a rounded-full radius to contain the borderless ripple slightly
          <View className="rounded-full overflow-hidden">
            <Pressable 
              onPress={() => onChangeText('')} 
              android_ripple={{ color: 'rgba(31, 38, 23, 0.2)', borderless: true }}
              className="bg-bg p-1 rounded-full"
              style={({ pressed }) => [
                Platform.OS === 'ios' && pressed && { opacity: 0.6 }
              ]}
            >
              <Feather name="x" size={16} color="#1f2617" />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
};
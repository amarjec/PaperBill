import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';

export const ProductCard = ({ product, quantity, onAdd, onRemove, onQuantityChange, onLongPress }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef(null);

  const isInCart = quantity > 0;

  const openInput = () => {
    setInputVal(String(quantity || ''));
    setIsEditing(true);
    // Small delay so the TextInput mounts before focusing
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const commitInput = () => {
    setIsEditing(false);
    const parsed = parseInt(inputVal, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      onQuantityChange(parsed);
    }
    setInputVal('');
  };

  return (
    <TouchableOpacity
      onLongPress={onLongPress}
      activeOpacity={0.85}
      delayLongPress={300}
      // Compact height — similar to a bill line item
      className={`flex-row items-center px-4 py-3 mb-1.5 rounded-2xl border
        ${isInCart
          ? 'bg-primaryText border-primaryText'
          : 'bg-white border-card'
        }`}
      style={{ minHeight: 56 }}
    >
      {/* ── Left: name + price ─────────────────────────────────────── */}
      <View className="flex-1 pr-3">
        <Text
          className={`font-bold text-sm leading-tight ${isInCart ? 'text-accent' : 'text-primaryText'}`}
          numberOfLines={1}
        >
          {product.item_name}
        </Text>
        <Text className={`text-[11px] font-bold mt-0.5 ${isInCart ? 'text-secondary' : 'text-secondaryText'}`}>
          ₹{product.retail_price}
          <Text className="opacity-50"> / {product.unit || 'pcs'}</Text>
        </Text>
      </View>

      {/* ── Right: quantity controls ───────────────────────────────── */}
      <View className="flex-row items-center">
        {isInCart ? (
          <>
            {/* Minus */}
            <TouchableOpacity
              onPress={onRemove}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="w-7 h-7 rounded-full bg-white/10 items-center justify-center"
            >
              <Feather name="minus" size={14} color="#e5fc01" />
            </TouchableOpacity>

            {/* Qty — tap to type */}
            <TouchableOpacity
              onPress={openInput}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              className="mx-1 min-w-[36px] h-7 bg-accent rounded-lg items-center justify-center px-1"
            >
              {isEditing ? (
                <TextInput
                  ref={inputRef}
                  value={inputVal}
                  onChangeText={setInputVal}
                  onBlur={commitInput}
                  onSubmitEditing={commitInput}
                  keyboardType="numeric"
                  returnKeyType="done"
                  selectTextOnFocus
                  className="text-primaryText font-black text-sm text-center w-full"
                  style={{ padding: 0 }}
                />
              ) : (
                <Text className="text-primaryText font-black text-sm">
                  {quantity}
                </Text>
              )}
            </TouchableOpacity>

            {/* Plus */}
            <TouchableOpacity
              onPress={onAdd}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="w-7 h-7 rounded-full bg-white/10 items-center justify-center"
            >
              <Feather name="plus" size={14} color="#e5fc01" />
            </TouchableOpacity>
          </>
        ) : (
          /* Not in cart — single ADD button */
          <TouchableOpacity
            onPress={onAdd}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="flex-row items-center bg-primaryText px-3 h-8 rounded-xl"
          >
            <Feather name="plus" size={13} color="#e5fc01" />
            <Text className="text-accent font-black text-[11px] ml-1 uppercase tracking-wider">Add</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};
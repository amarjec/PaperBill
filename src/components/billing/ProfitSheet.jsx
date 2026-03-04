import React from 'react';
import { View, Text, ScrollView, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

// ── Single item profit row ────────────────────────────────────────────────────
const ProfitRow = ({ item, priceMode, safeNum }) => {
  const price    = priceMode === 'Wholesale' ? safeNum(item.wholesale_price) : safeNum(item.retail_price);
  const cost     = safeNum(item.purchase_price);
  const qty      = safeNum(item.qty);
  const margin   = price - cost;
  const profit   = margin * qty;
  const marginPct = cost > 0 ? Math.round((margin / cost) * 100) : 0;
  const isPositive = profit >= 0;

  return (
    <View className="bg-white rounded-2xl mb-2.5 border border-card overflow-hidden"
      style={{ shadowColor: '#c8c0b4', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}
    >
      {/* Top row — name + profit */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-3">
        <View className="flex-1 pr-3">
          <Text className="text-primaryText font-black text-[14px] leading-tight" numberOfLines={1}>
            {item.item_name}
          </Text>
          <Text className="text-secondaryText text-[10px] font-bold mt-0.5">
            {qty} {item.unit || 'pcs'}  ×  ₹{price}
          </Text>
        </View>
        <View className={`px-3 py-1.5 rounded-xl ${isPositive ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
          <Text className={`font-black text-[13px] ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
            {isPositive ? '+' : ''}₹{profit}
          </Text>
        </View>
      </View>

      {/* Bottom strip — cost / sale / margin */}
      <View className="flex-row border-t border-card/60 bg-bg/50">
        <View className="flex-1 items-center py-2 border-r border-card/60">
          <Text className="text-secondaryText text-[9px] font-black uppercase tracking-widest">Cost</Text>
          <Text className="text-primaryText font-black text-[12px] mt-0.5">₹{cost}</Text>
        </View>
        <View className="flex-1 items-center py-2 border-r border-card/60">
          <Text className="text-secondaryText text-[9px] font-black uppercase tracking-widest">Sale</Text>
          <Text className="text-primaryText font-black text-[12px] mt-0.5">₹{price}</Text>
        </View>
        <View className="flex-1 items-center py-2">
          <Text className="text-secondaryText text-[9px] font-black uppercase tracking-widest">Margin</Text>
          <Text className={`font-black text-[12px] mt-0.5 ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
            {marginPct}%
          </Text>
        </View>
      </View>
    </View>
  );
};

// ── Main ProfitSheet ──────────────────────────────────────────────────────────
export const ProfitSheet = ({ visible, onClose, cartItems, totals, priceMode, safeNum }) => {
  const totalCost    = totals.finalTotal - totals.profit;
  const marginPct    = totalCost > 0 ? Math.round((totals.profit / totalCost) * 100) : 0;
  const isProfitGood = totals.profit >= 0;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView className="flex-1 bg-bg">

        {/* Header */}
        <View className="px-6 pt-4 pb-3 flex-row items-center justify-between border-b border-card/50">
          <View>
            <Text className="text-primaryText text-xl font-black tracking-tight">Profit Analysis</Text>
            <Text className="text-secondaryText text-[10px] font-black uppercase tracking-widest mt-0.5">
              {cartItems.length} items  •  {priceMode} price
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            className="bg-card w-9 h-9 rounded-full items-center justify-center active:opacity-60"
          >
            <Feather name="x" size={17} color="#1f2617" />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
        >
          {/* Summary card */}
          <View
            className="bg-primaryText rounded-[28px] p-5 mb-6"
            style={{ shadowColor: '#1f2617', shadowOpacity: 0.28, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6 }}
          >
            {/* Top — big profit number */}
            <View className="flex-row items-start justify-between mb-4">
              <View>
                <Text className="text-secondary text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">
                  Estimated Profit
                </Text>
                <Text className={`font-black text-4xl ${isProfitGood ? 'text-[#4ade80]' : 'text-red-400'}`}>
                  {isProfitGood ? '+' : ''}₹{totals.profit}
                </Text>
              </View>
              <View className={`px-3 py-1.5 rounded-xl mt-1 ${isProfitGood ? 'bg-green-400/20 border border-green-400/30' : 'bg-red-400/20 border border-red-400/30'}`}>
                <Text className={`font-black text-sm ${isProfitGood ? 'text-green-400' : 'text-red-400'}`}>
                  {marginPct}%
                </Text>
              </View>
            </View>

            {/* Bottom row — cost vs revenue */}
            <View className="flex-row border-t border-white/10 pt-4">
              <View className="flex-1">
                <Text className="text-secondary text-[9px] font-black uppercase tracking-widest opacity-50">
                  Total Cost
                </Text>
                <Text className="text-secondary font-black text-base mt-1">₹{totalCost}</Text>
              </View>
              <View className="w-px bg-white/10 mx-4" />
              <View className="flex-1 items-end">
                <Text className="text-secondary text-[9px] font-black uppercase tracking-widest opacity-50">
                  Revenue
                </Text>
                <Text className="text-accent font-black text-base mt-1">₹{totals.finalTotal}</Text>
              </View>
            </View>
          </View>

          {/* Section label */}
          <Text className="text-secondaryText text-[10px] font-black uppercase tracking-widest mb-3 mx-1">
            Item Breakdown
          </Text>

          {/* Item rows */}
          {cartItems.map((item, idx) => (
            <ProfitRow
              key={item._id || idx}
              item={item}
              priceMode={priceMode}
              safeNum={safeNum}
            />
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};
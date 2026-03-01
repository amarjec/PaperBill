import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, ActivityIndicator, Modal, KeyboardAvoidingView, Platform, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useReview } from '@/src/hooks/useReview';

export default function ReviewScreen() {
  const router = useRouter(); 
  const {
    cartItems, selectedCustomer, priceMode, setPriceMode,
    discount, setDiscount, extraFare, setExtraFare, amountPaid, setAmountPaid,
    totals, isSubmitting, isProfitVisible, setIsProfitVisible, pinModalVisible, setPinModalVisible, 
    pinInput, setPinInput, isVerifyingPin, handleVerifyPin, generateBill, safeNum
  } = useReview();

  // New UI State for the clean collapsible section
  const [showModifiers, setShowModifiers] = useState(false);

  const handleSubmission = async (isEstimate) => {
    const success = await generateBill(isEstimate);
    if (success) {
      Alert.alert(
        "Success", 
        isEstimate ? "Estimate Generated!" : "Bill Generated!", 
        [{ text: "OK", onPress: () => router.replace('/(tabs)') }]
      );
    }
  };

  const handleToggle = (isWholesale) => {
    setTimeout(() => {
      setPriceMode(isWholesale ? 'Wholesale' : 'Retail');
    }, 0);
  };

  const renderCartItems = () => {
    return cartItems.map((item, idx) => {
      const retail = safeNum(item.retail_price);
      const wholesale = safeNum(item.wholesale_price);
      const price = priceMode === 'Wholesale' ? wholesale : retail;
      const qty = safeNum(item.qty);
      const totalLinePrice = price * qty;

      return (
        <View key={item._id || idx} className={`flex-row justify-between items-center ${idx !== cartItems.length - 1 ? 'border-b border-card pb-3 mb-3' : ''}`}>
          <View className="flex-1 pr-4">
            <Text className="text-primaryText font-bold text-sm" numberOfLines={1}>{item.item_name || 'Item'}</Text>
            <Text className="text-secondaryText text-[10px] font-bold mt-0.5">{qty} {item.unit || 'pcs'} × ₹{price}</Text>
          </View>
          <Text className="text-primaryText font-black">₹{totalLinePrice}</Text>
        </View>
      );
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="px-6 py-4 flex-row justify-between items-center">
        <Pressable onPress={() => router.back()} className="bg-card p-3 rounded-2xl active:opacity-50">
          <Feather name="arrow-left" size={20} color="#1f2617" />
        </Pressable>
        <Text className="text-primaryText text-2xl font-black">Final Review</Text>
        <View className="w-10" /> 
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }} keyboardShouldPersistTaps="handled">
        
        {/* 1. Customer Section */}
        <View className="px-6 mt-2 mb-6">
          <Text className="text-secondaryText text-[10px] font-bold uppercase tracking-widest mb-2 ml-1">Billed To</Text>
          <View className="bg-white p-5 rounded-[24px] border border-card shadow-sm flex-row items-center">
            <View className="bg-primaryText/10 w-12 h-12 rounded-full items-center justify-center mr-4">
              <Feather name="user" size={20} color="#1f2617" />
            </View>
            <View>
              <Text className="text-primaryText font-black text-lg">{selectedCustomer?.name || 'Walk-in Customer'}</Text>
              <Text className="text-secondaryText font-bold text-xs">{selectedCustomer?.phone_number || 'No contact provided'}</Text>
            </View>
          </View>
        </View>

        {/* 2. Global Price Toggle */}
        {/* 2. Global Price Toggle - NATIVE HARDWARE SWITCH */}
        <View className="px-6 mb-6">
          <View className="bg-card/40 p-4 rounded-2xl flex-row justify-between items-center border border-secondary/10">
            <Text className={`font-black text-sm uppercase tracking-widest ${priceMode === 'Retail' ? 'text-accent' : 'text-secondaryText'}`}>
              Retail Mode
            </Text>
            
            <Switch
              trackColor={{ false: '#393f35', true: '#e5fc01' }}
              thumbColor={priceMode === 'Wholesale' ? '#1f2617' : '#bfb5a8'}
              ios_backgroundColor="#393f35"
              onValueChange={handleToggle}
              value={priceMode === 'Wholesale'}
            />
            
            <Text className={`font-black text-sm uppercase tracking-widest ${priceMode === 'Wholesale' ? 'text-accent' : 'text-secondaryText'}`}>
              Wholesale Mode
            </Text>
          </View>
        </View>

        {/* 3. Items Summary */}
        <View className="px-6 mb-6">
          <Text className="text-secondaryText text-[10px] font-bold uppercase tracking-widest mb-2 ml-1">Cart Items</Text>
          <View className="bg-card/20 rounded-[28px] p-5 border border-secondary/20">
            {renderCartItems()}
          </View>
        </View>

        {/* 4. CLEAN UI: Collapsible Cost Modifiers & Khata */}
        <View className="px-6 mb-6">
          <Pressable 
            onPress={() => setShowModifiers(!showModifiers)}
            className="bg-card/40 p-4 rounded-2xl border border-secondary/10 flex-row justify-between items-center active:opacity-70"
          >
            <View className="flex-row items-center">
              <View className="bg-primaryText w-8 h-8 rounded-full items-center justify-center mr-3">
                <Feather name="sliders" size={14} color="#e5fc01" />
              </View>
              <View>
                <Text className="text-primaryText font-bold text-sm">Adjustments & Payment</Text>
                <Text className="text-secondaryText text-[10px] uppercase tracking-widest mt-0.5">
                  Discount: ₹{safeNum(discount)} | Fare: ₹{safeNum(extraFare)}
                </Text>
              </View>
            </View>
            <Feather name={showModifiers ? "chevron-up" : "chevron-down"} size={20} color="#1f2617" />
          </Pressable>

          {showModifiers && (
            <View className="mt-4 flex-row flex-wrap justify-between gap-y-4 bg-card/10 p-5 rounded-[24px] border border-secondary/10">
              <View className="w-[48%]">
                <Text className="text-secondaryText text-[10px] font-bold uppercase ml-1 mb-2">Discount (₹)</Text>
                <TextInput value={discount} onChangeText={setDiscount} keyboardType="numeric" className="bg-white p-4 rounded-2xl border border-card font-bold" placeholder="0" />
              </View>
              <View className="w-[48%]">
                <Text className="text-secondaryText text-[10px] font-bold uppercase ml-1 mb-2">Extra Fare (₹)</Text>
                <TextInput value={extraFare} onChangeText={setExtraFare} keyboardType="numeric" className="bg-white p-4 rounded-2xl border border-card font-bold" placeholder="0" />
              </View>
              <View className="w-full mt-2">
                <Text className="text-secondaryText text-[10px] font-bold uppercase ml-1 mb-2">Amount Received Now (₹) - For Khata</Text>
                <TextInput value={amountPaid} onChangeText={setAmountPaid} keyboardType="numeric" className="bg-white p-4 rounded-2xl border border-card font-black text-lg text-primaryText" placeholder="0" />
              </View>
            </View>
          )}
        </View>

        {/* 5. Grand Total & Profit Trigger */}
        <View className="px-6 mb-8">
          <View className="bg-primaryText p-6 rounded-[32px] shadow-2xl">
            <View className="flex-row justify-between items-center border-b border-white/10 pb-4 mb-4">
              <Text className="text-secondary font-bold uppercase tracking-widest text-xs">Total Amount</Text>
              <Text className="text-accent text-3xl font-black">₹{totals.finalTotal}</Text>
            </View>
            
            <View className="flex-row justify-between items-center">
              <Text className="text-secondary font-bold text-xs uppercase">Profit Margin</Text>
              <Pressable onPress={() => setPinModalVisible(true)} className="bg-white/10 px-4 py-2 rounded-xl flex-row items-center active:opacity-50">
                <Feather name="lock" size={14} color="#bfb5a8" />
                <Text className="text-secondary font-bold ml-2 text-xs">View Analysis</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 6. Sticky Footer Actions */}
      <View className="absolute bottom-0 left-0 right-0 bg-bg px-6 pt-4 pb-8 border-t border-card/50 flex-row gap-3">
        <Pressable 
          onPress={() => !isSubmitting && handleSubmission(true)}
          className={`flex-1 bg-card/50 py-4 rounded-2xl items-center border border-card ${isSubmitting ? 'opacity-50' : 'active:opacity-70'}`}
        >
          <Text className="text-primaryText font-bold uppercase tracking-widest text-[11px]">Quotation</Text>
          <Text className="text-primaryText font-black mt-1">Estimate</Text>
        </Pressable>
        
        <Pressable 
          onPress={() => !isSubmitting && handleSubmission(false)}
          className={`flex-[1.5] bg-accent py-4 rounded-2xl items-center shadow-lg shadow-accent/30 ${isSubmitting ? 'opacity-50' : 'active:opacity-70'}`}
        >
          {isSubmitting ? <ActivityIndicator color="#1f2617" /> : (
            <>
              <Text className="text-primaryText font-bold uppercase tracking-widest text-[11px]">Finalize</Text>
              <Text className="text-primaryText font-black mt-1">Generate Bill</Text>
            </>
          )}
        </Pressable>
      </View>

      {/* PIN Verification Modal */}
      <Modal visible={pinModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-black/80 justify-center px-8">
          <View className="bg-bg p-8 rounded-[40px] shadow-2xl items-center">
            <View className="bg-primaryText/10 w-16 h-16 rounded-full items-center justify-center mb-6">
              <Feather name="shield" size={28} color="#1f2617" />
            </View>
            <Text className="text-primaryText text-2xl font-black mb-2">Secure Viewer</Text>
            <Text className="text-secondaryText text-center font-medium text-xs mb-8">Enter your 4-digit owner PIN to reveal the detailed profit analysis.</Text>
            
            <TextInput 
              autoFocus
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
              value={pinInput}
              onChangeText={setPinInput}
              className="bg-white w-full p-5 rounded-2xl border border-card font-black text-2xl text-center tracking-[10px] mb-6 shadow-sm"
              placeholder="••••"
            />
            
            <View className="flex-row gap-3 w-full">
              <Pressable onPress={() => { setPinModalVisible(false); setPinInput(''); }} className="flex-1 bg-card py-4 rounded-2xl items-center active:opacity-50">
                <Text className="text-primaryText font-bold">Cancel</Text>
              </Pressable>
              <Pressable onPress={() => !isVerifyingPin && handleVerifyPin()} className="flex-[1.5] bg-primaryText py-4 rounded-2xl items-center active:opacity-50">
                {isVerifyingPin ? <ActivityIndicator color="#e5fc01" /> : <Text className="text-accent font-black uppercase tracking-widest">Verify</Text>}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* NEW: Detailed Profit Analysis Modal */}
      <Modal visible={isProfitVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-bg">
          <View className="px-6 py-4 flex-row justify-between items-center border-b border-card/50 pb-4">
            <View>
              <Text className="text-primaryText text-2xl font-black">Profit Analysis</Text>
              <Text className="text-secondaryText text-[10px] font-bold uppercase tracking-widest mt-1">Itemized Breakdown</Text>
            </View>
            <Pressable 
              onPress={() => setIsProfitVisible(false)} // Closing locks it again!
              className="bg-card p-3 rounded-full active:opacity-50"
            >
              <Feather name="x" size={20} color="#1f2617" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
            {/* Master Summary Card */}
            <View className="bg-primaryText p-6 rounded-[32px] mb-8 shadow-xl">
               <Text className="text-bg font-bold uppercase tracking-widest text-xs mb-2 opacity-80">Total Est. Profit</Text>
               <Text className="text-[#4ade80] text-4xl font-black mb-4">+ ₹{totals.profit}</Text>
               
               <View className="flex-row justify-between border-t border-white/10 pt-4">
                 <View>
                   <Text className="text-bg text-[10px] uppercase font-bold opacity-60">Total Cost</Text>
                   <Text className="text-bg font-bold mt-1">₹{totals.itemsTotal - totals.profit}</Text>
                 </View>
                 <View className="items-end">
                   <Text className="text-bg text-[10px] uppercase font-bold opacity-60">Total Revenue</Text>
                   <Text className="text-bg font-bold mt-1">₹{totals.finalTotal}</Text>
                 </View>
               </View>
            </View>

            {/* Itemized List */}
            {cartItems.map((item, idx) => {
              const retail = safeNum(item.retail_price);
              const wholesale = safeNum(item.wholesale_price);
              const price = priceMode === 'Wholesale' ? wholesale : retail;
              const cost = safeNum(item.purchase_price);
              const qty = safeNum(item.qty);
              
              const itemProfit = (price - cost) * qty;
              const isPositive = itemProfit >= 0;

              return (
                <View key={item._id || idx} className="bg-white p-5 rounded-3xl mb-3 border border-card shadow-sm flex-row justify-between items-center">
                  <View className="flex-1 pr-4">
                    <Text className="text-primaryText font-black text-base" numberOfLines={1}>{item.item_name}</Text>
                    <View className="flex-row items-center mt-1.5">
                      <Text className="text-secondaryText text-[10px] font-bold uppercase bg-bg px-2 py-1 rounded-md overflow-hidden">
                        Cost: ₹{cost}
                      </Text>
                      <Text className="text-secondaryText text-[10px] font-bold uppercase ml-2 bg-bg px-2 py-1 rounded-md overflow-hidden">
                        Sale: ₹{price}
                      </Text>
                    </View>
                  </View>
                  <View className="items-end pl-2 border-l border-card">
                    <Text className="text-secondaryText text-[10px] font-bold uppercase mb-1">Profit (x{qty})</Text>
                    <Text className={`font-black text-lg ${isPositive ? 'text-[#4ade80]' : 'text-red-500'}`}>
                      {isPositive ? '+' : ''}₹{itemProfit}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}


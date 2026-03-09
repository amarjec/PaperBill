import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable, TouchableOpacity,
  ActivityIndicator, Modal, KeyboardAvoidingView, Platform, Alert,
  Vibration, Switch, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useReview } from '@/src/hooks/useReview';
import { ProfitSheet } from '@/src/components/billing/ProfitSheet';
import { usePermission } from '../src/hooks/usePermission';

// ─── Cart item row ────────────────────────────────────────────────────────────
// Tap → slide-left to reveal delete strip (clipped so red never shows in normal view)
// Long press → edit modal for qty + price (bill-only override)
const CartItemRow = ({ item, idx, isLast, priceMode, safeNum, onSetQty, onSetPrice, onRemove }) => {
  const translateX            = useRef(new Animated.Value(0)).current;
  const [swiped, setSwiped]   = useState(false);
  const [editing, setEditing] = useState(false);
  const [editQty, setEditQty]     = useState('');
  const [editPrice, setEditPrice] = useState('');

  // _overridePrice is set when user edits price for this bill only
  const basePrice = priceMode === 'Wholesale' ? safeNum(item.wholesale_price) : safeNum(item.retail_price);
  const price     = item._overridePrice != null ? safeNum(item._overridePrice) : basePrice;
  const qty       = safeNum(item.qty);
  const lineTotal = price * qty;

  const snap = (toValue) => {
    Animated.spring(translateX, { toValue, useNativeDriver: true, tension: 120, friction: 10 }).start();
    setSwiped(toValue !== 0);
  };

  const openEdit = () => {
    snap(0);
    Vibration.vibrate(50);
    setEditQty(String(qty));
    setEditPrice(String(price));
    setEditing(true);
  };

  const commit = () => {
    const q = parseInt(editQty, 10);
    const p = parseFloat(editPrice);
    if (!isNaN(q) && q >= 0) onSetQty(item._id, q);
    if (!isNaN(p) && p >= 0) onSetPrice(item._id, p);
    setEditing(false);
  };

  return (
    // overflow:hidden is the key fix — clips the red strip so it's invisible until swiped
    <View style={{ overflow: 'hidden' }}
      className={!isLast ? 'border-b border-card/60' : ''}
    >
      {/* Red strip — behind the white row, only visible when translateX < 0 */}
      <View className="absolute right-0 top-0 bottom-0 w-[76px] bg-red-500 items-center justify-center">
        <TouchableOpacity
          onPress={() => { snap(0); onRemove(item._id); }}
          className="w-full h-full items-center justify-center"
        >
          <Feather name="trash-2" size={18} color="#fff" />
          <Text className="text-white font-black text-[9px] uppercase mt-1 tracking-widest">Remove</Text>
        </TouchableOpacity>
      </View>

      {/* White sliding row */}
      <Animated.View style={{ transform: [{ translateX }], backgroundColor: '#fff' }}>
        <TouchableOpacity
          onPress={() => snap(swiped ? 0 : -76)}
          onLongPress={openEdit}
          delayLongPress={350}
          activeOpacity={0.82}
          className="flex-row items-center py-3 px-3 bg-white"
        >
          {/* Index */}
          <View className="w-5 h-5 rounded-full bg-bg items-center justify-center mr-3 flex-shrink-0">
            <Text className="text-secondaryText font-black text-[9px]">{idx + 1}</Text>
          </View>

          {/* Name + price line */}
          <View className="flex-1 pr-2">
            <Text className="text-primaryText font-bold text-[13px] leading-tight" numberOfLines={1}>
              {item.item_name}
            </Text>
            <Text className="text-secondaryText text-[10px] font-bold mt-0.5">
              ₹{price} × {qty} {item.unit || 'pcs'}
              {item._overridePrice != null
                ? <Text className="text-amber-500"> ✎</Text>
                : null}
            </Text>
          </View>

          {/* Qty pill */}
          <View className="bg-card rounded-xl px-2.5 py-1 mr-3">
            <Text className="text-primaryText font-black text-[12px]">{qty}</Text>
          </View>

          {/* Line total */}
          <Text className="text-primaryText font-black text-[13px] min-w-[52px] text-right">
            ₹{lineTotal}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Edit modal (qty + price, bill-only) */}
      <Modal visible={editing} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-center px-7"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        >
          <View className="bg-bg rounded-[32px] p-7">
            <Text className="text-primaryText font-black text-[16px] mb-0.5" numberOfLines={1}>
              {item.item_name}
            </Text>
            <Text className="text-amber-500 text-[9px] font-black uppercase tracking-widest mb-5">
              Bill-only · DB price unchanged
            </Text>

            <View className="flex-row gap-3 mb-6">
              <View className="flex-1">
                <Text className="text-secondaryText text-[9px] font-black uppercase tracking-widest mb-1.5 ml-1">Qty</Text>
                <TextInput
                  autoFocus
                  value={editQty}
                  onChangeText={setEditQty}
                  keyboardType="numeric"
                  returnKeyType="next"
                  selectTextOnFocus
                  className="bg-card px-3 py-4 rounded-2xl border border-card text-primaryText font-black text-xl text-center"
                />
              </View>
              <View className="flex-1">
                <Text className="text-secondaryText text-[9px] font-black uppercase tracking-widest mb-1.5 ml-1">Price (₹)</Text>
                <TextInput
                  value={editPrice}
                  onChangeText={setEditPrice}
                  keyboardType="numeric"
                  returnKeyType="done"
                  onSubmitEditing={commit}
                  selectTextOnFocus
                  className="bg-card px-3 py-4 rounded-2xl border border-card text-primaryText font-black text-xl text-center"
                />
              </View>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity onPress={() => setEditing(false)} className="flex-1 bg-card py-4 rounded-2xl items-center">
                <Text className="text-primaryText font-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={commit} className="flex-[1.5] bg-primaryText py-4 rounded-2xl items-center">
                <Text className="text-accent font-black uppercase tracking-widest">Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ReviewScreen() {
  const router = useRouter();
  const {
    cartItems, selectedCustomer, priceMode, setPriceMode,
    discount, setDiscount, extraFare, setExtraFare,
    collectingPayment, setCollectingPayment, amountPaid, setAmountPaid,
    totals, safeNum, isSubmitting,
    setLocalQty, setLocalPrice, removeLocalItem,
    searchModalVisible, setSearchModalVisible,
    searchTerm, setSearchTerm,
    searchResults, isSearching, searchProducts, addProductFromSearch,
    isProfitVisible, setIsProfitVisible,
    pinModalVisible, setPinModalVisible,
    pinInput, setPinInput, isVerifyingPin, handleVerifyPin,
    generateBill,
  } = useReview();

  const { can } = usePermission();

  const [showAdjustments, setShowAdjustments] = useState(false);
  const [submitType, setSubmitType] = useState(null); // Tracks 'estimate' or 'bill' to show loader on correct button

  // Helper to check if it's a walk-in customer
  const isWalkIn = !selectedCustomer || !selectedCustomer._id;

  const handleSubmission = async (isEstimate) => {
    setSubmitType(isEstimate ? 'estimate' : 'bill');
    const success = await generateBill(isEstimate);
    if (success) {
      Alert.alert('Done!', isEstimate ? 'Estimate saved.' : 'Bill created.',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/history') }]
      );
    }
    // Only reset state if the submission failed, otherwise we are unmounting
    if (!success) {
      setSubmitType(null);
    }
  };

  // Cap display of outstanding
  const paidAmt     = Math.min(safeNum(amountPaid), totals.finalTotal);
  const outstanding = collectingPayment ? Math.max(0, totals.finalTotal - paidAmt) : 0;

  return (
    <SafeAreaView className="flex-1 bg-bg">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View className="px-5 pt-4 pb-3 flex-row items-center">
        <Pressable onPress={() => router.back()} className="bg-card p-3 rounded-2xl mr-4 active:opacity-60">
          <Feather name="arrow-left" size={20} color="#1f2617" />
        </Pressable>

        <View className="flex-1">
          <Text className="text-primaryText text-xl font-black tracking-tight">Review Bill</Text>
          <Text className="text-secondaryText text-[11px] font-bold mt-0.5">
            {cartItems.length} items
          </Text>
        </View>

        {/* Profit — lock icon only, no text */}
        <TouchableOpacity
          onPress={() => setPinModalVisible(true)}
          activeOpacity={0.8}
          className="bg-card border-primaryText border-1 w-10 h-10 rounded-2xl items-center justify-center mr-4"
        >
          <Feather name="lock" size={18} color="#1f2617" />
        </TouchableOpacity>

        {/* Add item — labelled button so user understands it */}
        <TouchableOpacity
          onPress={() => { setSearchTerm(''); setSearchModalVisible(true); }}
          activeOpacity={0.8}
          className="bg-primaryText flex-row items-center px-3 h-10 rounded-2xl"
        >
          <Feather name="plus" size={14} color="#e5fc01" />
          <Text className="text-accent font-black text-[11px] uppercase tracking-widest ml-1">Item</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 160 }}
      >
        {/* ── 1. Customer + switch ─────────────────────────────────────────── */}
        <View className="px-5 mb-4">
          <Text className="text-secondaryText text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Billed To</Text>
          <View className="bg-white rounded-[22px] px-4 py-3.5 flex-row items-center border border-card"
            style={{ shadowColor: '#c8c0b4', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}
          >
            <View className="bg-primaryText w-10 h-10 rounded-xl items-center justify-center mr-3 flex-shrink-0">
              <Text className="text-accent font-black text-sm">
                {selectedCustomer?.name?.charAt(0)?.toUpperCase() || 'W'}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-primaryText font-black text-[15px]" numberOfLines={1}>
                {selectedCustomer?.name || 'Walk-in Customer'}
              </Text>
              <Text className="text-secondaryText text-[11px] font-bold">
                {selectedCustomer?.phone || 'No contact'}
              </Text>
            </View>
            {/* Small R/W switch — right side of customer row */}
            <View className="flex-row items-center ml-3">
              <Text className={`text-[10px] font-black mr-1 ${priceMode === 'Retail' ? 'text-primaryText' : 'text-secondaryText opacity-40'}`}>R</Text>
              <Switch
                value={priceMode === 'Wholesale'}
                onValueChange={(v) => setPriceMode(v ? 'Wholesale' : 'Retail')}
                trackColor={{ false: '#e8e4de', true: '#1f2617' }}
                thumbColor={priceMode === 'Wholesale' ? '#e5fc01' : '#ffffff'}
                ios_backgroundColor="#e8e4de"
                style={{ transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] }}
              />
              <Text className={`text-[10px] font-black ml-1 ${priceMode === 'Wholesale' ? 'text-primaryText' : 'text-secondaryText opacity-40'}`}>W</Text>
            </View>
          </View>
          <Text className="text-secondaryText text-[9px] font-black uppercase tracking-widest mt-1 text-right mr-1 opacity-50">
            {priceMode} Price
          </Text>
        </View>

        {/* ── 2. Cart Items ────────────────────────────────────────────────── */}
        <View className="px-5 mb-4">
          <Text className="text-secondaryText text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Items</Text>
          <View className="bg-white rounded-[22px] px-0 py-0 border border-card overflow-hidden"
            style={{ shadowColor: '#c8c0b4', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}
          >
            {cartItems.length === 0 ? (
              <View className="items-center py-8 opacity-40">
                <Feather name="shopping-cart" size={32} color="#393f35" />
                <Text className="text-primaryText font-bold mt-3 text-sm">Cart is empty</Text>
              </View>
            ) : (
              cartItems.map((item, idx) => (
                <CartItemRow
                  key={item._id || idx}
                  item={item}
                  idx={idx}
                  isLast={idx === cartItems.length - 1}
                  priceMode={priceMode}
                  safeNum={safeNum}
                  onSetQty={setLocalQty}
                  onSetPrice={setLocalPrice}
                  onRemove={removeLocalItem}
                />
              ))
            )}
          </View>
          <Text className="text-secondaryText text-[9px] font-bold opacity-40 text-right mt-1 mr-1">
            Swipe ← to remove  •  Hold to edit qty & price
          </Text>
        </View>

        {/* ── 3. Adjustments ──────────────────────────────────────────────── */}
        <View className="px-5 mb-4">
          <Pressable
            onPress={() => setShowAdjustments(!showAdjustments)}
            className="bg-white rounded-[22px] px-4 py-3 flex-row items-center justify-between border border-card active:opacity-70"
          >
            <View className="flex-row items-center">
              <View className="bg-card w-8 h-8 rounded-xl items-center justify-center mr-3">
                <Feather name="sliders" size={14} color="#393f35" />
              </View>
              <View>
                <Text className="text-primaryText font-bold text-[13px]">Adjustments</Text>
                {(safeNum(discount) > 0 || safeNum(extraFare) > 0) && (
                  <Text className="text-secondaryText text-[10px] font-bold mt-0.5">
                    {safeNum(discount) > 0 ? `−₹${discount}` : ''}
                    {safeNum(discount) > 0 && safeNum(extraFare) > 0 ? '  •  ' : ''}
                    {safeNum(extraFare) > 0 ? `+₹${extraFare} fare` : ''}
                  </Text>
                )}
              </View>
            </View>
            <Feather name={showAdjustments ? 'chevron-up' : 'chevron-down'} size={18} color="#bfb5a8" />
          </Pressable>

          {showAdjustments && (
            <View className="mt-2 bg-white rounded-[22px] px-4 py-4 border border-card flex-row gap-4">
              <View className="flex-1">
                <Text className="text-secondaryText text-[9px] font-black uppercase tracking-widest mb-1.5 ml-1">Discount (₹)</Text>
                <TextInput
                  value={discount} onChangeText={setDiscount}
                  keyboardType="numeric" placeholder="0" placeholderTextColor="#bfb5a8"
                  className="bg-bg px-4 py-3 rounded-xl border border-card font-bold text-primaryText"
                />
              </View>
              <View className="flex-1">
                <Text className="text-secondaryText text-[9px] font-black uppercase tracking-widest mb-1.5 ml-1">Extra Fare (₹)</Text>
                <TextInput
                  value={extraFare} onChangeText={setExtraFare}
                  keyboardType="numeric" placeholder="0" placeholderTextColor="#bfb5a8"
                  className="bg-bg px-4 py-3 rounded-xl border border-card font-bold text-primaryText"
                />
              </View>
            </View>
          )}
        </View>

        {/* ── 4. Grand Total card ──────────────────────────────────────────── */}
        <View className="px-5 mb-3">
          <View className="bg-primaryText rounded-[28px] px-6 py-5"
            style={{ shadowColor: '#1f2617', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 5 }}
          >
            {safeNum(discount) > 0 && (
              <View className="flex-row justify-between mb-2">
                <Text className="text-secondary opacity-50 font-bold text-[11px]">Sub-total</Text>
                <Text className="text-secondary opacity-70 font-bold text-[11px]">₹{totals.itemsTotal}</Text>
              </View>
            )}
            {safeNum(discount) > 0 && (
              <View className="flex-row justify-between mb-2">
                <Text className="text-secondary opacity-50 font-bold text-[11px]">Discount</Text>
                <Text className="text-green-400 font-bold text-[11px]">−₹{discount}</Text>
              </View>
            )}
            {safeNum(extraFare) > 0 && (
              <View className="flex-row justify-between mb-2">
                <Text className="text-secondary opacity-50 font-bold text-[11px]">Extra Fare</Text>
                <Text className="text-secondary font-bold text-[11px]">+₹{extraFare}</Text>
              </View>
            )}
            <View className="flex-row justify-between items-center pt-2">
              <Text className="text-secondary font-black uppercase tracking-widest text-xs opacity-60">Grand Total</Text>
              <Text className="text-accent text-3xl font-black">₹{totals.finalTotal}</Text>
            </View>
          </View>
        </View>

        {/* ── 5. Payment card (Hidden if walk-in or missing khata permission) ── */}
        {can('khata', 'update') && !isWalkIn && (
          <View className="px-5 mb-4">
            <View className="bg-white rounded-[22px] px-5 py-3 border border-card"
              style={{ shadowColor: '#c8c0b4', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}
            >
              {/* Single checkbox: "Full payment received" */}
              <TouchableOpacity
                onPress={() => {
                  const next = !collectingPayment;
                  setCollectingPayment(next);
                  // Un-ticking opens blank field — user types their own amount
                  if (next) setAmountPaid('');
                }}
                activeOpacity={0.8}
                className="flex-row items-center"
              >
                <View className={`w-6 h-6 rounded-lg border-2 items-center justify-center mr-3 flex-shrink-0
                  ${!collectingPayment ? 'bg-primaryText border-primaryText' : 'border-card bg-bg'}`}
                >
                  {!collectingPayment && <Feather name="check" size={13} color="#e5fc01" />}
                </View>
                <View className="flex-1">
                  <Text className="text-primaryText font-black text-[14px]">Full payment received</Text>
                  <Text className="text-secondaryText text-[10px] font-bold mt-0.5">
                    {!collectingPayment ? `₹${totals.finalTotal} — fully paid` : 'Tap to mark as fully paid'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Partial amount input — blank so user types their own amount */}
              {collectingPayment && (
                <View className="mt-4 pt-4 border-t border-card/60">
                  <Text className="text-secondaryText text-[9px] font-black uppercase tracking-widest mb-2 ml-1">
                    Amount Received Now (₹)
                  </Text>
                  <TextInput
                    autoFocus
                    value={amountPaid}
                    onChangeText={(v) => {
                      // Never allow more than total
                      const n = parseFloat(v);
                      if (!isNaN(n) && n > totals.finalTotal) {
                        setAmountPaid(String(totals.finalTotal));
                      } else {
                        setAmountPaid(v);
                      }
                    }}
                    keyboardType="numeric"
                    placeholder={`Max ₹${totals.finalTotal}`}
                    placeholderTextColor="#bfb5a8"
                    className="bg-bg px-4 py-4 rounded-2xl border border-card font-black text-xl text-primaryText"
                  />
                  {outstanding > 0 && (
                    <View className="flex-row items-center mt-2.5 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
                      <Feather name="alert-circle" size={13} color="#ef4444" />
                      <Text className="text-red-500 text-[11px] font-bold ml-2">
                        ₹{outstanding} outstanding — added to Khata
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Sticky Footer ───────────────────────────────────────────────────── */}
      <View className="absolute bottom-0 left-0 right-0 bg-bg px-5 pt-3 pb-8 border-t border-card/50 flex-row gap-3">
        <Pressable
          onPress={() => !isSubmitting && handleSubmission(true)}
          disabled={isSubmitting}
          className="flex-1 bg-card py-4 rounded-2xl items-center border border-card active:opacity-70 justify-center"
        >
          {isSubmitting && submitType === 'estimate' ? (
            <ActivityIndicator color="#1f2617" />
          ) : (
            <>
              <Text className="text-secondaryText font-bold uppercase tracking-widest text-[9px]">No Payment</Text>
              <Text className="text-primaryText font-black mt-0.5 text-[13px]">Estimate</Text>
            </>
          )}
        </Pressable>
        <Pressable
          onPress={() => !isSubmitting && handleSubmission(false)}
          disabled={isSubmitting}
          className="flex-[1.8] bg-accent py-4 rounded-2xl items-center active:opacity-80 justify-center"
          style={{ shadowColor: '#e5fc01', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 }}
        >
          {isSubmitting && submitType === 'bill' ? (
            <ActivityIndicator color="#1f2617" />
          ) : (
            <>
              <Text className="text-primaryText font-bold uppercase tracking-widest text-[9px]">Finalize</Text>
              <Text className="text-primaryText font-black mt-0.5 text-[13px]">Generate Bill</Text>
            </>
          )}
        </Pressable>
      </View>

      {/* ── PIN Modal ───────────────────────────────────────────────────────── */}
      <Modal visible={pinModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-center px-8" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
        >
          <View className="bg-bg rounded-[40px] p-8 items-center"
            style={{ shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 30, shadowOffset: { width: 0, height: 10 }, elevation: 20 }}
          >
            <View className="bg-green-50 border border-green-200 w-16 h-16 rounded-full items-center justify-center mb-5">
              <Feather name="lock" size={26} color="#16a34a" />
            </View>
            <Text className="text-primaryText text-2xl font-black mb-1">Owner PIN</Text>
            <Text className="text-secondaryText text-center text-xs font-bold mb-7">
              Enter your 4-digit PIN to view profit details
            </Text>
            <TextInput
              autoFocus secureTextEntry keyboardType="numeric" maxLength={4}
              value={pinInput} onChangeText={setPinInput}
              className="bg-card w-full p-5 rounded-2xl border border-card font-black text-2xl text-center tracking-[10px] mb-6"
              placeholder="••••" placeholderTextColor="#bfb5a8"
            />
            <View className="flex-row gap-3 w-full">
              <Pressable onPress={() => { setPinModalVisible(false); setPinInput(''); }}
                className="flex-1 bg-card py-4 rounded-2xl items-center active:opacity-60"
              >
                <Text className="text-primaryText font-bold">Cancel</Text>
              </Pressable>
              <Pressable onPress={() => !isVerifyingPin && handleVerifyPin()}
                className="flex-[1.5] bg-primaryText py-4 rounded-2xl items-center active:opacity-70"
              >
                {isVerifyingPin
                  ? <ActivityIndicator color="#e5fc01" />
                  : <Text className="text-accent font-black uppercase tracking-widest">Verify</Text>}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Add Item Search Modal ────────────────────────────────────────────── */}
      <Modal visible={searchModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
        >
          <View className="bg-bg rounded-t-[44px] pt-6 pb-4" style={{ maxHeight: '75%' }}>
            <View className="w-10 h-1 bg-card rounded-full self-center mb-5" />
            <View className="flex-row items-center justify-between px-6 mb-4">
              <View>
                <Text className="text-primaryText text-xl font-black">Add Item to Bill</Text>
                <Text className="text-secondaryText text-[10px] font-bold mt-0.5">Search your inventory</Text>
              </View>
              <TouchableOpacity onPress={() => setSearchModalVisible(false)}
                className="bg-card w-9 h-9 rounded-full items-center justify-center"
              >
                <Feather name="x" size={17} color="#1f2617" />
              </TouchableOpacity>
            </View>

            <View className="mx-6 mb-3 bg-white flex-row items-center px-4 py-3 rounded-2xl border border-card">
              <Feather name="search" size={16} color="#bfb5a8" />
              <TextInput
                autoFocus
                placeholder="Type product name..."
                placeholderTextColor="#bfb5a8"
                value={searchTerm}
                onChangeText={(t) => { setSearchTerm(t); searchProducts(t); }}
                className="flex-1 ml-3 text-primaryText font-bold text-sm"
              />
              {isSearching && <ActivityIndicator size="small" color="#bfb5a8" />}
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
            >
              {searchResults.length === 0 && searchTerm.length > 1 && !isSearching && (
                <Text className="text-secondaryText font-bold text-center py-8 opacity-40">No products found</Text>
              )}
              {searchTerm.length === 0 && (
                <Text className="text-secondaryText font-bold text-center py-6 opacity-30 text-sm">
                  Start typing to search...
                </Text>
              )}
              {searchResults.map(product => {
                const inCart = !!cartItems.find(c => c._id === product._id);
                return (
                  <TouchableOpacity
                    key={product._id}
                    onPress={() => { addProductFromSearch(product); setSearchModalVisible(false); }}
                    activeOpacity={0.8}
                    className={`flex-row items-center px-4 py-3 mb-2 rounded-2xl border
                      ${inCart ? 'bg-primaryText border-primaryText' : 'bg-white border-card'}`}
                  >
                    <View className="flex-1">
                      <Text className={`font-bold text-[13px] ${inCart ? 'text-accent' : 'text-primaryText'}`} numberOfLines={1}>
                        {product.item_name}
                      </Text>
                      <Text className={`text-[10px] font-bold mt-0.5 ${inCart ? 'text-secondary' : 'text-secondaryText'}`}>
                        ₹{product.retail_price} / {product.unit || 'pcs'}
                      </Text>
                    </View>
                    {inCart ? (
                      <View className="flex-row items-center bg-accent/20 px-2 py-1 rounded-xl">
                        <Feather name="check" size={11} color="#e5fc01" />
                        <Text className="text-accent font-black text-[10px] ml-1">In Bill</Text>
                      </View>
                    ) : (
                      <View className="bg-primaryText px-3 py-1.5 rounded-xl flex-row items-center">
                        <Feather name="plus" size={11} color="#e5fc01" />
                        <Text className="text-accent font-black text-[10px] ml-1 uppercase">Add</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Profit Sheet ─────────────────────────────────────────────────────── */}
      <ProfitSheet
        visible={isProfitVisible}
        onClose={() => setIsProfitVisible(false)}
        cartItems={cartItems}
        totals={totals}
        priceMode={priceMode}
        safeNum={safeNum}
      />
    </SafeAreaView>
  );
}
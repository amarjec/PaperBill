import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator,
  Modal, TextInput, KeyboardAvoidingView, Platform, Alert,
  Animated, TouchableOpacity, Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useBillDetail } from '@/src/hooks/useBillDetail';
import { useAuth } from '@/src/context/AuthContext';
import { billService } from '@/src/services/billService';
import { usePermission } from '@/src/hooks/usePermission';
import { ProfitSheet } from '@/src/components/billing/ProfitSheet';

// ─── Palette (matches app theme) ─────────────────────────────────────────────
const C = {
  bg:        '#f7f4ef',
  card:      '#ede9e2',
  primary:   '#1f2617',
  accent:    '#e5fc01',
  secondary: '#a89a8a',
  white:     '#ffffff',
  red:       '#e11d48',
  green:     '#4ade80',
  orange:    '#f97316',
};

// ─── Swipeable Cart Item Row (mirrors review.jsx interaction) ─────────────────
const EditItemRow = ({ item, idx, isLast, onUpdatePrice, onUpdateQty, onRemove, safeNum }) => {
  const translateX      = useRef(new Animated.Value(0)).current;
  const [swiped, setSwiped]   = useState(false);
  const [editing, setEditing] = useState(false);
  const [editQty,   setEditQty]   = useState('');
  const [editPrice, setEditPrice] = useState('');

  const price    = safeNum(item.sale_price);
  const qty      = safeNum(item.quantity);
  const lineTotal = price * qty;

  const snap = (toValue) => {
    Animated.spring(translateX, { toValue, useNativeDriver: true, tension: 120, friction: 10 }).start();
    setSwiped(toValue !== 0);
  };

  const openEdit = () => {
    snap(0);
    Vibration.vibrate(40);
    setEditQty(String(qty));
    setEditPrice(String(price));
    setEditing(true);
  };

  const commit = () => {
    const q = parseInt(editQty, 10);
    const p = parseFloat(editPrice);
    if (!isNaN(q) && q >= 0) onUpdateQty(idx, q);
    if (!isNaN(p) && p >= 0) onUpdatePrice(idx, p);
    setEditing(false);
  };

  return (
    <View style={{ overflow: 'hidden' }} className={!isLast ? 'border-b border-card/60' : ''}>
      {/* Red delete strip */}
      <View className="absolute right-0 top-0 bottom-0 w-[72px] bg-red-500 items-center justify-center">
        <TouchableOpacity
          onPress={() => { snap(0); onRemove(idx); }}
          className="w-full h-full items-center justify-center"
        >
          <Feather name="trash-2" size={17} color="#fff" />
          <Text className="text-white font-black text-[8px] uppercase mt-1 tracking-widest">Remove</Text>
        </TouchableOpacity>
      </View>

      {/* Sliding white row */}
      <Animated.View style={{ transform: [{ translateX }], backgroundColor: C.white }}>
        <TouchableOpacity
          onPress={() => snap(swiped ? 0 : -72)}
          onLongPress={openEdit}
          delayLongPress={320}
          activeOpacity={0.85}
          className="flex-row items-center py-3.5 px-4"
        >
          <View className="w-6 h-6 rounded-full bg-bg items-center justify-center mr-3 flex-shrink-0">
            <Text style={{ color: C.secondary, fontSize: 9, fontWeight: '900' }}>{idx + 1}</Text>
          </View>
          <View className="flex-1 pr-2">
            <Text className="text-primaryText font-bold text-[13px] leading-tight" numberOfLines={1}>{item.item_name}</Text>
            <Text className="text-secondaryText text-[10px] font-bold mt-0.5">₹{price} × {qty} {item.unit || 'pcs'}</Text>
          </View>
          <View className="bg-card rounded-xl px-2.5 py-1 mr-3">
            <Text className="text-primaryText font-black text-[12px]">{qty}</Text>
          </View>
          <Text className="text-primaryText font-black text-[13px] min-w-[52px] text-right">₹{lineTotal}</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Per-item edit modal */}
      <Modal visible={editing} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-center px-7"
          style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
        >
          <View className="bg-bg rounded-[32px] p-7" style={{ shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, elevation: 12 }}>
            <Text className="text-primaryText font-black text-[16px] mb-0.5" numberOfLines={1}>{item.item_name}</Text>
            <Text style={{ color: C.orange, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 20, textTransform: 'uppercase' }}>
              Bill-only · Catalog price unchanged
            </Text>
            <View className="flex-row gap-3 mb-6">
              <View className="flex-1">
                <Text className="text-secondaryText text-[9px] font-black uppercase tracking-widest mb-1.5 ml-1">Qty</Text>
                <TextInput
                  autoFocus value={editQty} onChangeText={setEditQty}
                  keyboardType="numeric" selectTextOnFocus
                  className="bg-card px-3 py-4 rounded-2xl text-primaryText font-black text-xl text-center border border-card"
                />
              </View>
              <View className="flex-1">
                <Text className="text-secondaryText text-[9px] font-black uppercase tracking-widest mb-1.5 ml-1">Price (₹)</Text>
                <TextInput
                  value={editPrice} onChangeText={setEditPrice}
                  keyboardType="numeric" selectTextOnFocus onSubmitEditing={commit}
                  className="bg-card px-3 py-4 rounded-2xl text-primaryText font-black text-xl text-center border border-card"
                />
              </View>
            </View>
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={() => setEditing(false)} className="flex-1 bg-card py-4 rounded-2xl items-center active:opacity-60">
                <Text className="text-primaryText font-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={commit} className="flex-[1.5] bg-primaryText py-4 rounded-2xl items-center active:opacity-70">
                <Text className="text-accent font-black uppercase tracking-widest text-sm">Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

// ─── Convert Estimate Modal ───────────────────────────────────────────────────
const ConvertEstimateModal = ({ bill, visible, onClose, convertAmountPaid, setConvertAmountPaid, handleConvertEstimate, isProcessing }) => {
  if (!bill) return null;
  const total     = Number(bill.total_amount) || 0;
  const paid      = Math.min(Number(convertAmountPaid) || 0, total);
  const remaining = total - paid;
  const isWalkIn  = !bill.customer_id;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}
      >
        <View style={{ backgroundColor: C.bg, borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingHorizontal: 28, paddingTop: 16, paddingBottom: 44 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: C.card, alignSelf: 'center', marginBottom: 24 }} />

          {/* Icon + title */}
          <View style={{ alignItems: 'center', marginBottom: 22 }}>
            <View style={{ width: 60, height: 60, borderRadius: 20, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 14, shadowColor: C.primary, shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 8 }}>
              <MaterialCommunityIcons name="swap-horizontal-bold" size={28} color={C.accent} />
            </View>
            <Text style={{ fontSize: 22, fontWeight: '900', color: C.primary, letterSpacing: -0.3 }}>Convert to Bill</Text>
            <Text style={{ fontSize: 12, color: C.secondary, fontWeight: '600', marginTop: 5, textAlign: 'center', lineHeight: 18 }}>
              This estimate becomes a real invoice.{'\n'}Record any upfront payment below.
            </Text>
          </View>

          {/* Walk-in warning */}
          {isWalkIn && (
            <View style={{ backgroundColor: '#fff7ed', borderWidth: 1.5, borderColor: '#fed7aa', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Feather name="alert-triangle" size={16} color={C.orange} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '900', color: '#92400e', letterSpacing: 0.2 }}>Walk-in Customer</Text>
                <Text style={{ fontSize: 10, color: C.orange, fontWeight: '700', marginTop: 2 }}>
                  Full payment required — Khata not available for walk-ins.
                </Text>
              </View>
            </View>
          )}

          {/* Summary card */}
          <View style={{ backgroundColor: C.white, borderRadius: 20, padding: 18, marginBottom: 18, borderWidth: 1, borderColor: '#f0ece6' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontSize: 10, color: C.secondary, fontWeight: '800', letterSpacing: 1.2 }}>ESTIMATE</Text>
              <Text style={{ fontSize: 12, color: C.primary, fontWeight: '900' }}>{bill.bill_number}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 10, color: C.secondary, fontWeight: '800', letterSpacing: 1.2 }}>TOTAL AMOUNT</Text>
              <Text style={{ fontSize: 22, color: C.primary, fontWeight: '900' }}>₹{total.toLocaleString('en-IN')}</Text>
            </View>
          </View>

          {/* Amount paid */}
          <Text style={{ fontSize: 9, color: C.secondary, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8, marginLeft: 4, textTransform: 'uppercase' }}>
            {isWalkIn ? 'Full Payment Required' : 'Amount Paid Now (Optional)'}
          </Text>
          <TextInput
            value={convertAmountPaid}
            onChangeText={setConvertAmountPaid}
            keyboardType="numeric"
            placeholder="₹ 0"
            placeholderTextColor="#c8c0b4"
            editable={!isWalkIn}
            style={{
              backgroundColor: isWalkIn ? '#f0ece6' : C.white,
              borderWidth: 2,
              borderColor: isWalkIn ? C.card : (Number(convertAmountPaid) > 0 ? C.primary : '#e8e4de'),
              borderRadius: 20,
              padding: 18,
              fontSize: 30,
              fontWeight: '900',
              textAlign: 'center',
              color: C.primary,
              marginBottom: 14,
              opacity: isWalkIn ? 0.5 : 1,
            }}
          />

          {/* Remaining preview */}
          {remaining > 0 && Number(convertAmountPaid) > 0 && !isWalkIn && (
            <View style={{ backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa', borderRadius: 14, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <Text style={{ fontSize: 10, color: '#c2410c', fontWeight: '800', letterSpacing: 1 }}>REMAINING DUE</Text>
              <Text style={{ fontSize: 16, color: '#c2410c', fontWeight: '900' }}>₹{remaining.toLocaleString('en-IN')}</Text>
            </View>
          )}

          {/* Walk-in: block if not fully paid */}
          {isWalkIn && Number(convertAmountPaid) < total && Number(convertAmountPaid) !== 0 && (
            <View style={{ backgroundColor: '#fff1f2', borderWidth: 1, borderColor: '#fecdd3', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Feather name="x-circle" size={14} color={C.red} />
              <Text style={{ fontSize: 11, color: C.red, fontWeight: '700', flex: 1 }}>
                Walk-in bills require full payment upfront.
              </Text>
            </View>
          )}

          {/* Buttons */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
            <Pressable onPress={onClose} style={{ flex: 1, paddingVertical: 18, borderRadius: 20, backgroundColor: C.card, alignItems: 'center' }}>
              <Text style={{ color: C.primary, fontWeight: '800', fontSize: 14 }}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (isWalkIn && Number(convertAmountPaid) < total) {
                  // Auto-fill full amount for walk-in
                  setConvertAmountPaid(String(total));
                  return;
                }
                handleConvertEstimate();
              }}
              disabled={isProcessing}
              style={{ flex: 1.8, paddingVertical: 18, borderRadius: 20, backgroundColor: C.primary, alignItems: 'center', shadowColor: C.primary, shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 }}
            >
              {isProcessing
                ? <ActivityIndicator color={C.accent} />
                : <Text style={{ color: C.accent, fontWeight: '900', fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {isWalkIn && Number(convertAmountPaid) < total ? 'Set Full Amount' : 'Confirm Convert'}
                  </Text>
              }
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function BillDetailScreen() {
  const { id }    = useLocalSearchParams();
  const router    = useRouter();
  const { user }  = useAuth();
  const { can }   = usePermission();

  const handleShare = async () => {
    try {
      if (!bill) return Alert.alert('Error', 'Bill not loaded yet.');
      await billService.generateAndShare(bill, user);
    } catch (err) {
      console.error('PDF Error:', err);
      Alert.alert('Error', 'Failed to generate PDF.');
    }
  };

  const {
    bill, loading, isProcessing, safeNum, profitTotals,
    isProfitVisible, setIsProfitVisible,
    pinModalVisible, setPinModalVisible, pinInput, setPinInput, isVerifyingPin, handleVerifyPin,
    paymentModalVisible, setPaymentModalVisible, paymentInput, setPaymentInput, handleUpdatePayment,
    isEditing, setIsEditing, startEditing, saveEdits,
    editItems, updateEditItem, removeEditItem, editDiscount, setEditDiscount, editExtraFare, setEditExtraFare, editTotals,
    productSearchModal, setProductSearchModal, searchQuery, setSearchQuery, filteredCatalog, addNewProductToBill,
    handleDeleteBill,
    convertModalVisible, setConvertModalVisible,
    convertAmountPaid, setConvertAmountPaid,
    openConvertModal, handleConvertEstimate,
  } = useBillDetail(id);

  if (loading || !bill) {
    return (
      <SafeAreaView className="flex-1 bg-bg justify-center items-center">
        <ActivityIndicator size="large" color={C.primary} />
      </SafeAreaView>
    );
  }

  const pendingAmount = Math.max(0, bill.total_amount - (bill.amount_paid || 0));
  const isEstimate    = bill.is_estimate;
  const isWalkIn      = !bill.customer_id;

  const dateString = new Date(bill.createdAt).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  // Subtotal before adjustments
  const subtotal = bill.items.reduce((s, i) => s + safeNum(i.sale_price) * safeNum(i.quantity), 0);

  const statusColor = isEstimate
    ? { bg: '#f0f9ff', border: '#bae6fd', text: '#0369a1' }
    : bill.status === 'Paid'
      ? { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' }
      : bill.status === 'Partial'
        ? { bg: '#fff7ed', border: '#fed7aa', text: '#c2410c' }
        : { bg: '#fff1f2', border: '#fecdd3', text: C.red };

  // ── EDIT MODE ─────────────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        {/* Edit Header */}
        <View className="px-5 pt-4 pb-3 flex-row items-center">
          <Pressable onPress={() => setIsEditing(false)} className="bg-card p-3 rounded-2xl mr-4 active:opacity-60">
            <Feather name="x" size={20} color={C.primary} />
          </Pressable>
          <View className="flex-1">
            <Text className="text-primaryText text-xl font-black tracking-tight">Edit Invoice</Text>
            <Text className="text-secondaryText text-[11px] font-bold mt-0.5">{bill.bill_number}</Text>
          </View>
          {/* Live total pill */}
          <View style={{ backgroundColor: C.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 }}>
            <Text style={{ color: C.accent, fontWeight: '900', fontSize: 15 }}>₹{editTotals.finalTotal}</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 140 }}>
          {/* Items section */}
          <View className="px-5 mb-4">
            <Text className="text-secondaryText text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Items</Text>
            <View className="bg-white rounded-[22px] overflow-hidden border border-card"
              style={{ shadowColor: '#c8c0b4', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}
            >
              {editItems.length === 0 ? (
                <View className="items-center py-10 opacity-40">
                  <Feather name="shopping-cart" size={28} color={C.primary} />
                  <Text className="text-primaryText font-bold mt-2 text-sm">No items</Text>
                </View>
              ) : editItems.map((item, idx) => (
                <EditItemRow
                  key={idx}
                  item={item}
                  idx={idx}
                  isLast={idx === editItems.length - 1}
                  safeNum={safeNum}
                  onUpdatePrice={(i, v) => updateEditItem(i, 'sale_price', v)}
                  onUpdateQty={(i, v) => updateEditItem(i, 'quantity', v)}
                  onRemove={removeEditItem}
                />
              ))}
            </View>
            <Text className="text-secondaryText text-[9px] font-bold opacity-40 text-right mt-1 mr-1">
              Swipe ← to remove · Hold to edit qty & price
            </Text>
          </View>

          {/* Add product */}
          <View className="px-5 mb-4">
            <Pressable
              onPress={() => setProductSearchModal(true)}
              className="bg-white rounded-[22px] px-4 py-4 flex-row items-center justify-center border border-dashed border-secondary/40 active:opacity-60 gap-2"
            >
              <View style={{ backgroundColor: C.primary, width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="plus" size={14} color={C.accent} />
              </View>
              <Text className="text-primaryText font-black text-[12px] uppercase tracking-widest">Add Product</Text>
            </Pressable>
          </View>

          {/* Adjustments */}
          <View className="px-5 mb-4">
            <Text className="text-secondaryText text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Adjustments</Text>
            <View className="bg-white rounded-[22px] px-5 py-4 border border-card flex-row gap-4"
              style={{ shadowColor: '#c8c0b4', shadowOpacity: 0.1, shadowRadius: 6, elevation: 1 }}
            >
              <View className="flex-1">
                <Text className="text-secondaryText text-[9px] font-black uppercase tracking-widest mb-2 ml-1">Discount (₹)</Text>
                <TextInput
                  value={editDiscount} onChangeText={setEditDiscount}
                  keyboardType="numeric" placeholder="0" placeholderTextColor="#c8c0b4"
                  className="bg-bg px-4 py-3 rounded-xl border border-card font-bold text-primaryText text-center text-lg"
                />
              </View>
              <View className="flex-1">
                <Text className="text-secondaryText text-[9px] font-black uppercase tracking-widest mb-2 ml-1">Extra Fare (₹)</Text>
                <TextInput
                  value={editExtraFare} onChangeText={setEditExtraFare}
                  keyboardType="numeric" placeholder="0" placeholderTextColor="#c8c0b4"
                  className="bg-bg px-4 py-3 rounded-xl border border-card font-bold text-primaryText text-center text-lg"
                />
              </View>
            </View>
          </View>

          {/* Grand total */}
          <View className="px-5">
            <View style={{ backgroundColor: C.primary, borderRadius: 24, padding: 22, shadowColor: C.primary, shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 5 }}>
              {safeNum(editDiscount) > 0 && (
                <View className="flex-row justify-between mb-2">
                  <Text style={{ color: C.white, opacity: 0.5, fontWeight: '700', fontSize: 11 }}>Discount</Text>
                  <Text style={{ color: C.green, fontWeight: '700', fontSize: 11 }}>−₹{editDiscount}</Text>
                </View>
              )}
              {safeNum(editExtraFare) > 0 && (
                <View className="flex-row justify-between mb-2">
                  <Text style={{ color: C.white, opacity: 0.5, fontWeight: '700', fontSize: 11 }}>Extra Fare</Text>
                  <Text style={{ color: C.white, opacity: 0.7, fontWeight: '700', fontSize: 11 }}>+₹{editExtraFare}</Text>
                </View>
              )}
              <View className="flex-row justify-between items-center pt-2">
                <Text style={{ color: C.white, opacity: 0.6, fontWeight: '900', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2 }}>Grand Total</Text>
                <Text style={{ color: C.accent, fontSize: 32, fontWeight: '900' }}>₹{editTotals.finalTotal}</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Save footer */}
        <View className="absolute bottom-0 left-0 right-0 bg-bg px-5 pt-3 pb-8 border-t border-card/50">
          <Pressable
            onPress={saveEdits}
            disabled={isProcessing}
            style={{ backgroundColor: C.accent, borderRadius: 20, paddingVertical: 18, alignItems: 'center', shadowColor: C.accent, shadowOpacity: 0.4, shadowRadius: 10, elevation: 4 }}
          >
            {isProcessing
              ? <ActivityIndicator color={C.primary} />
              : <Text style={{ color: C.primary, fontWeight: '900', fontSize: 15, textTransform: 'uppercase', letterSpacing: 1.5 }}>Save Changes</Text>
            }
          </Pressable>
        </View>

        {/* Product search modal */}
        <Modal visible={productSearchModal} transparent animationType="slide">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' }}
          >
            <View style={{ backgroundColor: C.bg, borderTopLeftRadius: 44, borderTopRightRadius: 44, paddingTop: 16, paddingBottom: 8, maxHeight: '78%' }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: C.card, alignSelf: 'center', marginBottom: 20 }} />
              <View className="flex-row items-center justify-between px-6 mb-4">
                <View>
                  <Text className="text-primaryText text-xl font-black">Add to Invoice</Text>
                  <Text className="text-secondaryText text-[10px] font-bold mt-0.5">Search your inventory</Text>
                </View>
                <TouchableOpacity onPress={() => setProductSearchModal(false)} className="bg-card w-9 h-9 rounded-full items-center justify-center">
                  <Feather name="x" size={17} color={C.primary} />
                </TouchableOpacity>
              </View>
              <View className="mx-6 mb-3 bg-white flex-row items-center px-4 py-3 rounded-2xl border border-card">
                <Feather name="search" size={16} color="#bfb5a8" />
                <TextInput
                  autoFocus placeholder="Type product name..." placeholderTextColor="#bfb5a8"
                  value={searchQuery} onChangeText={setSearchQuery}
                  className="flex-1 ml-3 text-primaryText font-bold text-sm"
                />
              </View>
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}>
                {searchQuery.length === 0 && (
                  <Text className="text-secondaryText font-bold text-center py-6 opacity-30 text-sm">Start typing to search…</Text>
                )}
                {filteredCatalog.map(p => (
                  <TouchableOpacity
                    key={p._id}
                    onPress={() => addNewProductToBill(p)}
                    activeOpacity={0.8}
                    className="flex-row items-center px-4 py-3 mb-2 rounded-2xl border bg-white border-card"
                  >
                    <View className="flex-1">
                      <Text className="font-bold text-[13px] text-primaryText" numberOfLines={1}>{p.item_name}</Text>
                      <Text className="text-secondaryText text-[10px] font-bold mt-0.5">
                        ₹{bill.price_mode === 'Wholesale' ? p.wholesale_price : p.retail_price} / {p.unit || 'pcs'}
                      </Text>
                    </View>
                    <View style={{ backgroundColor: C.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Feather name="plus" size={11} color={C.accent} />
                      <Text style={{ color: C.accent, fontWeight: '900', fontSize: 10, textTransform: 'uppercase' }}>Add</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    );
  }

  // ── VIEW MODE ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-bg">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <View className="px-5 pt-4 pb-3 flex-row items-center">
        <Pressable onPress={() => router.back()} className="bg-card p-3 rounded-2xl mr-4 active:opacity-60">
          <Feather name="arrow-left" size={20} color={C.primary} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-primaryText text-xl font-black tracking-tight">
            {isEstimate ? 'Estimate' : 'Invoice'}
          </Text>
          <Text className="text-secondaryText text-[11px] font-bold mt-0.5">{bill.bill_number}</Text>
        </View>

        {/* Profit lock icon — always visible (shows PIN modal, then profit) */}
        <TouchableOpacity
          onPress={() => setPinModalVisible(true)}
          activeOpacity={0.8}
          style={{ backgroundColor: C.card, width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}
        >
          <Feather name="lock" size={17} color={C.primary} />
        </TouchableOpacity>

        {/* Share PDF */}
        <TouchableOpacity
          onPress={handleShare}
          activeOpacity={0.8}
          style={{ backgroundColor: C.primary, width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: can('bills', 'update') ? 8 : 0 }}
        >
          <Feather name="share-2" size={17} color={C.accent} />
        </TouchableOpacity>

        {/* Edit icon (permission guarded) */}
        {can('bills', 'update') && (
          <TouchableOpacity
            onPress={startEditing}
            activeOpacity={0.8}
            style={{ backgroundColor: '#fef9c3', width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fde047' }}
          >
            <Feather name="edit-2" size={17} color="#854d0e" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: isEstimate ? 160 : 140 }}
      >

        {/* ── Hero Receipt Card ──────────────────────────────────────────── */}
        <View className="mb-5 mt-1" style={{ borderRadius: 28, overflow: 'hidden', shadowColor: C.primary, shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6 }}>

          {/* Header band */}
          <View style={{ backgroundColor: C.primary, padding: 22 }}>
            <View className="flex-row justify-between items-start mb-5">
              <View className="flex-1 pr-4">
                <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9, fontWeight: '800', letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 4 }}>
                  {isEstimate ? 'Estimate for' : 'Billed To'}
                </Text>
                <Text style={{ color: isWalkIn ? 'rgba(229,252,1,0.7)' : C.accent, fontSize: 22, fontWeight: '900', letterSpacing: -0.3 }} numberOfLines={1}>
                  {bill.customer_id?.name || 'Walk-in Customer'}
                </Text>
                {bill.customer_id?.phone && (
                  <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '600', marginTop: 3 }}>
                    {bill.customer_id.phone}
                  </Text>
                )}
              </View>
              {/* Status badge */}
              <View style={{ backgroundColor: statusColor.bg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1.5, borderColor: statusColor.border }}>
                <Text style={{ color: statusColor.text, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {isEstimate ? 'ESTIMATE' : bill.status}
                </Text>
              </View>
            </View>

            {/* Meta row */}
            <View className="flex-row justify-between items-center pt-4" style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }}>
              <View className="flex-row items-center gap-1.5">
                <Feather name="hash" size={10} color="rgba(255,255,255,0.35)" />
                <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>{bill.bill_number}</Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <Feather name="calendar" size={10} color="rgba(255,255,255,0.35)" />
                <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: '700' }}>{dateString}</Text>
              </View>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 }}>{bill.price_mode}</Text>
              </View>
            </View>
          </View>

          {/* Items list */}
          <View style={{ backgroundColor: C.white, paddingTop: 4, paddingBottom: 4, minHeight: 80 }}>
            {bill.items.map((item, idx) => (
              <View
                key={idx}
                className="flex-row items-center px-5 py-3.5"
                style={idx < bill.items.length - 1 ? { borderBottomWidth: 1, borderBottomColor: '#f0ece6' } : {}}
              >
                <View style={{ width: 22, height: 22, borderRadius: 8, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Text style={{ color: C.secondary, fontSize: 9, fontWeight: '900' }}>{idx + 1}</Text>
                </View>
                <View className="flex-1 pr-3">
                  <Text className="text-primaryText font-bold text-[13px] leading-tight" numberOfLines={1}>{item.item_name}</Text>
                  <Text className="text-secondaryText text-[10px] font-bold mt-0.5">
                    {item.quantity} {item.unit || 'pcs'} × ₹{safeNum(item.sale_price).toLocaleString('en-IN')}
                    {item.brand_applied && item.brand_applied !== 'Generic' && (
                      <Text style={{ color: C.orange }}> · {item.brand_applied}</Text>
                    )}
                  </Text>
                </View>
                <Text className="text-primaryText font-black text-[13px]">
                  ₹{(safeNum(item.quantity) * safeNum(item.sale_price)).toLocaleString('en-IN')}
                </Text>
              </View>
            ))}
          </View>

          {/* Dashed tear-off */}
          <View style={{ height: 16, backgroundColor: C.white, overflow: 'hidden', position: 'relative' }}>
            <View style={{ position: 'absolute', top: '50%', left: 0, right: 0, borderTopWidth: 1.5, borderColor: C.card, borderStyle: 'dashed' }} />
            <View style={{ position: 'absolute', width: 24, height: 24, borderRadius: 12, backgroundColor: C.bg, left: -12, top: -4 }} />
            <View style={{ position: 'absolute', width: 24, height: 24, borderRadius: 12, backgroundColor: C.bg, right: -12, top: -4 }} />
          </View>

          {/* Totals */}
          <View style={{ backgroundColor: C.white, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 18 }}>
            {(bill.discount > 0 || bill.extra_fare > 0) && (
              <>
                <View className="flex-row justify-between mb-2">
                  <Text style={{ color: C.secondary, fontSize: 11, fontWeight: '700' }}>Subtotal</Text>
                  <Text style={{ color: C.primary, fontSize: 11, fontWeight: '700' }}>₹{subtotal.toLocaleString('en-IN')}</Text>
                </View>
                {bill.discount > 0 && (
                  <View className="flex-row justify-between mb-2">
                    <View className="flex-row items-center gap-1">
                      <Feather name="tag" size={10} color="#16a34a" />
                      <Text style={{ color: '#16a34a', fontSize: 11, fontWeight: '700' }}>Discount</Text>
                    </View>
                    <Text style={{ color: '#16a34a', fontSize: 11, fontWeight: '700' }}>−₹{safeNum(bill.discount).toLocaleString('en-IN')}</Text>
                  </View>
                )}
                {bill.extra_fare > 0 && (
                  <View className="flex-row justify-between mb-2">
                    <View className="flex-row items-center gap-1">
                      <Feather name="truck" size={10} color={C.secondary} />
                      <Text style={{ color: C.secondary, fontSize: 11, fontWeight: '700' }}>Extra Fare</Text>
                    </View>
                    <Text style={{ color: C.primary, fontSize: 11, fontWeight: '700' }}>+₹{safeNum(bill.extra_fare).toLocaleString('en-IN')}</Text>
                  </View>
                )}
                <View style={{ borderTopWidth: 1, borderTopColor: '#f0ece6', marginTop: 6, marginBottom: 6 }} />
              </>
            )}
            <View className="flex-row justify-between items-center mt-1">
              <Text style={{ color: C.secondary, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5 }}>Grand Total</Text>
              <Text style={{ color: C.primary, fontSize: 26, fontWeight: '900' }}>₹{safeNum(bill.total_amount).toLocaleString('en-IN')}</Text>
            </View>
            {!isEstimate && bill.amount_paid > 0 && (
              <>
                <View className="flex-row justify-between items-center mt-2">
                  <View className="flex-row items-center gap-1">
                    <Feather name="check-circle" size={10} color="#16a34a" />
                    <Text style={{ color: '#16a34a', fontSize: 11, fontWeight: '700' }}>Paid</Text>
                  </View>
                  <Text style={{ color: '#16a34a', fontSize: 13, fontWeight: '800' }}>₹{safeNum(bill.amount_paid).toLocaleString('en-IN')}</Text>
                </View>
                {pendingAmount > 0 && (
                  <View className="flex-row justify-between items-center mt-1">
                    <View className="flex-row items-center gap-1">
                      <Feather name="clock" size={10} color={C.red} />
                      <Text style={{ color: C.red, fontSize: 11, fontWeight: '700' }}>Pending</Text>
                    </View>
                    <Text style={{ color: C.red, fontSize: 13, fontWeight: '800' }}>₹{pendingAmount.toLocaleString('en-IN')}</Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        {/* ── Details grid ──────────────────────────────────────────────── */}
        <View className="flex-row gap-3 mb-4">
          {/* Items count */}
          <View style={{ flex: 1, backgroundColor: C.white, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#f0ece6' }}>
            <Text style={{ color: C.secondary, fontSize: 9, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>Items</Text>
            <Text style={{ color: C.primary, fontSize: 22, fontWeight: '900' }}>{bill.items.length}</Text>
            <Text style={{ color: C.secondary, fontSize: 10, fontWeight: '700', marginTop: 2 }}>products</Text>
          </View>

          {/* Pending / Paid */}
          {!isEstimate && (
            <View style={{ flex: 1.4, backgroundColor: pendingAmount > 0 ? '#fff1f2' : '#f0fdf4', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: pendingAmount > 0 ? '#fecdd3' : '#bbf7d0' }}>
              <Text style={{ color: pendingAmount > 0 ? '#f87171' : '#4ade80', fontSize: 9, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
                {pendingAmount > 0 ? 'Pending' : 'Cleared'}
              </Text>
              <Text style={{ color: pendingAmount > 0 ? C.red : '#15803d', fontSize: 22, fontWeight: '900' }}>
                ₹{pendingAmount > 0 ? pendingAmount.toLocaleString('en-IN') : safeNum(bill.total_amount).toLocaleString('en-IN')}
              </Text>
              <Text style={{ color: pendingAmount > 0 ? '#f87171' : '#4ade80', fontSize: 10, fontWeight: '700', marginTop: 2 }}>
                {pendingAmount > 0 ? 'in khata' : 'fully paid'}
              </Text>
            </View>
          )}

          {/* Created by */}
          <View style={{ flex: 1.2, backgroundColor: C.white, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#f0ece6' }}>
            <Text style={{ color: C.secondary, fontSize: 9, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>By</Text>
            <Text style={{ color: C.primary, fontSize: 13, fontWeight: '900', lineHeight: 16 }} numberOfLines={2}>
              {bill.created_by || '—'}
            </Text>
            {bill.updated_by && bill.updated_by !== bill.created_by && (
              <Text style={{ color: C.secondary, fontSize: 9, fontWeight: '700', marginTop: 4 }}>Edited: {bill.updated_by}</Text>
            )}
          </View>
        </View>

        {/* ── Brand conversion note ──────────────────────────────────────── */}
        {bill.brand_converted_by && (
          <View style={{ backgroundColor: '#fffbeb', borderRadius: 16, padding: 14, marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#fde68a' }}>
            <MaterialCommunityIcons name="swap-horizontal" size={16} color="#d97706" />
            <Text style={{ color: '#92400e', fontSize: 11, fontWeight: '700', flex: 1 }}>
              Brand converted by <Text style={{ fontWeight: '900' }}>{bill.brand_converted_by}</Text>
            </Text>
          </View>
        )}

      </ScrollView>

      {/* ── Sticky Bottom CTA ──────────────────────────────────────────────── */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: C.bg, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28,
        borderTopWidth: 1, borderTopColor: `${C.card}88`,
      }}>
        {isEstimate ? (
          /* Estimate: Convert + Delete */
          <View className="flex-row gap-3">
            {can('bills', 'delete') && (
              <Pressable
                onPress={handleDeleteBill}
                disabled={isProcessing}
                style={{ flex: 1, paddingVertical: 16, borderRadius: 18, backgroundColor: '#fff1f2', borderWidth: 1.5, borderColor: '#fecdd3', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }}
                className="active:opacity-70"
              >
                <Feather name="trash-2" size={15} color={C.red} />
                <Text style={{ color: C.red, fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Delete</Text>
              </Pressable>
            )}
            {can('bills', 'create') && (
              <Pressable
                onPress={openConvertModal}
                disabled={isProcessing}
                style={{ flex: 2, paddingVertical: 16, borderRadius: 18, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, shadowColor: C.primary, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}
                className="active:opacity-80"
              >
                <MaterialCommunityIcons name="swap-horizontal-bold" size={17} color={C.accent} />
                <Text style={{ color: C.accent, fontWeight: '900', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>Convert to Bill</Text>
              </Pressable>
            )}
          </View>
        ) : (
          /* Real bill: Add Payment + Delete */
          <View className="flex-row gap-3">
            {can('bills', 'delete') && (
              <Pressable
                onPress={handleDeleteBill}
                disabled={isProcessing}
                style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: '#fff1f2', borderWidth: 1.5, borderColor: '#fecdd3', alignItems: 'center', justifyContent: 'center' }}
                className="active:opacity-70"
              >
                <Feather name="trash-2" size={17} color={C.red} />
              </Pressable>
            )}
            {can('khata', 'update') && (
              <Pressable
                onPress={() => setPaymentModalVisible(true)}
                disabled={pendingAmount <= 0}
                style={{
                  flex: 1, paddingVertical: 16, borderRadius: 18,
                  backgroundColor: pendingAmount > 0 ? C.primary : C.card,
                  alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8,
                  shadowColor: pendingAmount > 0 ? C.primary : 'transparent',
                  shadowOpacity: 0.25, shadowRadius: 8, elevation: pendingAmount > 0 ? 4 : 0,
                  opacity: pendingAmount > 0 ? 1 : 0.5,
                }}
                className="active:opacity-80"
              >
                <MaterialCommunityIcons name="cash-plus" size={18} color={pendingAmount > 0 ? C.accent : C.secondary} />
                <Text style={{ color: pendingAmount > 0 ? C.accent : C.secondary, fontWeight: '900', fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  {pendingAmount > 0 ? `Add Payment` : 'Fully Paid'}
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* ── Convert Estimate Modal ─────────────────────────────────────────── */}
      <ConvertEstimateModal
        bill={bill}
        visible={convertModalVisible}
        onClose={() => setConvertModalVisible(false)}
        convertAmountPaid={convertAmountPaid}
        setConvertAmountPaid={setConvertAmountPaid}
        handleConvertEstimate={handleConvertEstimate}
        isProcessing={isProcessing}
      />

      {/* ── Add Payment Modal ──────────────────────────────────────────────── */}
      <Modal visible={paymentModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', paddingHorizontal: 28 }}
        >
          <View style={{ backgroundColor: C.bg, borderRadius: 40, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 24, elevation: 16 }}>
            <View style={{ backgroundColor: `${C.green}25`, width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1.5, borderColor: `${C.green}40` }}>
              <MaterialCommunityIcons name="cash-fast" size={28} color={C.green} />
            </View>
            <Text style={{ color: C.primary, fontSize: 22, fontWeight: '900', marginBottom: 4 }}>Record Payment</Text>
            <Text style={{ color: C.secondary, fontSize: 12, fontWeight: '700', marginBottom: 24 }}>
              Pending: ₹{pendingAmount.toLocaleString('en-IN')}
            </Text>
            <TextInput
              autoFocus keyboardType="numeric" value={paymentInput} onChangeText={setPaymentInput}
              placeholder="0.00" placeholderTextColor="#c8c0b4"
              style={{ backgroundColor: C.white, width: '100%', padding: 20, borderRadius: 20, borderWidth: 1.5, borderColor: C.card, fontWeight: '900', fontSize: 28, textAlign: 'center', color: C.primary, marginBottom: 20 }}
            />
            <View className="flex-row gap-3 w-full">
              <Pressable onPress={() => setPaymentModalVisible(false)} style={{ flex: 1, backgroundColor: C.card, paddingVertical: 16, borderRadius: 18, alignItems: 'center' }}>
                <Text style={{ color: C.primary, fontWeight: '700' }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleUpdatePayment}
                disabled={isProcessing}
                style={{ flex: 1.5, backgroundColor: C.green, paddingVertical: 16, borderRadius: 18, alignItems: 'center', shadowColor: C.green, shadowOpacity: 0.4, shadowRadius: 8, elevation: 3 }}
              >
                {isProcessing ? <ActivityIndicator color="#1f2617" /> : <Text style={{ color: '#1f2617', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>Save</Text>}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── PIN Modal ─────────────────────────────────────────────────────── */}
      <Modal visible={pinModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', paddingHorizontal: 28 }}
        >
          <View style={{ backgroundColor: C.bg, borderRadius: 40, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 24, elevation: 16 }}>
            <View style={{ backgroundColor: '#f0fdf4', width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1.5, borderColor: '#bbf7d0' }}>
              <Feather name="shield" size={26} color="#16a34a" />
            </View>
            <Text style={{ color: C.primary, fontSize: 22, fontWeight: '900', marginBottom: 4 }}>Owner PIN</Text>
            <Text style={{ color: C.secondary, fontSize: 12, fontWeight: '600', textAlign: 'center', marginBottom: 24, lineHeight: 18 }}>
              Enter your 4-digit PIN to{'\n'}view profit details
            </Text>
            <TextInput
              autoFocus secureTextEntry keyboardType="numeric" maxLength={4}
              value={pinInput} onChangeText={setPinInput}
              placeholder="••••" placeholderTextColor="#c8c0b4"
              style={{ backgroundColor: C.white, width: '100%', padding: 20, borderRadius: 20, borderWidth: 1.5, borderColor: C.card, fontWeight: '900', fontSize: 24, textAlign: 'center', color: C.primary, letterSpacing: 12, marginBottom: 20 }}
            />
            <View className="flex-row gap-3 w-full">
              <Pressable onPress={() => { setPinModalVisible(false); setPinInput(''); }} style={{ flex: 1, backgroundColor: C.card, paddingVertical: 16, borderRadius: 18, alignItems: 'center' }}>
                <Text style={{ color: C.primary, fontWeight: '700' }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleVerifyPin}
                disabled={isVerifyingPin}
                style={{ flex: 1.5, backgroundColor: C.primary, paddingVertical: 16, borderRadius: 18, alignItems: 'center' }}
              >
                {isVerifyingPin ? <ActivityIndicator color={C.accent} /> : <Text style={{ color: C.accent, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>Verify</Text>}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Profit Sheet ─────────────────────────────────────────────────────── */}
      <ProfitSheet
        visible={isProfitVisible}
        onClose={() => setIsProfitVisible(false)}
        cartItems={bill.items.map(i => ({
          ...i,
          _id:             i.product_id,
          qty:             i.quantity,
          item_name:       i.item_name,
          _overridePrice:  i.sale_price,
          wholesale_price: i.sale_price,
          retail_price:    i.sale_price,
          purchase_price:  i.purchase_price, // Ensure cost is passed for row-level math
        }))}
        totals={{
          itemsTotal: subtotal,
          finalTotal: safeNum(bill.total_amount),
          profit: safeNum(profitTotals?.profit) // FIXED: Added profit so math doesn't return NaN!
        }}
        priceMode={bill.price_mode || 'Retail'}
        safeNum={safeNum}
      />
    </SafeAreaView>
  );
}
import React from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useBillDetail } from '@/src/hooks/useBillDetail';
import { useAuth } from '../../src/context/AuthContext';
import { billService } from '../../src/services/billService';

export default function BillDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth(); // Get shop details from context

const handleShare = async () => {
  try {
    // Check if bill exists before sharing
    if (!bill) return Alert.alert("Error", "Bill data not loaded yet.");
    
    await billService.generateAndShare(bill, user);
  } catch (err) {
    // Log the real error to your console so you can see if it's a native module issue
    console.error("PDF Error:", err);
    Alert.alert("Error", "Failed to generate PDF. Check console for details.");
  }
};
  
  const {
    bill, loading, isProcessing, safeNum, profitTotals,
    isProfitVisible, setIsProfitVisible, pinModalVisible, setPinModalVisible, pinInput, setPinInput, handleVerifyPin,
    paymentModalVisible, setPaymentModalVisible, paymentInput, setPaymentInput, handleUpdatePayment,
    isEditing, setIsEditing, startEditing, saveEdits,
    editItems, updateEditItem, removeEditItem, editDiscount, setEditDiscount, editExtraFare, setEditExtraFare, editTotals,
    productSearchModal, setProductSearchModal, searchQuery, setSearchQuery, filteredCatalog, addNewProductToBill
  } = useBillDetail(id);

  if (loading || !bill) {
    return (
      <SafeAreaView className="flex-1 bg-bg justify-center items-center">
        <ActivityIndicator size="large" color="#1f2617" />
      </SafeAreaView>
    );
  }

  const pendingAmount = bill.total_amount - (bill.amount_paid || 0);
  const dateString = new Date(bill.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  // ==========================================
  // VIEW 1: INTERACTIVE EDIT MODE
  // ==========================================
  if (isEditing) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <View className="px-6 py-4 flex-row justify-between items-center bg-card/30">
          <Pressable onPress={() => setIsEditing(false)} className="p-2 active:opacity-50">
            <Feather name="x" size={24} color="#1f2617" />
          </Pressable>
          <Text className="text-primaryText text-xl font-black">Edit Invoice</Text>
          <View className="w-10" />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: 120 }}>
          {/* Editable Items */}
          <Text className="text-secondaryText text-[10px] font-bold uppercase tracking-widest mb-4">Cart Items</Text>
          {editItems.map((item, idx) => (
            <View key={idx} className="bg-white p-5 rounded-3xl mb-4 border border-card shadow-sm">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-primaryText font-black text-base flex-1" numberOfLines={1}>{item.item_name}</Text>
                <Pressable onPress={() => removeEditItem(idx)} className="bg-red-50 p-2 rounded-full border border-red-100 active:opacity-50">
                  <Feather name="trash-2" size={16} color="#ef4444" />
                </Pressable>
              </View>
              
              <View className="flex-row gap-4 items-center">
                <View className="flex-[0.8]">
                  <Text className="text-secondaryText text-[10px] uppercase font-bold mb-1 ml-1">Price (₹)</Text>
                  <TextInput 
                    value={String(item.sale_price)}
                    onChangeText={(val) => updateEditItem(idx, 'sale_price', val)}
                    keyboardType="numeric"
                    className="bg-bg p-3 rounded-xl border border-card font-black text-primaryText"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-secondaryText text-[10px] uppercase font-bold mb-1 ml-1">Quantity</Text>
                  <View className="flex-row items-center bg-bg rounded-xl border border-card h-[46px]">
                    <Pressable onPress={() => updateEditItem(idx, 'quantity', Math.max(1, safeNum(item.quantity) - 1))} className="p-3 active:opacity-50"><Feather name="minus" size={16}/></Pressable>
                    <Text className="flex-1 text-center font-black text-primaryText">{item.quantity}</Text>
                    <Pressable onPress={() => updateEditItem(idx, 'quantity', safeNum(item.quantity) + 1)} className="p-3 active:opacity-50"><Feather name="plus" size={16}/></Pressable>
                  </View>
                </View>
              </View>
            </View>
          ))}

          {/* Add Product Button */}
          <Pressable onPress={() => setProductSearchModal(true)} className="bg-card/30 p-4 rounded-3xl border border-dashed border-secondary/30 items-center justify-center flex-row mb-8 active:opacity-50">
            <Feather name="plus-circle" size={18} color="#1f2617" />
            <Text className="text-primaryText font-black ml-2 uppercase tracking-widest text-xs">Add New Product</Text>
          </Pressable>

          {/* Editable Fares & Discounts */}
          <View className="flex-row gap-4 mb-6">
            <View className="flex-1">
              <Text className="text-secondaryText text-[10px] font-bold uppercase ml-2 mb-2">Discount (₹)</Text>
              <TextInput value={editDiscount} onChangeText={setEditDiscount} keyboardType="numeric" className="bg-white p-4 rounded-2xl border border-card font-bold shadow-sm" />
            </View>
            <View className="flex-1">
              <Text className="text-secondaryText text-[10px] font-bold uppercase ml-2 mb-2">Extra Fare (₹)</Text>
              <TextInput value={editExtraFare} onChangeText={setEditExtraFare} keyboardType="numeric" className="bg-white p-4 rounded-2xl border border-card font-bold shadow-sm" />
            </View>
          </View>
          
          <View className="bg-primaryText p-5 rounded-3xl flex-row justify-between items-center">
            <Text className="text-bg font-bold uppercase tracking-widest text-xs">New Total</Text>
            <Text className="text-accent text-2xl font-black">₹{editTotals.finalTotal}</Text>
          </View>
        </ScrollView>

        {/* Save Edits Footer */}
        <View className="absolute bottom-0 left-0 right-0 bg-bg px-6 pt-4 pb-8 border-t border-card/50">
          <Pressable onPress={saveEdits} disabled={isProcessing} className="bg-accent py-5 rounded-2xl items-center shadow-lg shadow-accent/30 active:opacity-70">
            {isProcessing ? <ActivityIndicator color="#1f2617"/> : <Text className="text-primaryText font-black text-lg uppercase tracking-widest">Save Changes</Text>}
          </Pressable>
        </View>

        {/* Product Search Catalog Modal */}
        <Modal visible={productSearchModal} animationType="slide">
          <SafeAreaView className="flex-1 bg-bg">
            <View className="p-6 border-b border-card/50">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-primaryText text-2xl font-black">Select Product</Text>
                <Pressable onPress={() => setProductSearchModal(false)} className="p-2 bg-card rounded-full"><Feather name="x" size={20}/></Pressable>
              </View>
              <TextInput 
                value={searchQuery} onChangeText={setSearchQuery} 
                placeholder="Search catalog..." 
                className="bg-white p-4 rounded-2xl border border-card font-bold shadow-sm" 
              />
            </View>
            <ScrollView className="px-6 py-4">
              {filteredCatalog.map(p => (
                <Pressable key={p._id} onPress={() => addNewProductToBill(p)} className="bg-white p-4 rounded-2xl mb-3 border border-card flex-row justify-between items-center active:opacity-50">
                  <View className="flex-1">
                    <Text className="font-bold text-primaryText text-base">{p.item_name}</Text>
                    <Text className="text-secondaryText text-[10px] uppercase font-bold mt-1">Stock Price: ₹{bill.price_mode === 'Wholesale' ? p.wholesale_price : p.retail_price}</Text>
                  </View>
                  <Feather name="plus" size={20} color="#1f2617"/>
                </Pressable>
              ))}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    );
  }

  // ==========================================
  // VIEW 2: PRISTINE DIGITAL RECEIPT
  // ==========================================
  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="px-6 py-4 flex-row justify-between items-center">
        <Pressable onPress={() => router.back()} className="bg-card p-3 rounded-2xl active:opacity-50">
          <Feather name="arrow-left" size={20} color="#1f2617" />
        </Pressable>
        <Text className="text-primaryText text-xl font-black tracking-wider">RECEIPT</Text>
        <Pressable onPress={startEditing} className="bg-accent/20 p-3 rounded-2xl border border-accent/30 active:opacity-50">
          <Feather name="edit" size={18} color="#1f2617" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 150 }}>
        
        {/* Receipt Ticket UI */}
        <View className="bg-white rounded-[32px] mb-6 shadow-md overflow-hidden border border-card/50 mt-2">
          
          {/* Top Half */}
          <View className="p-6 bg-primaryText">
            <View className="flex-row justify-between items-start mb-6">
              <View>
                <Text className="text-bg/60 text-[10px] font-bold uppercase tracking-widest mb-1">Billed To</Text>
                <Text className="text-accent font-black text-2xl">{bill.customer_id?.name || 'Walk-in'}</Text>
              </View>
              <View className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/20">
                <Text className="text-bg text-[10px] font-black uppercase tracking-widest">{bill.is_estimate ? 'Estimate' : bill.status}</Text>
              </View>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-bg/60 text-[10px] font-bold tracking-widest">{bill.bill_number}</Text>
              <Text className="text-bg/60 text-[10px] font-bold tracking-widest">{dateString}</Text>
            </View>
          </View>

          {/* Middle Half: Items */}
          <View className="p-6 bg-white min-h-[150px]">
            {bill.items.map((item, idx) => (
              <View key={idx} className="flex-row justify-between items-center mb-4">
                <View className="flex-1 pr-4">
                  <Text className="text-primaryText font-bold text-sm" numberOfLines={1}>{item.item_name}</Text>
                  <Text className="text-secondaryText text-[10px] font-bold mt-1">{item.quantity} {item.unit} × ₹{item.sale_price}</Text>
                </View>
                <Text className="text-primaryText font-black">₹{item.quantity * item.sale_price}</Text>
              </View>
            ))}
          </View>

          {/* Dashed Separator */}
          <View className="flex-row items-center overflow-hidden w-full h-4 bg-white relative">
            <View className="w-full border-t-[2px] border-dashed border-card absolute top-1/2" />
            <View className="w-6 h-6 bg-bg rounded-full absolute -left-3 top-[-8px]" />
            <View className="w-6 h-6 bg-bg rounded-full absolute -right-3 top-[-8px]" />
          </View>

          {/* Bottom Half: Totals */}
          <View className="p-6 bg-white">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-secondaryText font-bold text-xs">Subtotal</Text>
              <Text className="text-primaryText font-bold">₹{safeNum(bill.total_amount) - safeNum(bill.extra_fare) + safeNum(bill.discount)}</Text>
            </View>
            {(bill.discount > 0 || bill.extra_fare > 0) && (
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-secondaryText font-bold text-xs opacity-70">Discounts & Fares</Text>
                <Text className="text-primaryText font-bold text-xs">-₹{bill.discount || 0} / +₹{bill.extra_fare || 0}</Text>
              </View>
            )}
            <View className="flex-row justify-between items-center mt-2 pt-4 border-t border-card/40">
              <Text className="text-primaryText font-black text-sm uppercase tracking-widest">Grand Total</Text>
              <Text className="text-primaryText font-black text-2xl">₹{bill.total_amount}</Text>
            </View>
          </View>
        </View>

        {/* Khata & Profit Grid */}
        <View className="flex-row gap-4 mb-8">
          <View className="flex-1 bg-card/30 p-5 rounded-3xl border border-secondary/10">
            <Text className="text-secondaryText text-[10px] uppercase font-bold tracking-widest mb-1">Khata Pending</Text>
            <Text className={`font-black text-xl ${pendingAmount > 0 ? 'text-red-500' : 'text-[#4ade80]'}`}>₹{pendingAmount}</Text>
          </View>
          
          {!bill.is_estimate && (
            <Pressable onPress={() => setPinModalVisible(true)} className="flex-1 bg-primaryText p-5 rounded-3xl items-center justify-center active:opacity-70 shadow-lg">
              <Feather name="lock" size={16} color="#e5fc01" className="mb-1" />
              <Text className="text-accent text-[10px] uppercase font-black tracking-widest text-center mt-1">View Profit</Text>
            </Pressable>
          )}
        </View>
        <View>
            <Pressable 
  onPress={handleShare}
  className="bg-primaryText flex-row items-center justify-center p-5 rounded-3xl mt-6 active:opacity-70"
>
  <Feather name="share-2" size={18} color="#e5fc01" />
  <Text className="text-accent font-black uppercase tracking-widest ml-3">Share on WhatsApp</Text>
</Pressable>
        </View>
        
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View className="absolute bottom-0 left-0 right-0 bg-bg px-6 pt-4 pb-8 border-t border-card/50">
        <Pressable 
          disabled={pendingAmount <= 0}
          onPress={() => setPaymentModalVisible(true)}
          className={`py-5 rounded-2xl items-center flex-row justify-center shadow-lg ${pendingAmount > 0 ? 'bg-primaryText shadow-primaryText/30 active:opacity-70' : 'bg-card opacity-50'}`}
        >
          <MaterialCommunityIcons name="cash-plus" size={20} color={pendingAmount > 0 ? '#e5fc01' : '#bfb5a8'} />
          <Text className={`font-black text-lg uppercase tracking-widest ml-3 ${pendingAmount > 0 ? 'text-accent' : 'text-secondaryText'}`}>
            {pendingAmount > 0 ? 'Add Payment' : 'Fully Paid'}
          </Text>
        </Pressable>
      </View>

      {/* Modals for PIN, Payment, and Profit View remain exactly the same as previously defined to keep functionality intact */}
      <Modal visible={paymentModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-black/80 justify-center px-8">
          <View className="bg-bg p-8 rounded-[40px] shadow-2xl items-center">
            <View className="bg-[#4ade80]/20 w-16 h-16 rounded-full items-center justify-center mb-6">
              <MaterialCommunityIcons name="cash-fast" size={28} color="#4ade80" />
            </View>
            <Text className="text-primaryText text-2xl font-black mb-1">Record Payment</Text>
            <Text className="text-secondaryText font-bold text-xs mb-6">Max pending: ₹{pendingAmount}</Text>
            <TextInput autoFocus keyboardType="numeric" value={paymentInput} onChangeText={setPaymentInput} className="bg-white w-full p-5 rounded-2xl border border-card font-black text-2xl text-center mb-6 shadow-sm" placeholder="0.00" />
            <View className="flex-row gap-3 w-full">
              <Pressable onPress={() => setPaymentModalVisible(false)} className="flex-1 bg-card py-4 rounded-2xl items-center active:opacity-50"><Text className="text-primaryText font-bold">Cancel</Text></Pressable>
              <Pressable onPress={handleUpdatePayment} disabled={isProcessing} className="flex-[1.5] bg-[#4ade80] py-4 rounded-2xl items-center active:opacity-50 shadow-lg"><Text className="text-[#1f2617] font-black uppercase tracking-widest">Save</Text></Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={pinModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-black/80 justify-center px-8">
          <View className="bg-bg p-8 rounded-[40px] shadow-2xl items-center">
            <View className="bg-primaryText/10 w-16 h-16 rounded-full items-center justify-center mb-6"><Feather name="shield" size={28} color="#1f2617" /></View>
            <Text className="text-primaryText text-2xl font-black mb-2">Secure Viewer</Text>
            <Text className="text-secondaryText text-center font-medium text-xs mb-8">Enter your 4-digit PIN.</Text>
            <TextInput autoFocus secureTextEntry keyboardType="numeric" maxLength={4} value={pinInput} onChangeText={setPinInput} className="bg-white w-full p-5 rounded-2xl border border-card font-black text-2xl text-center tracking-[10px] mb-6 shadow-sm" placeholder="••••" />
            <View className="flex-row gap-3 w-full">
              <Pressable onPress={() => { setPinModalVisible(false); setPinInput(''); }} className="flex-1 bg-card py-4 rounded-2xl items-center active:opacity-50"><Text className="text-primaryText font-bold">Cancel</Text></Pressable>
              <Pressable onPress={handleVerifyPin} className="flex-[1.5] bg-primaryText py-4 rounded-2xl items-center active:opacity-50"><Text className="text-accent font-black uppercase tracking-widest">Verify</Text></Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={isProfitVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-bg">
          <View className="px-6 py-4 flex-row justify-between items-center border-b border-card/50 pb-4">
            <View><Text className="text-primaryText text-2xl font-black">Profit Analysis</Text></View>
            <Pressable onPress={() => setIsProfitVisible(false)} className="bg-card p-3 rounded-full active:opacity-50"><Feather name="x" size={20} color="#1f2617" /></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
            <View className="bg-primaryText p-6 rounded-[32px] mb-8 shadow-xl">
               <Text className="text-bg font-bold uppercase tracking-widest text-xs mb-2 opacity-80">Total Est. Profit</Text>
               <Text className="text-[#4ade80] text-4xl font-black mb-4">+ ₹{profitTotals.profit}</Text>
               <View className="flex-row justify-between border-t border-white/10 pt-4">
                 <View><Text className="text-bg text-[10px] uppercase font-bold opacity-60">Total Cost</Text><Text className="text-bg font-bold mt-1">₹{profitTotals.cost}</Text></View>
                 <View className="items-end"><Text className="text-bg text-[10px] uppercase font-bold opacity-60">Total Revenue</Text><Text className="text-bg font-bold mt-1">₹{profitTotals.revenue}</Text></View>
               </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
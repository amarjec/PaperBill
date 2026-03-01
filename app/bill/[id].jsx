import React from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useBillDetail } from '@/src/hooks/useBillDetail';

export default function BillDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const {
    bill, loading, isProcessing, handleDelete,
    paymentModalVisible, setPaymentModalVisible, paymentInput, setPaymentInput, handleUpdatePayment,
    brandModalVisible, setBrandModalVisible, targetBrand, setTargetBrand, handleConvertBrand
  } = useBillDetail(id);

  if (loading || !bill) {
    return (
      <SafeAreaView className="flex-1 bg-bg justify-center items-center">
        <ActivityIndicator size="large" color="#1f2617" />
      </SafeAreaView>
    );
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'Paid': return 'text-[#4ade80] bg-[#4ade80]/10 border-[#4ade80]/20';
      case 'Unpaid': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'Partially Paid': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      default: return 'text-accent bg-accent/10 border-accent/20';
    }
  };

  const dateString = new Date(bill.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const pendingAmount = bill.total_amount - (bill.amount_paid || 0);

  return (
    <SafeAreaView className="flex-1 bg-bg">
      {/* Header */}
      <View className="px-6 py-4 flex-row justify-between items-center">
        <Pressable onPress={() => router.back()} className="bg-card p-3 rounded-2xl active:opacity-50">
          <Feather name="arrow-left" size={20} color="#1f2617" />
        </Pressable>
        <Text className="text-primaryText text-xl font-black">Invoice Details</Text>
        <Pressable onPress={handleDelete} className="bg-red-500/10 p-3 rounded-2xl border border-red-500/20 active:opacity-50">
          <Feather name="trash-2" size={18} color="#ef4444" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 150 }}>
        
        {/* Invoice Summary Card */}
        <View className="bg-white p-6 rounded-[32px] mb-6 border border-card shadow-sm mt-2">
          <View className="flex-row justify-between items-start mb-6">
            <View>
              <Text className="text-primaryText font-black text-2xl">{bill.customer_id?.name || 'Walk-in Customer'}</Text>
              <Text className="text-secondaryText font-bold text-xs mt-1">{bill.customer_id?.phone || 'No phone provided'}</Text>
            </View>
            <View className={`px-3 py-1.5 rounded-lg border ${getStatusColor(bill.status)}`}>
              <Text className={`text-[10px] font-black uppercase tracking-widest ${getStatusColor(bill.status).split(' ')[0]}`}>
                {bill.is_estimate ? 'Estimate' : bill.status}
              </Text>
            </View>
          </View>

          <View className="flex-row justify-between items-center bg-bg p-4 rounded-2xl mb-6 border border-card/50">
            <View>
              <Text className="text-secondaryText text-[10px] uppercase font-bold tracking-widest">Bill No.</Text>
              <Text className="text-primaryText font-black mt-1">{bill.bill_number}</Text>
            </View>
            <View className="items-end">
              <Text className="text-secondaryText text-[10px] uppercase font-bold tracking-widest">Date</Text>
              <Text className="text-primaryText font-black mt-1">{dateString}</Text>
            </View>
          </View>

          {/* Financial Summary */}
          <View className="border-b border-card/50 pb-4 mb-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-secondaryText font-bold text-xs">Total Amount</Text>
              <Text className="text-primaryText font-black text-lg">₹{bill.total_amount}</Text>
            </View>
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-secondaryText font-bold text-xs">Amount Paid</Text>
              <Text className="text-[#4ade80] font-black">₹{bill.amount_paid || 0}</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-secondaryText font-bold text-xs">Pending Due</Text>
              <Text className="text-red-500 font-black">₹{pendingAmount}</Text>
            </View>
          </View>
        </View>

        {/* Itemized List */}
        <Text className="text-secondaryText text-[10px] font-bold uppercase tracking-widest mb-3 ml-2">Purchased Items</Text>
        <View className="bg-card/20 p-5 rounded-[28px] border border-secondary/20 mb-8">
          {bill.items.map((item, idx) => (
            <View key={idx} className={`flex-row justify-between items-center ${idx !== bill.items.length - 1 ? 'border-b border-card pb-3 mb-3' : ''}`}>
              <View className="flex-1 pr-4">
                <Text className="text-primaryText font-black text-sm" numberOfLines={1}>{item.item_name}</Text>
                <View className="flex-row items-center mt-1">
                  <Text className="text-secondaryText text-[10px] font-bold">{item.quantity} {item.unit} × ₹{item.sale_price}</Text>
                  {/* Shows which brand's pricing was applied */}
                  <Text className="text-accent text-[9px] font-black uppercase tracking-widest bg-primaryText px-1.5 py-0.5 rounded ml-2">
                    {item.brand_applied}
                  </Text>
                </View>
              </View>
              <Text className="text-primaryText font-black">₹{item.quantity * item.sale_price}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View className="absolute bottom-0 left-0 right-0 bg-bg px-6 pt-4 pb-8 border-t border-card/50 flex-row gap-3">
        {!bill.is_estimate && (
          <Pressable 
            onPress={() => setBrandModalVisible(true)}
            className="flex-1 bg-card py-4 rounded-2xl items-center border border-secondary/20 active:opacity-50"
          >
            <Feather name="refresh-cw" size={18} color="#1f2617" />
            <Text className="text-primaryText font-black text-[10px] uppercase tracking-widest mt-1">Convert</Text>
          </Pressable>
        )}
        
        <Pressable 
          disabled={pendingAmount <= 0}
          onPress={() => setPaymentModalVisible(true)}
          className={`flex-[2] py-4 rounded-2xl items-center flex-row justify-center shadow-lg ${pendingAmount > 0 ? 'bg-primaryText shadow-primaryText/30 active:opacity-70' : 'bg-card opacity-50'}`}
        >
          <MaterialCommunityIcons name="cash-plus" size={20} color={pendingAmount > 0 ? '#e5fc01' : '#bfb5a8'} />
          <Text className={`font-black uppercase tracking-widest ml-2 ${pendingAmount > 0 ? 'text-accent' : 'text-secondaryText'}`}>
            {pendingAmount > 0 ? 'Add Payment' : 'Fully Paid'}
          </Text>
        </Pressable>
      </View>

      {/* Payment Modal */}
      <Modal visible={paymentModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-black/80 justify-center px-8">
          <View className="bg-bg p-8 rounded-[40px] shadow-2xl items-center">
            <View className="bg-[#4ade80]/20 w-16 h-16 rounded-full items-center justify-center mb-6">
              <MaterialCommunityIcons name="cash-fast" size={28} color="#4ade80" />
            </View>
            <Text className="text-primaryText text-2xl font-black mb-1">Record Payment</Text>
            <Text className="text-secondaryText font-bold text-xs mb-6">Max pending: ₹{pendingAmount}</Text>
            
            <TextInput 
              autoFocus
              keyboardType="numeric"
              value={paymentInput}
              onChangeText={setPaymentInput}
              className="bg-white w-full p-5 rounded-2xl border border-card font-black text-2xl text-center mb-6 shadow-sm"
              placeholder="0.00"
            />
            
            <View className="flex-row gap-3 w-full">
              <Pressable onPress={() => setPaymentModalVisible(false)} className="flex-1 bg-card py-4 rounded-2xl items-center active:opacity-50">
                <Text className="text-primaryText font-bold">Cancel</Text>
              </Pressable>
              <Pressable onPress={handleUpdatePayment} disabled={isProcessing} className="flex-[1.5] bg-[#4ade80] py-4 rounded-2xl items-center active:opacity-50 shadow-lg shadow-green-500/30">
                {isProcessing ? <ActivityIndicator color="#1f2617" /> : <Text className="text-[#1f2617] font-black uppercase tracking-widest">Save</Text>}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Convert Brand Modal */}
      <Modal visible={brandModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-black/80 justify-center px-8">
          <View className="bg-bg p-8 rounded-[40px] shadow-2xl items-center">
            <View className="bg-accent/20 w-16 h-16 rounded-full items-center justify-center mb-6">
              <Feather name="refresh-cw" size={28} color="#1f2617" />
            </View>
            <Text className="text-primaryText text-2xl font-black mb-2 text-center">Convert Brand</Text>
            <Text className="text-secondaryText font-bold text-xs mb-6 text-center">Enter the target brand name to instantly recalculate this entire bill.</Text>
            
            <TextInput 
              autoFocus
              value={targetBrand}
              onChangeText={setTargetBrand}
              className="bg-white w-full p-5 rounded-2xl border border-card font-black text-lg text-center mb-6 shadow-sm"
              placeholder="e.g. Tata"
            />
            
            <View className="flex-row gap-3 w-full">
              <Pressable onPress={() => setBrandModalVisible(false)} className="flex-1 bg-card py-4 rounded-2xl items-center active:opacity-50">
                <Text className="text-primaryText font-bold">Cancel</Text>
              </Pressable>
              <Pressable onPress={handleConvertBrand} disabled={isProcessing} className="flex-[1.5] bg-primaryText py-4 rounded-2xl items-center active:opacity-50 shadow-lg shadow-primaryText/30">
                {isProcessing ? <ActivityIndicator color="#e5fc01" /> : <Text className="text-accent font-black uppercase tracking-widest">Convert</Text>}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
import React from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useKhataDetail } from '@/src/hooks/useKhataDetail';

export default function KhataDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const {
    customer, unpaidBills, allBills, loading, isProcessing, safeNum,
    paymentModalVisible, setPaymentModalVisible, paymentAmount, setPaymentAmount, handleBulkPayment
  } = useKhataDetail(id);

  if (loading || !customer) {
    return (
      <SafeAreaView className="flex-1 bg-bg justify-center items-center">
        <ActivityIndicator size="large" color="#1f2617" />
      </SafeAreaView>
    );
  }

  const totalDebt = safeNum(customer.total_debt);
  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const formatTime = (dateStr) => new Date(dateStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  const transactions = customer.khata_transactions || [];

  const handleShareReminder = async () => {
    try {
      let message = `*Payment Reminder*\n\nHello ${customer.name},\nYour total outstanding balance is *₹${totalDebt}*.\n\n*Pending Bills Breakdown:*\n`;
      unpaidBills.forEach(bill => {
        const pendingOnBill = safeNum(bill.total_amount) - safeNum(bill.amount_paid);
        message += `• ${bill.bill_number} (${formatDate(bill.createdAt)}): ₹${pendingOnBill}\n`;
      });
      message += `\nPlease settle the due amount at your earliest convenience. Thank you!`;

      await Share.share({ message, title: 'Payment Reminder' });
    } catch (error) {
      console.log('Error sharing:', error.message);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Paid': return 'text-[#4ade80] bg-[#4ade80]/10 border-[#4ade80]/20';
      case 'Unpaid': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'Partially Paid': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      default: return 'text-accent bg-accent/10 border-accent/20';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      {/* Header */}
      <View className="px-6 py-4 flex-row justify-between items-center">
        <Pressable onPress={() => router.back()} className="bg-card p-3 rounded-2xl active:opacity-50">
          <Feather name="arrow-left" size={20} color="#1f2617" />
        </Pressable>
        <Text className="text-primaryText text-xl font-black">Customer Ledger</Text>
        <Pressable onPress={handleShareReminder} disabled={totalDebt <= 0} className={`p-3 rounded-2xl active:opacity-50 ${totalDebt > 0 ? 'bg-[#4ade80]/20' : 'bg-card'}`}>
          <Feather name="share-2" size={18} color={totalDebt > 0 ? "#4ade80" : "#bfb5a8"} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>
        
        {/* Customer & Debt Overview Card */}
        <View className="px-6 mt-2 mb-8">
          <View className="bg-white p-6 rounded-[32px] border border-card shadow-sm items-center">
            <View className="bg-primaryText/10 w-16 h-16 rounded-full items-center justify-center mb-4">
              <Feather name="user" size={28} color="#1f2617" />
            </View>
            <Text className="text-primaryText font-black text-2xl mb-1">{customer.name}</Text>
            <Text className="text-secondaryText font-bold text-xs mb-6">{customer.phone || 'No Phone Number'}</Text>
            
            <View className="bg-red-500/10 w-full p-5 rounded-3xl border border-red-500/20 items-center">
              <Text className="text-red-600/80 text-[10px] uppercase font-bold tracking-widest mb-1">Total Outstanding Due</Text>
              <Text className="text-red-500 font-black text-4xl">₹{totalDebt}</Text>
            </View>
            
            {totalDebt > 0 && (
              <Pressable onPress={handleShareReminder} className="mt-4 flex-row items-center bg-[#25D366]/10 px-4 py-2 rounded-xl border border-[#25D366]/20 active:opacity-50">
                <MaterialCommunityIcons name="whatsapp" size={16} color="#25D366" />
                <Text className="text-[#25D366] font-bold text-xs uppercase tracking-widest ml-2">Send WhatsApp Reminder</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Payment Receipt Logs (Money Received) */}
        <View className="px-6 mb-8">
          <Text className="text-secondaryText text-[10px] font-bold uppercase tracking-widest mb-4 ml-2">Recent Payments Received</Text>
          {transactions.length === 0 ? (
            <View className="items-center opacity-50 py-4 border-l-2 border-dashed border-card ml-4">
              <Text className="text-secondaryText font-bold text-xs">No payments recorded yet.</Text>
            </View>
          ) : (
            transactions.slice().reverse().map((txn, idx) => (
              <View key={idx} className="flex-row items-center mb-4">
                <View className="w-10 h-10 bg-[#4ade80]/20 rounded-full items-center justify-center mr-4 z-10">
                  <MaterialCommunityIcons name="cash-plus" size={18} color="#4ade80" />
                </View>
                <View className="flex-1 bg-white p-4 rounded-2xl border border-card shadow-sm flex-row justify-between items-center">
                  <View>
                    <Text className="text-primaryText font-black text-base">₹{txn.amount}</Text>
                    <Text className="text-secondaryText text-[10px] font-bold uppercase tracking-widest mt-1">
                      {formatDate(txn.date)} • {formatTime(txn.date)}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-secondaryText text-[9px] uppercase font-bold tracking-widest mb-0.5">Collected By</Text>
                    <Text className="text-primaryText font-bold text-xs">{txn.received_by || 'Owner'}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* ALL Invoices History */}
        <View className="px-6 mb-8">
          <Text className="text-secondaryText text-[10px] font-bold uppercase tracking-widest mb-4 ml-2">All Invoices History</Text>
          {allBills.length === 0 ? (
            <View className="bg-card/30 p-6 rounded-3xl items-center border border-dashed border-secondary/20">
              <Feather name="file-text" size={24} color="#bfb5a8" className="mb-2" />
              <Text className="text-secondaryText font-bold">No invoices found.</Text>
            </View>
          ) : (
            allBills.map((bill) => {
              const itemsList = bill.items ? bill.items.map(i => i.item_name).join(', ') : 'Unknown Items';
              
              return (
                <Pressable 
                  key={bill._id} 
                  onPress={() => router.push(`/bill/${bill._id}`)}
                  className="bg-card/20 p-5 rounded-3xl mb-3 border border-secondary/20 active:opacity-70"
                >
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                      <Text className="text-primaryText font-black text-base mb-1">{bill.bill_number}</Text>
                      <Text className="text-secondaryText text-[10px] font-bold uppercase tracking-widest">{formatDate(bill.createdAt)}</Text>
                    </View>
                    <View className={`px-2 py-1 rounded border ${getStatusColor(bill.status)}`}>
                      <Text className={`text-[8px] font-black uppercase tracking-widest ${getStatusColor(bill.status).split(' ')[0]}`}>
                        {bill.status}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row justify-between items-end mt-2 pt-3 border-t border-card">
                    <Text className="text-secondaryText font-medium text-[11px] flex-1 pr-4" numberOfLines={1}>Items: {itemsList}</Text>
                    <View className="items-end">
                      <Text className="text-primaryText font-black text-lg">₹{bill.total_amount}</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>

      </ScrollView>

      {/* Sticky Bottom Action */}
      <View className="absolute bottom-0 left-0 right-0 bg-bg px-6 pt-4 pb-8 border-t border-card/50">
        <Pressable 
          disabled={totalDebt <= 0}
          onPress={() => setPaymentModalVisible(true)}
          className={`py-5 rounded-2xl items-center flex-row justify-center shadow-lg ${totalDebt > 0 ? 'bg-primaryText shadow-primaryText/30 active:opacity-70' : 'bg-card opacity-50'}`}
        >
          <MaterialCommunityIcons name="cash-multiple" size={24} color={totalDebt > 0 ? '#e5fc01' : '#bfb5a8'} />
          <Text className={`font-black text-lg uppercase tracking-widest ml-3 ${totalDebt > 0 ? 'text-accent' : 'text-secondaryText'}`}>
            {totalDebt > 0 ? 'Settle Balance' : 'All Clear'}
          </Text>
        </Pressable>
      </View>

      {/* Bulk Payment Modal */}
      <Modal visible={paymentModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-black/80 justify-center px-8">
          <View className="bg-bg p-8 rounded-[40px] shadow-2xl items-center">
            <View className="bg-[#4ade80]/20 w-16 h-16 rounded-full items-center justify-center mb-6">
              <MaterialCommunityIcons name="hand-coin" size={32} color="#4ade80" />
            </View>
            <Text className="text-primaryText text-2xl font-black mb-2 text-center">Receive Payment</Text>
            <Text className="text-secondaryText font-bold text-xs mb-6 text-center">
              Entering a lump sum will automatically clear the oldest pending bills first.
            </Text>
            
            <TextInput 
              autoFocus
              keyboardType="numeric"
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              className="bg-white w-full p-5 rounded-2xl border border-card font-black text-3xl text-center mb-6 shadow-sm text-primaryText"
              placeholder="0.00"
            />
            
            <View className="flex-row gap-3 w-full">
              <Pressable onPress={() => setPaymentModalVisible(false)} className="flex-1 bg-card py-4 rounded-2xl items-center active:opacity-50">
                <Text className="text-primaryText font-bold">Cancel</Text>
              </Pressable>
              <Pressable onPress={handleBulkPayment} disabled={isProcessing} className="flex-[1.5] bg-[#4ade80] py-4 rounded-2xl items-center active:opacity-50 shadow-lg shadow-green-500/30">
                {isProcessing ? <ActivityIndicator color="#1f2617" /> : <Text className="text-[#1f2617] font-black uppercase tracking-widest">Process</Text>}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}
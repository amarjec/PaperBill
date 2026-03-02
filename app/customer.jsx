import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCustomers } from '@/src/hooks/useCustomers';
import { CustomerCard } from '@/src/components/customers/CustomerCard';
import { useApp } from '@/src/context/AppContext';
import PermissionGuard from '@/src/components/PermissionGuard';

export default function CustomerScreen() {
  const router = useRouter();
  const { setSelectedCustomer } = useApp(); // Global Context
  
  const [searchTerm, setSearchTerm] = useState('');
  const { customers, loading, isSubmitting, handleSave } = useCustomers(searchTerm);

  const [formModalVisible, setFormModalVisible] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone_number: '', address: '' });

  // Select Customer & Go to Review
  const proceedToReview = (customer) => {
    setSelectedCustomer(customer); // Save to global state
    router.push('/review'); // Navigate to the final billing page
  };

  const submitNewCustomer = async () => {
    if (!formData.name) return Alert.alert("Required", "Customer name is required.");
    
    const newCustomer = await handleSave(formData);
    if (newCustomer) {
      setFormModalVisible(false);
      proceedToReview(newCustomer); // Auto-select and proceed
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="px-6 py-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="bg-card p-3 rounded-2xl mr-4">
          <Feather name="arrow-left" size={20} color="#1f2617" />
        </TouchableOpacity>
        <View>
          <Text className="text-primaryText text-2xl font-black">Select Customer</Text>
          <Text className="text-secondaryText font-medium text-xs">Who is this bill for?</Text>
        </View>
      </View>

      <View className="px-6 mb-4 mt-2">
        <View className="bg-white flex-row items-center px-4 py-3 rounded-2xl border border-card shadow-sm">
          <Feather name="search" size={20} color="#bfb5a8" />
          <TextInput 
            placeholder="Search name or phone..." 
            placeholderTextColor="#bfb5a8"
            value={searchTerm}
            onChangeText={setSearchTerm}
            className="flex-1 ml-3 text-primaryText font-bold"
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Feather name="x-circle" size={18} color="#bfb5a8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#1f2617" /></View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}>
          
          {/* Quick Action: Walk-in Customer */}
          {!searchTerm && (
            <TouchableOpacity 
              onPress={() => proceedToReview(null)} // Null represents a Walk-in
              className="bg-accent p-5 rounded-[24px] mb-6 flex-row items-center justify-between shadow-sm"
            >
              <View className="flex-row items-center">
                <View className="bg-primaryText w-10 h-10 rounded-full items-center justify-center mr-4">
                  <MaterialCommunityIcons name="walk" size={20} color="#e5fc01" />
                </View>
                <View>
                  <Text className="text-primaryText font-black text-lg">Walk-in Customer</Text>
                  <Text className="text-primaryText/70 text-[10px] font-bold uppercase mt-1">Skip customer details</Text>
                </View>
              </View>
              <Feather name="chevron-right" size={20} color="#1f2617" />
            </TouchableOpacity>
          )}

          {/* Customer List */}
          <Text className="text-secondaryText text-[10px] font-bold uppercase tracking-widest mb-3 ml-2">
            {searchTerm ? 'Search Results' : 'Recent Customers'}
          </Text>

          {customers.length === 0 ? (
            <View className="items-center justify-center mt-10 opacity-40">
              <Feather name="users" size={48} color="#393f35" />
              <Text className="text-primaryText font-bold mt-4">No customers found</Text>
            </View>
          ) : (
            customers.map(c => (
              <CustomerCard 
                key={c._id} 
                customer={c} 
                onPress={() => proceedToReview(c)} 
              />
            ))
          )}
        </ScrollView>
      )}

      {/* Add New Customer FAB */}
      <PermissionGuard module="customers" action="create">
      <TouchableOpacity 
        onPress={() => { setFormData({ name: '', phone_number: '', address: '' }); setFormModalVisible(true); }}
        className="absolute bottom-10 right-6 bg-primaryText w-16 h-16 rounded-full items-center justify-center shadow-lg shadow-primaryText/40 border-4 border-bg"
      >
        <Feather name="user-plus" size={24} color="#e5fc01" />
      </TouchableOpacity>
      </PermissionGuard>

      {/* Form Modal (Create Customer) */}
      <Modal visible={formModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-black/70 justify-end">
          <View className="bg-bg p-8 rounded-t-[40px]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-primaryText text-2xl font-black">New Customer</Text>
              <TouchableOpacity onPress={() => setFormModalVisible(false)} className="bg-card p-2 rounded-full">
                <Feather name="x" size={20} color="#1f2617" />
              </TouchableOpacity>
            </View>

            <ScrollView className="max-h-[60vh]" showsVerticalScrollIndicator={false}>
              <Text className="text-secondaryText text-[10px] font-bold uppercase ml-2 mb-2">Full Name *</Text>
              <TextInput value={formData.name} onChangeText={v => setFormData({...formData, name: v})} className="bg-white p-4 rounded-2xl border border-card font-bold mb-4 shadow-sm" placeholder="e.g. Rahul Kumar" />
              
              <Text className="text-secondaryText text-[10px] font-bold uppercase ml-2 mb-2">Phone Number</Text>
              <TextInput value={formData.phone_number} keyboardType="phone-pad" maxLength={10} onChangeText={v => setFormData({...formData, phone_number: v})} className="bg-white p-4 rounded-2xl border border-card font-bold mb-4 shadow-sm" placeholder="10-digit number" />
              
              <Text className="text-secondaryText text-[10px] font-bold uppercase ml-2 mb-2">Address / Notes</Text>
              <TextInput value={formData.address} onChangeText={v => setFormData({...formData, address: v})} className="bg-white p-4 rounded-2xl border border-card font-bold mb-6 shadow-sm" placeholder="Optional details" multiline />

              <TouchableOpacity onPress={submitNewCustomer} disabled={isSubmitting} className="bg-accent py-5 rounded-[22px] items-center mb-10 shadow-lg flex-row justify-center">
                {isSubmitting ? <ActivityIndicator color="#1f2617" /> : (
                  <>
                    <Text className="text-primaryText font-black text-lg mr-2 uppercase tracking-widest">Save & Proceed</Text>
                    <Feather name="arrow-right-circle" size={20} color="#1f2617" />
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
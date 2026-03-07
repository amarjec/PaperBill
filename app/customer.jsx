import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCustomers } from '@/src/hooks/useCustomers';
import { CustomerCard } from '@/src/components/customers/CustomerCard';
import { useApp } from '@/src/context/AppContext';
import { usePermission } from '@/src/hooks/usePermission';

const Field = ({ label, ...props }) => (
  <View className="mb-4">
    <Text className="text-secondaryText text-[10px] font-black uppercase tracking-widest ml-1 mb-1.5">
      {label}
    </Text>
    <TextInput
      className="bg-bg px-4 py-4 rounded-2xl border border-card text-primaryText font-bold"
      placeholderTextColor="#bfb5a8"
      {...props}
    />
  </View>
);

export default function CustomerScreen() {
  const router = useRouter();
  const { setSelectedCustomer, list } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const { can } = usePermission();

  const {
    customers, loading, isSubmitting,
    handleCreate, handleUpdate, handleDelete,
  } = useCustomers(searchTerm);

  // ── Determine which "mode" we're in ──────────────────────────────────────
  // If the cart has items the user arrived here mid-billing flow → go to review.
  // If the cart is empty the user arrived from the profile/settings page → go to khata.
  const cartItems   = Object.values(list);
  const isBillingMode = cartItems.length > 0;

  // Long-press action modal
  const [selected, setSelected]           = useState(null);
  const [actionVisible, setActionVisible] = useState(false);

  // Create / edit form modal
  const EMPTY = { name: '', phone: '', address: '' };
  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId]     = useState(null);
  const [formData, setFormData]       = useState(EMPTY);
  const f = key => ({
    value: formData[key],
    onChangeText: v => setFormData(p => ({ ...p, [key]: v })),
  });

  const openCreate = () => {
    setEditingId(null);
    setFormData(EMPTY);
    setFormVisible(true);
  };

  const openEdit = () => {
    if (!selected) return;
    setActionVisible(false);
    setEditingId(selected._id);
    setFormData({ name: selected.name || '', phone: selected.phone || '', address: selected.address || '' });
    setFormVisible(true);
  };

  const confirmDelete = () => {
    if (!selected) return;
    setActionVisible(false);
    Alert.alert(
      'Delete Customer',
      `Remove "${selected.name}"? Their Khata history will also be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => handleDelete(selected._id) },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return Alert.alert('Required', 'Name is required.');
    if (editingId) {
      const ok = await handleUpdate(editingId, formData);
      if (ok) setFormVisible(false);
    } else {
      const newCustomer = await handleCreate(formData);
      if (newCustomer) {
        setFormVisible(false);
        if (isBillingMode) {
          // Created a new customer while billing → go straight to review
          setSelectedCustomer(newCustomer);
          router.push('/review');
        } else {
          // Created a new customer from profile → open their (empty) khata
          router.push(`/khata/${newCustomer._id}`);
        }
      }
    }
  };

  // ── Main tap handler — behaviour depends on mode ─────────────────────────
  const handleCustomerPress = (customer) => {
    if (isBillingMode) {
      // Billing flow: attach customer and go to review
      setSelectedCustomer(customer);
      router.push('/review');
    } else {
      if (can ('khata', 'read')) {
        // Profile/ledger flow: open the customer's khata
        router.push(`/khata/${customer._id}`);
      }
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View className="px-6 py-4 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()} className="bg-card p-3 rounded-2xl mr-4">
          <Feather name="arrow-left" size={20} color="#1f2617" />
        </TouchableOpacity>

        <View className="flex-1">
          <Text className="text-primaryText text-2xl font-black">Customers</Text>
          <Text className="text-secondaryText font-medium text-xs">
            {isBillingMode
              ? 'Tap to bill  •  Hold to manage'
              : 'Tap to view ledger  •  Hold to manage'}
          </Text>
        </View>

        {can('customers', 'create') && 
        <TouchableOpacity
          onPress={openCreate}
          activeOpacity={0.85}
          className="bg-primaryText flex-row items-center px-4 py-3 rounded-2xl"
          style={{ shadowColor: '#1f2617', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 }}
        >
          <Feather name="user-plus" size={15} color="#e5fc01" />
          <Text className="text-accent font-black text-[11px] uppercase tracking-widest ml-1.5">New</Text>
        </TouchableOpacity>}
      </View>

      {/* ── Search ─────────────────────────────────────────────────────────── */}
      <View className="px-6 mb-4 mt-2">
        <View
          className="bg-white flex-row items-center px-4 py-3 rounded-2xl border border-card"
          style={{ shadowColor: '#d0c8bc', shadowOpacity: 0.18, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}
        >
          <Feather name="search" size={17} color="#bfb5a8" />
          <TextInput
            placeholder="Search by name or phone..."
            placeholderTextColor="#bfb5a8"
            value={searchTerm}
            onChangeText={setSearchTerm}
            className="flex-1 ml-3 text-primaryText font-bold"
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Feather name="x-circle" size={16} color="#bfb5a8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1f2617" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }}
        >
          {/* Walk-in shortcut — only relevant during billing, hide in ledger mode */}
          {isBillingMode && !searchTerm && (
            <TouchableOpacity
              onPress={() => handleCustomerPress(null)}
              activeOpacity={0.88}
              className="bg-primaryText rounded-[26px] px-5 py-5 mb-5 flex-row items-center justify-between"
              style={{ shadowColor: '#1f2617', shadowOpacity: 0.28, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6 }}
            >
              <View className="flex-row items-center">
                <View className="bg-white/10 border border-white/10 w-12 h-12 rounded-2xl items-center justify-center mr-4">
                  <MaterialCommunityIcons name="walk" size={22} color="#e5fc01" />
                </View>
                <View>
                  <Text className="text-accent font-black text-[17px] tracking-tight">Walk-in Customer</Text>
                  <Text className="text-secondary text-[10px] font-bold uppercase tracking-widest opacity-50 mt-0.5">
                    Skip — proceed without name
                  </Text>
                </View>
              </View>
              <View className="bg-white/10 p-2 rounded-xl">
                <Feather name="arrow-right" size={18} color="#e5fc01" />
              </View>
            </TouchableOpacity>
          )}

          {/* Section label */}
          <Text className="text-secondaryText text-[10px] font-black uppercase tracking-widest mb-3 mx-1">
            {searchTerm ? `Results for "${searchTerm}"` : 'Recent Customers'}
          </Text>

          {customers.length === 0 ? (
            <View className="items-center justify-center mt-16 opacity-40">
              <View className="bg-card w-20 h-20 rounded-full items-center justify-center mb-4">
                <Feather name="users" size={34} color="#393f35" />
              </View>
              <Text className="text-primaryText font-black text-base">No customers yet</Text>
              <Text className="text-secondaryText text-xs mt-1 text-center">
                Tap "New" in the top-right to add one
              </Text>
            </View>
          ) : (
            customers.map(c => (
              <CustomerCard
                key={c._id}
                customer={c}
                onPress={() => handleCustomerPress(c)}
                onLongPress={() => { setSelected(c); setActionVisible(true); }}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* ── Long Press Action Modal ─────────────────────────────────────────── */}
      {(can('customers', 'update') || can('customers', 'delete') || can('khata', 'read')) &&
      <Modal visible={actionVisible} transparent animationType="fade">
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setActionVisible(false)}
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
        >
          <View className="bg-bg rounded-t-[40px] px-6 pt-6 pb-8">
            <View className="w-10 h-1 bg-card rounded-full self-center mb-5" />

            {/* Customer identity pill */}
            <View className="flex-row items-center mb-6 px-1">
              <View className="bg-primaryText w-12 h-12 rounded-2xl items-center justify-center mr-4">
                <Text className="text-accent font-black text-base">
                  {selected?.name?.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?'}
                </Text>
              </View>
              <View>
                <Text className="text-primaryText font-black text-lg">{selected?.name}</Text>
                <Text className="text-secondaryText text-[11px] font-bold">
                  {selected?.phone || 'No phone'}
                </Text>
              </View>
            </View>

            {/* View Khata — only shown in ledger mode since billing mode tapping already goes to review */}
            {!isBillingMode && (can ('khata', 'read')) && (
              <TouchableOpacity
                onPress={() => {
                  setActionVisible(false);
                  router.push(`/khata/${selected._id}`);
                }}
                className="bg-white border border-card rounded-2xl px-5 py-4 flex-row items-center mb-3"
                style={{ elevation: 1 }}
              >
                <View className="bg-card w-9 h-9 rounded-xl items-center justify-center mr-4">
                  <MaterialCommunityIcons name="book-open-outline" size={17} color="#1f2617" />
                </View>
                <View className="flex-1">
                  <Text className="text-primaryText font-black text-[15px]">View Khata</Text>
                  <Text className="text-secondaryText text-[10px] font-bold mt-0.5">Open ledger & payment history</Text>
                </View>
                <Feather name="chevron-right" size={16} color="#bfb5a8" />
              </TouchableOpacity>
            )}

           
            {/* Edit */}
            {can('customers', 'update') &&
            <TouchableOpacity
              onPress={openEdit}
              className="bg-white border border-card rounded-2xl px-5 py-4 flex-row items-center mb-3"
              style={{ elevation: 1 }}
            >
              <View className="bg-card w-9 h-9 rounded-xl items-center justify-center mr-4">
                <Feather name="edit-2" size={17} color="#1f2617" />
              </View>
              <View className="flex-1">
                <Text className="text-primaryText font-black text-[15px]">Edit Details</Text>
                <Text className="text-secondaryText text-[10px] font-bold mt-0.5">Update name, phone or address</Text>
              </View>
              <Feather name="chevron-right" size={16} color="#bfb5a8" />
            </TouchableOpacity> }

            {/* Delete */}
            {can('customers', 'delete') &&
            <TouchableOpacity
              onPress={confirmDelete}
              className="bg-red-50 border border-red-100 rounded-2xl px-5 py-4 flex-row items-center"
            >
              <View className="bg-red-100 w-9 h-9 rounded-xl items-center justify-center mr-4">
                <Feather name="trash-2" size={17} color="#ef4444" />
              </View>
              <View className="flex-1">
                <Text className="text-red-500 font-black text-[15px]">Delete Customer</Text>
                <Text className="text-red-400 text-[10px] font-bold mt-0.5">Also removes Khata history</Text>
              </View>
              <Feather name="chevron-right" size={16} color="#fca5a5" />
            </TouchableOpacity>}

          </View>
        </TouchableOpacity>
      </Modal>}

      {/* ── Create / Edit Form Modal ────────────────────────────────────────── */}
      <Modal visible={formVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        >
          <View className="bg-bg rounded-t-[44px] px-7 pt-7 pb-4">
            <View className="w-10 h-1 bg-card rounded-full self-center mb-6" />

            <View className="flex-row justify-between items-start mb-6">
              <View>
                <Text className="text-primaryText text-2xl font-black tracking-tight">
                  {editingId ? 'Edit Customer' : 'New Customer'}
                </Text>
                <Text className="text-secondaryText text-xs font-bold mt-1">
                  {editingId
                    ? 'Update their details below'
                    : isBillingMode
                      ? 'Saved and billed immediately'
                      : 'Saved — you can view their Khata next'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setFormVisible(false)}
                className="bg-card w-9 h-9 rounded-full items-center justify-center mt-1"
              >
                <Feather name="x" size={17} color="#1f2617" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="max-h-[58vh]">
              <Field label="Full Name *" placeholder="e.g. Rahul Kumar" autoFocus {...f('name')} />
              <Field label="Phone Number" placeholder="10-digit mobile" keyboardType="phone-pad" maxLength={10} {...f('phone')} />
              <Field
                label="Address / Notes"
                placeholder="Village, area, or any note"
                multiline
                numberOfLines={2}
                style={{ textAlignVertical: 'top', minHeight: 70 }}
                {...f('address')}
              />

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.88}
                className={`rounded-[22px] py-5 items-center flex-row justify-center mb-10 mt-2 ${editingId ? 'bg-primaryText' : 'bg-accent'}`}
                style={{ shadowColor: '#1f2617', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 5 }}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={editingId ? '#e5fc01' : '#1f2617'} />
                ) : editingId ? (
                  <>
                    <Feather name="check-circle" size={19} color="#e5fc01" />
                    <Text className="text-accent font-black text-[15px] ml-2 uppercase tracking-widest">Save Changes</Text>
                  </>
                ) : isBillingMode ? (
                  <>
                    <Text className="text-primaryText font-black text-[15px] mr-2 uppercase tracking-widest">Save & Proceed</Text>
                    <Feather name="arrow-right-circle" size={19} color="#1f2617" />
                  </>
                ) : (
                  <>
                    <Text className="text-primaryText font-black text-[15px] mr-2 uppercase tracking-widest">Save & View Khata</Text>
                    <MaterialCommunityIcons name="book-open-outline" size={19} color="#1f2617" />
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
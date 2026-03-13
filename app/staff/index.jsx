import React from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator,
  Modal, TextInput, Switch, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStaff } from '@/src/hooks/useStaff';
import PremiumLock from '@/src/components/PremiumLock';

// ─── Slim Reusable Permission Row ──────────────────────────────────────────────
const PermRow = ({ label, value, onValueChange, disabled = false, isLast = false }) => (
  <View
    className={`flex-row items-center justify-between py-3 ${disabled ? 'opacity-40' : ''} ${!isLast ? 'border-b border-card/40' : ''}`}
  >
    <Text className="text-primaryText font-bold text-[13px]">{label}</Text>
    <Switch
      value={value}
      onValueChange={disabled ? undefined : onValueChange}
      disabled={disabled}
      trackColor={{ false: '#e8e4de', true: '#1f2617' }}
      thumbColor={value ? '#e5fc01' : '#fff'}
      ios_backgroundColor="#e8e4de"
      style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }} // Slimmer switches
    />
  </View>
);

// ─── Minimalist Group Wrapper ──────────────────────────────────────────────────
const PermGroup = ({ title, children }) => (
  <View className="mb-5">
    <Text className="text-secondaryText text-[10px] uppercase font-black tracking-widest mb-1.5 ml-2">
      {title}
    </Text>
    <View className="bg-white rounded-[20px] border border-card/60 px-4 shadow-sm" style={{ shadowColor: '#d8d0c4', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }}>
      {children}
    </View>
  </View>
);

// ─── Staff card on list ────────────────────────────────────────────────────────
const StaffCard = ({ staff, onEdit, onDelete }) => {
  const isActive = staff.status === 'Active';
  return (
    <View className="bg-white rounded-[24px] border border-card mb-3 px-5 py-4">
      <View className="flex-row items-center">
        <View className="w-10 h-10 rounded-full bg-primaryText/[0.05] items-center justify-center mr-3">
          <Text className="text-primaryText font-black text-sm">
            {staff.name?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-primaryText font-black text-[15px]" numberOfLines={1}>
            {staff.name}
          </Text>
          <Text className="text-secondaryText text-xs font-bold mt-0.5">
            {staff.phone_number}
          </Text>
        </View>
        <View
          className={`px-2.5 py-1 rounded-full border ${
            isActive ? 'bg-[#4ade80]/10 border-[#4ade80]/30' : 'bg-red-500/10 border-red-400/30'
          }`}
        >
          <Text
            className={`text-[9px] font-black uppercase tracking-widest ${
              isActive ? 'text-[#4ade80]' : 'text-red-500'
            }`}
          >
            {staff.status}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-2 mt-4 pt-3 border-t border-card/40">
        <Pressable onPress={onDelete} className="flex-1 py-2.5 rounded-xl border border-red-100 bg-red-50 items-center active:opacity-60">
          <Text className="text-red-500 font-bold text-xs">Remove</Text>
        </Pressable>
        <Pressable onPress={onEdit} className="flex-[2] py-2.5 rounded-xl bg-primaryText items-center active:opacity-70">
          <Text className="text-accent font-black text-xs tracking-wide">Edit Permissions</Text>
        </Pressable>
      </View>
    </View>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────
function StaffManagementScreen() {
  const router = useRouter();
  const {
    staffList, loading, isProcessing,
    modalVisible, setModalVisible, isEditing, formData, setFormData,
    openAddModal, openEditModal, handleSubmit, handleDelete,
    toggleManageCategory, toggleManageSubCategory, toggleManageProducts,
    toggleCustomerRead, toggleManageCustomers,
    toggleBillCreate, toggleManageBills,
    toggleKhataRead, toggleManageKhata,
  } = useStaff();

  const p = formData.permissions;

  // Derived helper values
  const categoryManaged    = p.category.create && p.category.update && p.category.delete;
  const subCategoryManaged = p.subCategory.create && p.subCategory.update && p.subCategory.delete;
  const productsManaged    = p.products.create && p.products.update && p.products.delete;
  const customersManaged   = p.customers.create && p.customers.update && p.customers.delete;
  const billsManaged       = p.bills.create && p.bills.update && p.bills.delete;
  const khataManaged       = p.khata.create && p.khata.update && p.khata.delete;

  // ─── LOGIC FIX: Handle Khata + Customer Dependency ───
  const handleKhataReadToggle = (val) => {
    // 1. Trigger the normal khata toggle
    toggleKhataRead(val);
    
    // 2. If turning ON khata, and customers are currently OFF, force customers ON
    if (val && !p.customers.read) {
      // Using setFormData directly to ensure state updates together cleanly
      setFormData((prev) => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          customers: { ...prev.permissions.customers, read: true }
        }
      }));
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      {/* ── Header ── */}
      <View className="px-5 py-4 flex-row items-center justify-between">
        <Pressable onPress={() => router.back()} className="bg-card w-10 h-10 rounded-2xl items-center justify-center active:opacity-50">
          <Feather name="arrow-left" size={18} color="#1f2617" />
        </Pressable>
        <Text className="text-primaryText text-lg font-black">Staff Setup</Text>
        <Pressable onPress={openAddModal} className="bg-primaryText w-10 h-10 rounded-2xl items-center justify-center active:opacity-50">
          <Feather name="plus" size={18} color="#e5fc01" />
        </Pressable>
      </View>

      {/* ── List ── */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#1f2617" style={{ marginTop: 48 }} />
        ) : staffList.length === 0 ? (
          <View className="items-center mt-24 opacity-40">
            <Feather name="users" size={44} color="#393f35" />
            <Text className="text-primaryText font-bold mt-4">No staff added yet</Text>
            <Text className="text-secondaryText text-xs text-center mt-1.5 px-8">
              Add staff to delegate tasks while keeping your data secure.
            </Text>
          </View>
        ) : (
          staffList.map((staff) => (
            <StaffCard key={staff._id} staff={staff} onEdit={() => openEditModal(staff)} onDelete={() => handleDelete(staff._id)} />
          ))
        )}
      </ScrollView>

      {/* ── Add / Edit Modal ── */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-bg pt-4">

          {/* Modal header */}
          <View className="px-5 pb-4 flex-row items-center justify-between">
            <Text className="text-primaryText text-xl font-black">
              {isEditing ? 'Access Control' : 'New Member'}
            </Text>
            <Pressable onPress={() => setModalVisible(false)} className="bg-card w-8 h-8 rounded-full items-center justify-center active:opacity-50">
              <Feather name="x" size={16} color="#1f2617" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">

            {/* ── Basic Info ── */}
            <PermGroup title="Profile">
              <TextInput
                value={formData.name}
                onChangeText={v => setFormData({ ...formData, name: v })}
                placeholder="Full Name"
                placeholderTextColor="#b0a898"
                className="py-3.5 font-bold text-primaryText text-[13px] border-b border-card/40"
              />
              <TextInput
                value={formData.phone_number}
                onChangeText={v => setFormData({ ...formData, phone_number: v })}
                placeholder="Phone Number"
                placeholderTextColor="#b0a898"
                keyboardType="phone-pad"
                className="py-3.5 font-bold text-primaryText text-[13px] border-b border-card/40"
              />
              <TextInput
                value={formData.assigned_pin}
                onChangeText={v => setFormData({ ...formData, assigned_pin: v })}
                placeholder={isEditing ? 'New PIN (Optional)' : '4-Digit Login PIN'}
                placeholderTextColor="#b0a898"
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
                className="py-3.5 font-black text-primaryText text-[13px] tracking-[4px]"
              />
            </PermGroup>

            {/* ── Status ── */}
            <PermGroup title="System">
              <PermRow
                label="Account Active"
                value={formData.status === 'Active'}
                onValueChange={val => setFormData({ ...formData, status: val ? 'Active' : 'Suspended' })}
                isLast
              />
            </PermGroup>

            {/* ── Grouped Permissions ── */}
            {/* Billing Group */}
            <PermGroup title="Billing & Sales">
              <PermRow label="Create Bills" value={p.bills.create} onValueChange={toggleBillCreate} />
              <PermRow label="Manage Bills" value={billsManaged} onValueChange={toggleManageBills} isLast />
            </PermGroup>

            {/* Ledger & Clients Group */}
            <PermGroup title="Clients & Ledger">
              <PermRow label="View Customers" value={p.customers.read} onValueChange={toggleCustomerRead} />
              <PermRow label="Manage Customers" value={customersManaged} onValueChange={toggleManageCustomers} disabled={!p.customers.read} />
              <PermRow label="View Ledger (Khata)" value={p.khata.read} onValueChange={handleKhataReadToggle} />
              <PermRow label="Manage Ledger (Khata)" value={khataManaged} onValueChange={toggleManageKhata} disabled={!p.khata.read} isLast />
            </PermGroup>

            {/* Inventory Group */}
            <PermGroup title="Inventory">
              <PermRow label="Manage Categories" value={categoryManaged} onValueChange={toggleManageCategory} />
              <PermRow label="Manage Sub-Categories" value={subCategoryManaged} onValueChange={toggleManageSubCategory} />
              <PermRow label="Manage Products" value={productsManaged} onValueChange={toggleManageProducts} isLast />
            </PermGroup>

          </ScrollView>

          {/* ── Save button ── */}
          <View className="px-5 pb-8 pt-4 bg-white border-t border-card/40 shadow-xl">
            <Pressable
              onPress={handleSubmit}
              disabled={isProcessing}
              className="bg-primaryText py-4 rounded-2xl items-center active:opacity-70"
            >
              {isProcessing ? (
                <ActivityIndicator color="#e5fc01" />
              ) : (
                <Text className="text-accent font-black text-[13px] uppercase tracking-widest">
                  {isEditing ? 'Update Access' : 'Create Staff Member'}
                </Text>
              )}
            </Pressable>
          </View>

        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default function StaffManagement() {
  return (
    <PremiumLock
      featureName="Staff Management"
      description="Add Staff with limited permission to delegate your work securely."
      icon="delete-empty"
    >
      <StaffManagementScreen />
    </PremiumLock>
  );
}
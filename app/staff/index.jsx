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

// ─── Reusable permission row ───────────────────────────────────────────────────
const PermRow = ({ label, description, value, onValueChange, disabled = false }) => (
  <View
    className={`flex-row items-center justify-between py-3 ${disabled ? 'opacity-40' : ''}`}
  >
    <View className="flex-1 pr-4">
      <Text className="text-primaryText font-bold text-sm">{label}</Text>
      {description ? (
        <Text className="text-secondaryText text-[11px] mt-0.5">{description}</Text>
      ) : null}
    </View>
    <Switch
      value={value}
      onValueChange={disabled ? undefined : onValueChange}
      disabled={disabled}
      trackColor={{ false: '#e8e4de', true: '#1f2617' }}
      thumbColor={value ? '#e5fc01' : '#fff'}
      ios_backgroundColor="#e8e4de"
    />
  </View>
);

// ─── Section wrapper ───────────────────────────────────────────────────────────
const PermSection = ({ icon, title, children }) => (
  <View className="bg-white rounded-[20px] border border-card mb-3 overflow-hidden">
    {/* Section header */}
    <View className="flex-row items-center gap-2.5 px-4 pt-4 pb-3 border-b border-card/60">
      <View className="w-7 h-7 rounded-lg bg-primaryText/[0.07] items-center justify-center">
        <Text style={{ fontSize: 14 }}>{icon}</Text>
      </View>
      <Text className="text-primaryText font-black text-sm tracking-tight">{title}</Text>
    </View>
    <View className="px-4 pb-1">{children}</View>
  </View>
);

// ─── Thin divider ─────────────────────────────────────────────────────────────
const Divider = () => <View className="h-px bg-card/60" />;

// ─── Staff card on list ────────────────────────────────────────────────────────
const StaffCard = ({ staff, onEdit, onDelete }) => {
  const isActive = staff.status === 'Active';
  return (
    <View className="bg-white rounded-[24px] border border-card mb-3 px-5 py-4">
      <View className="flex-row items-center">
        {/* Avatar */}
        <View className="w-11 h-11 rounded-full bg-primaryText/[0.07] items-center justify-center mr-3">
          <Text className="text-primaryText font-black text-base">
            {staff.name?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
        {/* Info */}
        <View className="flex-1">
          <Text className="text-primaryText font-black text-[15px]" numberOfLines={1}>
            {staff.name}
          </Text>
          <Text className="text-secondaryText text-xs font-bold mt-0.5">
            {staff.phone_number}
          </Text>
        </View>
        {/* Status pill */}
        <View
          className={`px-2.5 py-1 rounded-full border ${
            isActive
              ? 'bg-[#4ade80]/10 border-[#4ade80]/30'
              : 'bg-red-500/10 border-red-400/30'
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

      {/* Actions */}
      <View className="flex-row gap-2 mt-4 pt-3 border-t border-card/50">
        <Pressable
          onPress={onDelete}
          className="flex-1 py-2.5 rounded-xl border border-red-100 bg-red-50 items-center active:opacity-60"
        >
          <Text className="text-red-500 font-bold text-xs">Remove</Text>
        </Pressable>
        <Pressable
          onPress={onEdit}
          className="flex-[2] py-2.5 rounded-xl bg-primaryText items-center active:opacity-70"
        >
          <Text className="text-accent font-black text-xs tracking-wide">Edit Details</Text>
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
  const billsManaged       = p.bills.update && p.bills.delete;
  const khataManaged       = p.khata.update;

  return (
    <SafeAreaView className="flex-1 bg-bg">
      {/* ── Header ── */}
      <View className="px-5 py-4 flex-row items-center justify-between">
        <Pressable onPress={() => router.back()} className="bg-card w-10 h-10 rounded-2xl items-center justify-center active:opacity-50">
          <Feather name="arrow-left" size={18} color="#1f2617" />
        </Pressable>
        <Text className="text-primaryText text-lg font-black">Staff Management</Text>
        <Pressable onPress={openAddModal} className="bg-primaryText w-10 h-10 rounded-2xl items-center justify-center active:opacity-50">
          <Feather name="plus" size={18} color="#e5fc01" />
        </Pressable>
      </View>

      {/* ── List ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
      >
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
            <StaffCard
              key={staff._id}
              staff={staff}
              onEdit={() => openEditModal(staff)}
              onDelete={() => handleDelete(staff._id)}
            />
          ))
        )}
      </ScrollView>

      {/* ── Add / Edit Modal ── */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-bg">

          {/* Modal header */}
          <View className="px-5 pt-2 pb-4 flex-row items-center justify-between border-b border-card/50">
            <Text className="text-primaryText text-xl font-black">
              {isEditing ? 'Edit Staff' : 'New Staff'}
            </Text>
            <Pressable
              onPress={() => setModalVisible(false)}
              className="bg-card w-9 h-9 rounded-full items-center justify-center active:opacity-50"
            >
              <Feather name="x" size={17} color="#1f2617" />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          >

            {/* ── Basic Info ── */}
            <Text className="text-secondaryText text-[10px] uppercase font-bold tracking-widest mb-2 ml-1">
              Basic Info
            </Text>
            <View className="bg-white rounded-[20px] border border-card mb-5 overflow-hidden">
              <TextInput
                value={formData.name}
                onChangeText={v => setFormData({ ...formData, name: v })}
                placeholder="Full Name"
                placeholderTextColor="#b0a898"
                className="px-4 py-4 font-bold text-primaryText text-sm border-b border-card/60"
              />
              <TextInput
                value={formData.phone_number}
                onChangeText={v => setFormData({ ...formData, phone_number: v })}
                placeholder="Phone Number"
                placeholderTextColor="#b0a898"
                keyboardType="phone-pad"
                className="px-4 py-4 font-bold text-primaryText text-sm border-b border-card/60"
              />
              <TextInput
                value={formData.assigned_pin}
                onChangeText={v => setFormData({ ...formData, assigned_pin: v })}
                placeholder={isEditing ? 'New PIN (leave blank to keep)' : '4-Digit PIN'}
                placeholderTextColor="#b0a898"
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
                className="px-4 py-4 font-black text-primaryText text-sm text-center tracking-[8px]"
              />
            </View>

            {/* ── Account Status ── */}
            <View className="bg-white rounded-[20px] border border-card px-4 mb-6">
              <PermRow
                label="Account Active"
                description="Suspended staff cannot log in."
                value={formData.status === 'Active'}
                onValueChange={val =>
                  setFormData({ ...formData, status: val ? 'Active' : 'Suspended' })
                }
              />
            </View>

            {/* ── Permissions ── */}
            <Text className="text-secondaryText text-[10px] uppercase font-bold tracking-widest mb-3 ml-1">
              Permissions
            </Text>

            {/* Inventory */}
            <PermSection icon="🏷️" title="Category">
              <PermRow
                label="Manage Categories"
                description="Add, edit and delete categories"
                value={categoryManaged}
                onValueChange={toggleManageCategory}
              />
            </PermSection>

            <PermSection icon="📂" title="Sub-Category">
              <PermRow
                label="Manage Sub-Categories"
                description="Add, edit and delete sub-categories"
                value={subCategoryManaged}
                onValueChange={toggleManageSubCategory}
              />
            </PermSection>

            <PermSection icon="📦" title="Products">
              <PermRow
                label="Manage Products"
                description="Add, edit and delete products"
                value={productsManaged}
                onValueChange={toggleManageProducts}
              />
            </PermSection>

            {/* Customers */}
            <PermSection icon="👤" title="Customers">
              <PermRow
                label="View Customers"
                description="Browse and search the customer list"
                value={p.customers.read}
                onValueChange={toggleCustomerRead}
              />
              <Divider />
              <PermRow
                label="Manage Customers"
                description="Add, edit and delete customers"
                value={customersManaged}
                onValueChange={toggleManageCustomers}
                disabled={!p.customers.read}
              />
            </PermSection>

            {/* Bills */}
            <PermSection icon="🧾" title="Bills">
              <PermRow
                label="Create Bill"
                description="Generate new invoices"
                value={p.bills.create}
                onValueChange={toggleBillCreate}
              />
              <Divider />
              <PermRow
                label="Manage Bills"
                description="Edit and delete existing bills"
                value={billsManaged}
                onValueChange={toggleManageBills}
              />
            </PermSection>

            {/* Khata */}
            <PermSection icon="📒" title="Khata">
              <PermRow
                label="View Khata"
                description="See customer ledger and balances"
                value={p.khata.read}
                onValueChange={toggleKhataRead}
              />
              <Divider />
              <PermRow
                label="Manage Khata"
                description="Record and settle payments"
                value={khataManaged}
                onValueChange={toggleManageKhata}
                disabled={!p.khata.read}
              />
            </PermSection>

          </ScrollView>

          {/* ── Save button ── */}
          <View className="px-5 pb-6 pt-3 border-t border-card/50 bg-bg">
            <Pressable
              onPress={handleSubmit}
              disabled={isProcessing}
              className="bg-primaryText py-[18px] rounded-2xl items-center active:opacity-70"
            >
              {isProcessing ? (
                <ActivityIndicator color="#e5fc01" />
              ) : (
                <Text className="text-accent font-black text-sm uppercase tracking-widest">
                  {isEditing ? 'Save Changes' : 'Add Staff Member'}
                </Text>
              )}
            </Pressable>
          </View>

        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

export default function StaffManagement() {
  return (
    <PremiumLock
    featureName="Staff Management"
    description="Add Staff with limited permission to delegate your work"
    icon="delete-empty"
    >
      <StaffManagementScreen />
    </PremiumLock>
  );
}
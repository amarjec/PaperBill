import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, Alert, KeyboardAvoidingView,
  Platform, Vibration
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSubCategories } from '@/src/hooks/useSubCategories';
import { SubCategoryCard } from '@/src/components/inventory/SubCategoryCard';
import { useApp } from '@/src/context/AppContext';

export default function SubCategoryScreen() {
  const { id: categoryId } = useLocalSearchParams();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const { subCategories, loading, isSubmitting, handleSave, handleDelete } = useSubCategories(categoryId, searchTerm);

  // ── Cart ──────────────────────────────────────────────────────────────────
  const { list, setList } = useApp();
  const cartItems  = Object.values(list);
  const totalQty   = cartItems.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.qty * (item.retail_price || 0)), 0);

  // Which subcategory IDs currently have items in the cart?
  const subIdsWithItems = new Set(
    cartItems.map(item => String(item.subcategory_id))
  );

  const handleClearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Remove all items from the cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => setList({}),
        },
      ]
    );
  };

  // ── Modal states ──────────────────────────────────────────────────────────
  const [selectedSub, setSelectedSub]         = useState(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [formModalVisible, setFormModalVisible]     = useState(false);
  const [subName, setSubName]                       = useState('');

  const handleLongPress = (sub) => {
    Vibration.vibrate(50);
    setSelectedSub(sub);
    setActionModalVisible(true);
  };

  const openCreateModal = () => {
    setSelectedSub(null);
    setSubName('');
    setFormModalVisible(true);
  };

  const openEditModal = () => {
    setActionModalVisible(false);
    setSubName(selectedSub?.name || '');
    setFormModalVisible(true);
  };

  const confirmDelete = () => {
    setActionModalVisible(false);
    Alert.alert(
      'Delete Group',
      `Are you sure you want to delete "${selectedSub?.name || 'this group'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => handleDelete(selectedSub?._id) },
      ]
    );
  };

  const submitForm = async () => {
    if (!subName.trim()) return Alert.alert('Error', 'Name is required');
    const success = await handleSave(subName, selectedSub?._id);
    if (success) {
      setFormModalVisible(false);
      setSelectedSub(null);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <View className="px-6 py-4 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity onPress={() => router.back()} className="bg-card p-3 rounded-2xl mr-4">
            <Feather name="arrow-left" size={20} color="#1f2617" />
          </TouchableOpacity>
          <View>
            <Text className="text-primaryText text-2xl font-black">Item Groups</Text>
            <Text className="text-secondaryText font-medium text-xs">Select or Manage</Text>
          </View>
        </View>

        {/* Clear cart button — only visible when cart has items */}
        {totalQty > 0 && (
          <TouchableOpacity
            onPress={handleClearCart}
            activeOpacity={0.7}
            className="flex-row items-center bg-red-50 border border-red-200 px-3 py-2 rounded-2xl"
          >
            <Feather name="trash-2" size={14} color="#ef4444" />
            <Text className="text-red-500 font-black text-[11px] uppercase tracking-widest ml-1.5">
              Clear
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Search Bar ───────────────────────────────────────────────────── */}
      <View className="px-6 mb-4 mt-2">
        <View className="bg-white flex-row items-center px-4 py-3 rounded-2xl border border-card shadow-sm">
          <Feather name="search" size={20} color="#bfb5a8" />
          <TextInput
            placeholder="Search sub-categories..."
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

      {/* ── Content ──────────────────────────────────────────────────────── */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#1f2617" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 150 }}
        >
          {/* "All Products" shortcut — full width, only when not searching */}
          {!searchTerm && (
            <TouchableOpacity
              onPress={() => router.push('/products/all')}
              className="bg-primaryText p-6 rounded-[32px] mb-6 flex-row items-center justify-between shadow-xl"
            >
              <View className="flex-row items-center">
                <View className="bg-white/10 p-3 rounded-2xl mr-4 border border-white/10">
                  <MaterialCommunityIcons name="layers-triple" size={24} color="#e5fc01" />
                </View>
                <View>
                  <Text className="text-bg font-black text-lg">All Products</Text>
                  <Text className="text-secondary text-[10px] font-bold uppercase tracking-widest mt-1 opacity-70">
                    View Full Inventory
                  </Text>
                </View>
              </View>
              <Feather name="chevron-right" size={24} color="#e5fc01" />
            </TouchableOpacity>
          )}

          {subCategories.length === 0 ? (
            <View className="items-center justify-center mt-10 opacity-30">
              <Feather name="folder" size={48} color="#393f35" />
              <Text className="text-primaryText font-bold mt-4">No groups found</Text>
            </View>
          ) : (
            /* ── 2-column grid (mirrors CategoryCard layout on Home) ── */
            <View className="flex-row flex-wrap justify-between">
              {subCategories.map(sub => (
                <SubCategoryCard
                  key={sub._id}
                  subCategory={sub}
                  hasItems={subIdsWithItems.has(String(sub._id))}
                  onPress={() => router.push(`/products/${sub._id}`)}
                  onLongPress={() => handleLongPress(sub)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* ── FAB — moves up when checkout bar is visible ───────────────────── */}
      <TouchableOpacity
        onPress={openCreateModal}
        className={`absolute right-6 bg-accent w-16 h-16 rounded-[22px] items-center justify-center shadow-lg border-accent/40 border z-40 ${totalQty > 0 ? 'bottom-32' : 'bottom-10'}`}
      >
        <Feather name="plus" size={28} color="#1f2617" />
      </TouchableOpacity>

      {/* ── Sticky Checkout Bar ───────────────────────────────────────────── */}
      {totalQty > 0 && (
        <View className="absolute bottom-6 left-6 right-6 z-50">
          <TouchableOpacity
            onPress={() => router.push('/customer')}
            activeOpacity={0.9}
            className="bg-primaryText p-5 rounded-[24px] flex-row items-center justify-between shadow-2xl shadow-primaryText/50"
          >
            <View className="flex-row items-center">
              <View className="bg-accent w-12 h-12 rounded-full items-center justify-center mr-4">
                <Text className="text-primaryText font-black text-xl">{totalQty}</Text>
              </View>
              <View>
                <Text className="text-bg font-black text-sm">Items Added</Text>
                <Text className="text-secondary text-[11px] font-bold uppercase mt-1 opacity-80">
                  Total: ₹{totalPrice}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center bg-white/10 px-4 py-3 rounded-2xl">
              <Text className="text-accent font-black text-sm mr-2 tracking-widest">NEXT</Text>
              <Feather name="arrow-right" size={20} color="#e5fc01" />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Action Modal (Long Press) ─────────────────────────────────────── */}
      <Modal visible={actionModalVisible} transparent animationType="fade">
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setActionModalVisible(false)}
          className="flex-1 bg-black/60 justify-end"
        >
          <View className="bg-bg p-6 rounded-t-[40px]">
            <Text className="text-secondaryText text-sm font-bold uppercase tracking-widest text-center mb-6">
              Manage "{selectedSub?.name || ''}"
            </Text>

            <TouchableOpacity
              onPress={openEditModal}
              className="bg-white p-5 rounded-2xl flex-row items-center mb-3 shadow-sm border border-card"
            >
              <Feather name="edit-2" size={20} color="#1f2617" />
              <Text className="text-primaryText font-black text-lg ml-4">Rename Group</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={confirmDelete}
              className="bg-red-50 p-5 rounded-2xl flex-row items-center mb-6 shadow-sm border border-red-100"
            >
              <Feather name="trash-2" size={20} color="#ef4444" />
              <Text className="text-red-600 font-black text-lg ml-4">Delete Group</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Form Modal (Create / Edit) ────────────────────────────────────── */}
      <Modal visible={formModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 bg-black/70 justify-end"
        >
          <View className="bg-bg p-8 rounded-t-[40px]">
            <View className="flex-row justify-between items-center mb-8">
              <Text className="text-primaryText text-2xl font-black">
                {selectedSub ? 'Rename Group' : 'New Item Group'}
              </Text>
              <TouchableOpacity
                onPress={() => setFormModalVisible(false)}
                className="bg-card p-2 rounded-full"
              >
                <Feather name="x" size={20} color="#1f2617" />
              </TouchableOpacity>
            </View>

            <View className="mb-8">
              <Text className="text-secondaryText text-[10px] font-bold uppercase ml-4 mb-2">
                Group Name
              </Text>
              <TextInput
                autoFocus
                value={subName}
                onChangeText={setSubName}
                placeholder="e.g. Cables & Wires"
                placeholderTextColor="#bfb5a8"
                className="bg-white p-5 rounded-2xl border border-card text-primaryText font-bold text-base shadow-sm"
              />
            </View>

            <TouchableOpacity
              onPress={submitForm}
              disabled={isSubmitting}
              className="bg-primaryText py-5 rounded-[22px] flex-row justify-center items-center shadow-lg"
            >
              {isSubmitting ? (
                <ActivityIndicator color="#e5fc01" />
              ) : (
                <Text className="text-accent font-black text-lg tracking-widest uppercase">Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}
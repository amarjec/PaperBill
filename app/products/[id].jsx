import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, Alert, KeyboardAvoidingView,
  Platform, Vibration
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useProducts } from '@/src/hooks/useProducts';
import { ProductCard } from '@/src/components/inventory/ProductCard';
import { useApp } from '@/src/context/AppContext';
import { usePermission } from '../../src/hooks/usePermission';

export default function ProductScreen() {
  const { id: subId } = useLocalSearchParams();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const { products, cart, updateQuantity, loading, isSubmitting, handleSave, handleDelete } =
    useProducts(subId, searchTerm);

  // ── Cart calculations (this page only) ───────────────────────────────────
  const { setList } = useApp();
  const { can } = usePermission();

  const pageCartItems = Object.values(cart).filter(item =>
    subId === 'all' ? true : String(item.subcategory_id) === String(subId)
  );
  const pageQty   = pageCartItems.reduce((sum, item) => sum + item.qty, 0);
  const pagePrice = pageCartItems.reduce((sum, item) => sum + (item.qty * (item.retail_price || 0)), 0);

  // Clears only the items belonging to this subcategory page
  const handleClearPage = () => {
    Alert.alert(
      'Clear This Page',
      'Remove all items added from this category?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setList(prev => {
              const updated = { ...prev };
              pageCartItems.forEach(item => delete updated[item._id]);
              return updated;
            });
          },
        },
      ]
    );
  };

  // Direct quantity set (from keyboard input on ProductCard)
  const setQuantity = (product, qty) => {
    setList(prev => {
      const updated = { ...prev };
      if (qty <= 0) {
        delete updated[product._id];
      } else {
        updated[product._id] = { ...product, qty };
      }
      return updated;
    });
  };

  // ── Modal states ──────────────────────────────────────────────────────────
  const [selectedProd, setSelectedProd]             = useState(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [formModalVisible, setFormModalVisible]     = useState(false);
  const [formData, setFormData] = useState({
    item_name: '', retail_price: '', wholesale_price: '', purchase_price: '', unit: 'pcs',
  });

  const handleLongPress = (prod) => {
    Vibration.vibrate(50);
    setSelectedProd(prod);
    setActionModalVisible(true);
  };

  const openCreateModal = () => {
    setSelectedProd(null);
    setFormData({ item_name: '', retail_price: '', wholesale_price: '', purchase_price: '', unit: 'pcs' });
    setFormModalVisible(true);
  };

  const openEditModal = () => {
    setActionModalVisible(false);
    setFormData({
      item_name:      selectedProd?.item_name      || '',
      retail_price:   String(selectedProd?.retail_price   || ''),
      wholesale_price:String(selectedProd?.wholesale_price|| ''),
      purchase_price: String(selectedProd?.purchase_price || ''),
      unit:           selectedProd?.unit           || 'pcs',
    });
    setFormModalVisible(true);
  };

  const confirmDelete = () => {
    setActionModalVisible(false);
    Alert.alert(
      'Delete Product',
      `Delete "${selectedProd?.item_name || ''}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => handleDelete(selectedProd?._id) },
      ]
    );
  };

  const submitForm = async () => {
    if (!formData.item_name || !formData.retail_price) {
      return Alert.alert('Error', 'Item Name and Retail Price are required');
    }
    const success = await handleSave(
      {
        ...formData,
        retail_price:    Number(formData.retail_price),
        wholesale_price: Number(formData.wholesale_price || 0),
        purchase_price:  Number(formData.purchase_price  || 0),
      },
      selectedProd?._id
    );
    if (success) {
      setFormModalVisible(false);
      setSelectedProd(null);
    }
  };

  // ── Total items in cart across ALL pages (for global checkout bar label) ──
  const allCartItems = Object.values(cart);
  const totalQty     = allCartItems.reduce((s, i) => s + i.qty, 0);

  return (
    <SafeAreaView className="flex-1 bg-bg">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <View className="px-4 py-3 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="bg-card p-3 rounded-2xl mr-3">
          <Feather name="arrow-left" size={20} color="#1f2617" />
        </TouchableOpacity>

        <View className="flex-1">
          <Text className="text-primaryText text-xl font-black">
            {subId === 'all' ? 'All Inventory' : 'Products'}
          </Text>
          <Text className="text-secondaryText font-medium text-[11px]">
            {products.length} items
          </Text>
        </View>

        {/* Clear page button */}
        {pageQty > 0 && (
          <TouchableOpacity
            onPress={handleClearPage}
            activeOpacity={0.7}
            className="flex-row items-center bg-red-50 border border-red-200 px-3 py-2 rounded-2xl mr-2"
          >
            <Feather name="trash-2" size={13} color="#ef4444" />
            <Text className="text-red-500 font-black text-[11px] uppercase tracking-widest ml-1">
              Clear
            </Text>
          </TouchableOpacity>
        )}

        {/* Add new product button */}
        {subId !== 'all' && can('products', 'create') && (
          <TouchableOpacity
            onPress={openCreateModal}
            className="bg-primaryText p-3 rounded-2xl"
          >
            <Feather name="plus" size={20} color="#e5fc01" />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Search Bar ───────────────────────────────────────────────────── */}
      <View className="px-4 mb-4 mt-2">
        <View className="bg-white flex-row items-center px-4 py-2.5 rounded-2xl border border-card shadow-sm">
          <Feather name="search" size={18} color="#bfb5a8" />
          <TextInput
            placeholder="Search items..."
            placeholderTextColor="#bfb5a8"
            value={searchTerm}
            onChangeText={setSearchTerm}
            className="flex-1 ml-3 text-primaryText font-bold text-sm"
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Feather name="x-circle" size={16} color="#bfb5a8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Product List ─────────────────────────────────────────────────── */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#1f2617" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 160 }}
        >
          {products.length === 0 ? (
            <View className="items-center justify-center mt-16 opacity-30">
              <Feather name="box" size={40} color="#393f35" />
              <Text className="text-primaryText font-bold mt-3 text-sm">No products found</Text>
            </View>
          ) : (
            products.map(p => (
              <ProductCard
                key={p._id}
                product={p}
                quantity={cart[p._id]?.qty || 0}
                onAdd={()    => updateQuantity(p,  1)}
                onRemove={()  => updateQuantity(p, -1)}
                onQuantityChange={(qty) => setQuantity(p, qty)}
                onLongPress={() => handleLongPress(p)}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* ── "Done Adding" sticky bar ─────────────────────────────────────── */}
      {pageQty > 0 && (
        <View className="absolute bottom-6 left-4 right-4 z-50">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.9}
            className="bg-accent p-4 rounded-[20px] flex-row items-center justify-between shadow-2xl shadow-accent/40"
          >
            <View className="flex-row items-center">
              {/* Badge */}
              <View className="bg-primaryText w-10 h-10 rounded-full items-center justify-center mr-3">
                <Text className="text-accent font-black text-base">{pageQty}</Text>
              </View>
              <View>
                <Text className="text-primaryText font-black text-sm">Added from here</Text>
                <Text className="text-primaryText text-[11px] font-bold uppercase mt-0.5 opacity-70">
                  Page Total: ₹{pagePrice}
                </Text>
              </View>
            </View>

            {/* Global cart count pill */}
            <View className="flex-row items-center bg-primaryText/10 px-3 py-2 rounded-xl">
              {totalQty > pageQty && (
                <Text className="text-primaryText font-bold text-[11px] mr-2 opacity-60">
                  +{totalQty - pageQty} other
                </Text>
              )}
              <Text className="text-primaryText font-black text-sm mr-1.5 tracking-widest">DONE</Text>
              <Feather name="check-circle" size={18} color="#1f2617" />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Action Modal (Long Press) ─────────────────────────────────────── */}
      {(can ('products', 'update') || can('products', 'delete') )&&
      <Modal visible={actionModalVisible} transparent animationType="fade">
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setActionModalVisible(false)}
          className="flex-1 bg-black/60 justify-end"
        >
          <View className="bg-bg p-6 rounded-t-[40px]">
            <Text className="text-secondaryText text-sm font-bold uppercase tracking-widest text-center mb-6">
              "{selectedProd?.item_name || ''}"
            </Text>

            {can('products', 'update') &&
            <TouchableOpacity
              onPress={openEditModal}
              className="bg-white p-5 rounded-2xl flex-row items-center mb-3 border border-card shadow-sm"
            >
              <Feather name="edit-2" size={20} color="#1f2617" />
              <Text className="text-primaryText font-black text-lg ml-4">Edit Product</Text>
            </TouchableOpacity>}

            {can('products', 'delete') &&
            <TouchableOpacity
              onPress={confirmDelete}
              className="bg-red-50 p-5 rounded-2xl flex-row items-center mb-6 border border-red-100 shadow-sm"
            >
              <Feather name="trash-2" size={20} color="#ef4444" />
              <Text className="text-red-600 font-black text-lg ml-4">Delete Product</Text>
            </TouchableOpacity>}
          </View>
        </TouchableOpacity>
      </Modal>}

      {/* ── Form Modal (Create / Edit) ────────────────────────────────────── */}
      <Modal visible={formModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 bg-black/70 justify-end"
        >
          <View className="bg-bg p-8 rounded-t-[40px]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-primaryText text-2xl font-black">
                {selectedProd ? 'Edit Product' : 'New Product'}
              </Text>
              <TouchableOpacity onPress={() => setFormModalVisible(false)} className="bg-card p-2 rounded-full">
                <Feather name="x" size={20} color="#1f2617" />
              </TouchableOpacity>
            </View>

            <ScrollView className="max-h-[60vh]" showsVerticalScrollIndicator={false}>
              <Text className="text-secondaryText text-[10px] font-bold uppercase ml-2 mb-2">Item Name</Text>
              <TextInput
                value={formData.item_name}
                onChangeText={v => setFormData({ ...formData, item_name: v })}
                className="bg-white p-4 rounded-2xl border border-card font-bold mb-4 shadow-sm"
                placeholder="e.g. 10mm Steel Rod"
              />

              <View className="flex-row gap-4 mb-4">
                <View className="flex-1">
                  <Text className="text-secondaryText text-[10px] font-bold uppercase ml-2 mb-2">Retail Price</Text>
                  <TextInput
                    value={formData.retail_price}
                    keyboardType="numeric"
                    onChangeText={v => setFormData({ ...formData, retail_price: v })}
                    className="bg-white p-4 rounded-2xl border border-card font-bold shadow-sm"
                    placeholder="0.00"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-secondaryText text-[10px] font-bold uppercase ml-2 mb-2">Wholesale</Text>
                  <TextInput
                    value={formData.wholesale_price}
                    keyboardType="numeric"
                    onChangeText={v => setFormData({ ...formData, wholesale_price: v })}
                    className="bg-white p-4 rounded-2xl border border-card font-bold shadow-sm"
                    placeholder="0.00"
                  />
                </View>
              </View>

              <View className="flex-row gap-4 mb-6">
                <View className="flex-1">
                  <Text className="text-secondaryText text-[10px] font-bold uppercase ml-2 mb-2">Cost Price</Text>
                  <TextInput
                    value={formData.purchase_price}
                    keyboardType="numeric"
                    onChangeText={v => setFormData({ ...formData, purchase_price: v })}
                    className="bg-white p-4 rounded-2xl border border-card font-bold shadow-sm"
                    placeholder="0.00"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-secondaryText text-[10px] font-bold uppercase ml-2 mb-2">Unit</Text>
                  <TextInput
                    value={formData.unit}
                    onChangeText={v => setFormData({ ...formData, unit: v })}
                    className="bg-white p-4 rounded-2xl border border-card font-bold shadow-sm"
                    placeholder="pcs"
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={submitForm}
                disabled={isSubmitting}
                className="bg-primaryText py-5 rounded-[22px] items-center mb-10 shadow-lg"
              >
                {isSubmitting
                  ? <ActivityIndicator color="#e5fc01" />
                  : <Text className="text-accent font-black text-lg">Save Record</Text>
                }
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}
import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Alert, KeyboardAvoidingView, Platform, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useProducts } from '@/src/hooks/useProducts';
import { ProductCard } from '@/src/components/inventory/ProductCard';

export default function ProductScreen() {
  const { id: subId } = useLocalSearchParams();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  
  const { products, cart, updateQuantity, loading, isSubmitting, handleSave, handleDelete } = useProducts(subId, searchTerm);

  // --- NEW LOGIC: Page-Specific Cart Calculations ---
  // We filter the global cart to ONLY include items from the current subcategory
  const pageCartItems = Object.values(cart).filter(item => 
    subId === 'all' ? true : String(item.subcategory_id) === String(subId)
  );
  
  const pageQty = pageCartItems.reduce((sum, item) => sum + item.qty, 0);
  const pagePrice = pageCartItems.reduce((sum, item) => sum + (item.qty * (item.retail_price || 0)), 0);

  // --- Modal States ---
  const [selectedProd, setSelectedProd] = useState(null); 
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [formModalVisible, setFormModalVisible] = useState(false);
  
  const [formData, setFormData] = useState({ 
    item_name: '', 
    retail_price: '', 
    wholesale_price: '', 
    purchase_price: '', 
    unit: 'pcs' 
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
      item_name: selectedProd?.item_name || '',
      retail_price: String(selectedProd?.retail_price || ''),
      wholesale_price: String(selectedProd?.wholesale_price || ''),
      purchase_price: String(selectedProd?.purchase_price || ''),
      unit: selectedProd?.unit || 'pcs'
    });
    setFormModalVisible(true);
  };

  const confirmDelete = () => {
    setActionModalVisible(false);
    Alert.alert(
      "Delete Product",
      `Are you sure you want to delete "${selectedProd?.item_name || ''}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => handleDelete(selectedProd?._id) }
      ]
    );
  };

  const submitForm = async () => {
    if (!formData.item_name || !formData.retail_price) {
      return Alert.alert("Error", "Item Name and Retail Price are required");
    }
    
    const payloadToSave = {
      ...formData,
      retail_price: Number(formData.retail_price),
      wholesale_price: Number(formData.wholesale_price || 0),
      purchase_price: Number(formData.purchase_price || 0)
    };

    const success = await handleSave(payloadToSave, selectedProd?._id);
    if (success) {
      setFormModalVisible(false);
      setSelectedProd(null);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="px-6 py-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="bg-card p-3 rounded-2xl mr-4">
          <Feather name="arrow-left" size={20} color="#1f2617" />
        </TouchableOpacity>
        <View>
          <Text className="text-primaryText text-2xl font-black">{subId === 'all' ? 'All Inventory' : 'Products'}</Text>
          <Text className="text-secondaryText font-medium text-xs">Add to cart or edit</Text>
        </View>
      </View>

      <View className="px-6 mb-4 mt-2">
        <View className="bg-white flex-row items-center px-4 py-3 rounded-2xl border border-card shadow-sm">
          <Feather name="search" size={20} color="#bfb5a8" />
          <TextInput 
            placeholder="Search items..." 
            placeholderTextColor="#bfb5a8"
            value={searchTerm}
            onChangeText={setSearchTerm}
            className="flex-1 ml-3 text-primaryText font-bold"
          />
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#1f2617" /></View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 150 }}>
          {products.length === 0 ? (
            <View className="items-center justify-center mt-10 opacity-30">
              <Feather name="box" size={48} color="#393f35" />
              <Text className="text-primaryText font-bold mt-4">No products found</Text>
            </View>
          ) : (
            products.map(p => (
              <ProductCard 
                key={p._id} 
                product={p} 
                quantity={cart[p._id]?.qty || 0}
                onAdd={() => updateQuantity(p, 1)}
                onRemove={() => updateQuantity(p, -1)}
                onLongPress={() => handleLongPress(p)}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* Dynamic Floating Action Button (FAB) */}
      {subId !== 'all' && (
        <TouchableOpacity 
          onPress={openCreateModal}
          className={`absolute right-6 bg-primaryText w-16 h-16 rounded-full items-center justify-center shadow-lg shadow-primaryText/40 border-4 border-bg transition-all duration-300 z-40 ${pageQty > 0 ? 'bottom-32' : 'bottom-10'}`}
        >
          <Feather name="plus" size={28} color="#e5fc01" />
        </TouchableOpacity>
      )}

      {/* UX IMPROVEMENT: Sticky "Done Adding" Bar - Acts as a giant back button */}
      {pageQty > 0 && (
        <View className="absolute bottom-6 left-6 right-6 z-50 animate-in slide-in-from-bottom-5">
          <TouchableOpacity 
            onPress={() => router.back()} // Instantly takes them back to SubCategories
            activeOpacity={0.9}
            className="bg-accent p-5 rounded-[24px] flex-row items-center justify-between shadow-2xl shadow-accent/40"
          >
            <View className="flex-row items-center">
              <View className="bg-primaryText w-12 h-12 rounded-full items-center justify-center mr-4">
                <Text className="text-accent font-black text-xl">{pageQty}</Text>
              </View>
              <View>
                <Text className="text-primaryText font-black text-sm">Added from here</Text>
                <Text className="text-primaryText text-[11px] font-bold uppercase mt-1 opacity-70">
                  Page Total: ₹{pagePrice}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center bg-primaryText/10 px-4 py-3 rounded-2xl">
              <Text className="text-primaryText font-black text-sm mr-2 tracking-widest">DONE</Text>
              <Feather name="check-circle" size={20} color="#1f2617" />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Action Modal (Long Press) */}
      <Modal visible={actionModalVisible} transparent animationType="fade">
        <TouchableOpacity activeOpacity={1} onPress={() => setActionModalVisible(false)} className="flex-1 bg-black/60 justify-end">
          <View className="bg-bg p-6 rounded-t-[40px]">
            <Text className="text-secondaryText text-sm font-bold uppercase tracking-widest text-center mb-6">
              Manage "{selectedProd?.item_name || ''}"
            </Text>
            <TouchableOpacity onPress={openEditModal} className="bg-white p-5 rounded-2xl flex-row items-center mb-3 border border-card shadow-sm">
              <Feather name="edit-2" size={20} color="#1f2617" />
              <Text className="text-primaryText font-black text-lg ml-4">Edit Product</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={confirmDelete} className="bg-red-50 p-5 rounded-2xl flex-row items-center mb-6 border border-red-100 shadow-sm">
              <Feather name="trash-2" size={20} color="#ef4444" />
              <Text className="text-red-600 font-black text-lg ml-4">Delete Product</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Form Modal (Create/Edit) */}
      <Modal visible={formModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-black/70 justify-end">
          <View className="bg-bg p-8 rounded-t-[40px]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-primaryText text-2xl font-black">{selectedProd ? 'Edit Product' : 'New Product'}</Text>
              <TouchableOpacity onPress={() => setFormModalVisible(false)} className="bg-card p-2 rounded-full">
                <Feather name="x" size={20} color="#1f2617" />
              </TouchableOpacity>
            </View>

            <ScrollView className="max-h-[60vh]" showsVerticalScrollIndicator={false}>
              <Text className="text-secondaryText text-[10px] font-bold uppercase ml-2 mb-2">Item Name</Text>
              <TextInput value={formData.item_name} onChangeText={v => setFormData({...formData, item_name: v})} className="bg-white p-4 rounded-2xl border border-card font-bold mb-4 shadow-sm" placeholder="e.g. 10mm Steel" />
              
              <View className="flex-row gap-4 mb-4">
                <View className="flex-1">
                  <Text className="text-secondaryText text-[10px] font-bold uppercase ml-2 mb-2">Retail Price</Text>
                  <TextInput value={formData.retail_price} keyboardType="numeric" onChangeText={v => setFormData({...formData, retail_price: v})} className="bg-white p-4 rounded-2xl border border-card font-bold shadow-sm" placeholder="0.00" />
                </View>
                <View className="flex-1">
                  <Text className="text-secondaryText text-[10px] font-bold uppercase ml-2 mb-2">Wholesale</Text>
                  <TextInput value={formData.wholesale_price} keyboardType="numeric" onChangeText={v => setFormData({...formData, wholesale_price: v})} className="bg-white p-4 rounded-2xl border border-card font-bold shadow-sm" placeholder="0.00" />
                </View>
              </View>

              <View className="flex-row gap-4 mb-6">
                <View className="flex-1">
                  <Text className="text-secondaryText text-[10px] font-bold uppercase ml-2 mb-2">Cost Price</Text>
                  <TextInput value={formData.purchase_price} keyboardType="numeric" onChangeText={v => setFormData({...formData, purchase_price: v})} className="bg-white p-4 rounded-2xl border border-card font-bold shadow-sm" placeholder="0.00" />
                </View>
                <View className="flex-1">
                  <Text className="text-secondaryText text-[10px] font-bold uppercase ml-2 mb-2">Unit</Text>
                  <TextInput value={formData.unit} onChangeText={v => setFormData({...formData, unit: v})} className="bg-white p-4 rounded-2xl border border-card font-bold shadow-sm" placeholder="pcs" />
                </View>
              </View>

              <TouchableOpacity onPress={submitForm} disabled={isSubmitting} className="bg-primaryText py-5 rounded-[22px] items-center mb-10 shadow-lg">
                {isSubmitting ? <ActivityIndicator color="#e5fc01" /> : <Text className="text-accent font-black text-lg">Save Record</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
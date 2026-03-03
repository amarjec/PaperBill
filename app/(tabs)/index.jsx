import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Alert, KeyboardAvoidingView, Platform, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCategories } from '@/src/hooks/useCategories';
import { CategoryCard } from '@/src/components/inventory/CategoryCard';
import { SearchBar } from '@/src/components/ui/SearchBar';
import { FloatingButton } from '@/src/components/ui/FloatingButton';

export default function HomeTab() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const { categories, loading, isSubmitting, handleSave, handleDelete } = useCategories(searchTerm);

  // Modal States
  const [selectedCategory, setSelectedCategory] = useState(null); 
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [categoryName, setCategoryName] = useState('');

  // --- Handlers ---
  const handleLongPress = (category) => {
    Vibration.vibrate(50); 
    setSelectedCategory(category);
    setActionModalVisible(true);
  };

  const openCreateModal = () => {
    setSelectedCategory(null);
    setCategoryName('');
    setFormModalVisible(true);
  };

  const openEditModal = () => {
    setActionModalVisible(false);
    setCategoryName(selectedCategory?.name || ''); 
    setFormModalVisible(true);
  };

  const confirmDelete = () => {
    setActionModalVisible(false);
    Alert.alert(
      "Delete Category",
      `Are you sure you want to delete "${selectedCategory?.name || 'this category'}"? All related products will be affected.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => handleDelete(selectedCategory?._id) }
      ]
    );
  };

  const submitForm = async () => {
    if (!categoryName.trim()) return Alert.alert("Error", "Name is required");
    const success = await handleSave(categoryName, selectedCategory?._id);
    if (success) {
      setFormModalVisible(false);
      setSelectedCategory(null); 
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['left', 'right']}>
      
      {/* 1. Reusable Search Bar */}
      <SearchBar 
        value={searchTerm} 
        onChangeText={setSearchTerm} 
        placeholder="Search categories..." 
      />

      {/* Header Tags */}
      <View className="px-8 flex-row justify-between items-center mb-4 mt-2">
        <Text className="text-primaryText font-black text-lg tracking-tight">All Categories</Text>
        <Text className="text-secondaryText font-bold text-[10px] uppercase tracking-widest">{categories.length} Items</Text>
      </View>

      {/* Category Grid */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#e5fc01" />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}>
          {categories.length === 0 ? (
            <View className="items-center justify-center mt-12 bg-card/20 border-2 border-dashed border-card/60 rounded-[32px] p-10">
              <View className="w-16 h-16 bg-white rounded-2xl items-center justify-center shadow-sm mb-4">
                <MaterialCommunityIcons name="package-variant-closed" size={32} color="#bfb5a8" />
              </View>
              <Text className="text-primaryText font-black text-lg mb-1">No Categories Yet</Text>
              <Text className="text-secondaryText text-center font-medium text-xs leading-5">
                Tap the + button below to add your first inventory category.
              </Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap justify-between">
              {categories.map(cat => (
                <CategoryCard 
                  key={cat._id} 
                  category={cat} 
                  onPress={() => router.push(`/subcategory/${cat._id}`)}
                  onLongPress={() => handleLongPress(cat)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* 2. Reusable FAB */}
      <FloatingButton onPress={openCreateModal} bottomOffset={30} />

      {/* 1. Action Modal (Triggered by Long Press) */}
      <Modal visible={actionModalVisible} transparent animationType="fade">
        <TouchableOpacity activeOpacity={1} onPress={() => setActionModalVisible(false)} className="flex-1 bg-primaryText/40 justify-end">
          <View className="bg-bg p-6 rounded-t-[40px] shadow-2xl">
            <View className="w-12 h-1.5 bg-card rounded-full self-center mb-6" />
            
            <Text className="text-secondaryText text-xs font-black uppercase tracking-widest text-center mb-6">
              {selectedCategory?.name || 'Category Options'}
            </Text>
            
            <TouchableOpacity onPress={openEditModal} className="bg-white p-5 rounded-[24px] flex-row items-center mb-3 shadow-sm border border-card/40">
              <View className="bg-bg p-2 rounded-full">
                <Feather name="edit-2" size={18} color="#1f2617" />
              </View>
              <Text className="text-primaryText font-black text-base ml-4">Edit Category</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={confirmDelete} className="bg-red-50 p-5 rounded-[24px] flex-row items-center mb-6 shadow-sm border border-red-100">
              <View className="bg-red-100 p-2 rounded-full">
                <Feather name="trash-2" size={18} color="#ef4444" />
              </View>
              <Text className="text-red-600 font-black text-base ml-4">Delete Category</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setActionModalVisible(false)} className="py-4 items-center">
              <Text className="text-secondaryText font-bold text-sm uppercase tracking-widest">Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 2. Form Modal (Create / Update) */}
      <Modal visible={formModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-primaryText/40 justify-end">
          <View className="bg-bg p-8 rounded-t-[40px] shadow-2xl">
            <View className="w-12 h-1.5 bg-card rounded-full self-center mb-6" />

            <View className="flex-row justify-between items-center mb-8">
              <Text className="text-primaryText text-3xl font-black tracking-tight">
                {selectedCategory ? 'Edit Category' : 'New Category'}
              </Text>
              <TouchableOpacity onPress={() => setFormModalVisible(false)} className="bg-card/50 p-2.5 rounded-full">
                <Feather name="x" size={20} color="#1f2617" />
              </TouchableOpacity>
            </View>

            <View className="mb-10">
              <Text className="text-secondaryText text-[11px] font-black uppercase tracking-widest ml-4 mb-3">Category Name</Text>
              <TextInput 
                autoFocus
                value={categoryName}
                onChangeText={setCategoryName}
                placeholder="e.g. Mobile Phones"
                placeholderTextColor="#bfb5a8"
                className="bg-white px-6 py-5 rounded-[28px] border border-card/60 text-primaryText font-black text-lg shadow-sm"
              />
            </View>

            <TouchableOpacity 
              onPress={submitForm}
              disabled={isSubmitting}
              className="bg-primaryText py-5 rounded-[28px] flex-row justify-center items-center shadow-xl active:opacity-80"
              style={{ shadowColor: '#1f2617', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }}
            >
              {isSubmitting ? <ActivityIndicator color="#e5fc01" /> : (
                <>
                  <Text className="text-accent font-black text-sm tracking-widest uppercase mr-2">Save Category</Text>
                  <Feather name="check" size={18} color="#e5fc01" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
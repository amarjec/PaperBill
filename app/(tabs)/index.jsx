import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Alert, KeyboardAvoidingView, Platform, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCategories } from '@/src/hooks/useCategories';
import { CategoryCard } from '@/src/components/inventory/CategoryCard';

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
    Vibration.vibrate(50); // Haptic feedback
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
    // FIX: Safely access name with ?. and provide a fallback string
    setCategoryName(selectedCategory?.name || ''); 
    setFormModalVisible(true);
  };

  const confirmDelete = () => {
    setActionModalVisible(false);
    Alert.alert(
      "Delete Category",
      // FIX: Safely access name
      `Are you sure you want to delete "${selectedCategory?.name || 'this category'}"? All related products will be affected.`,
      [
        { text: "Cancel", style: "cancel" },
        // FIX: Safely access _id
        { text: "Delete", style: "destructive", onPress: () => handleDelete(selectedCategory?._id) }
      ]
    );
  };

  const submitForm = async () => {
    if (!categoryName.trim()) return Alert.alert("Error", "Name is required");
    // FIX: Safely pass _id (will be undefined if it's a new category, which is correct)
    const success = await handleSave(categoryName, selectedCategory?._id);
    if (success) {
      setFormModalVisible(false);
      setSelectedCategory(null); // Clear selection after save
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="px-6 pt-6 pb-2">
        <Text className="text-primaryText text-3xl font-black">Inventory</Text>
        <Text className="text-secondaryText font-medium">Manage Categories</Text>
      </View>

      {/* Search Bar */}
      <View className="px-6 mb-4 mt-4">
        <View className="bg-white flex-row items-center px-4 py-3 rounded-2xl border border-card shadow-sm">
          <Feather name="search" size={20} color="#bfb5a8" />
          <TextInput 
            placeholder="Search categories..." 
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

      {/* Category Grid */}
      {loading ? (
        <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#1f2617" /></View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}>
          {categories.length === 0 ? (
            <View className="items-center justify-center mt-20 opacity-30">
              <MaterialCommunityIcons name="package-variant" size={60} color="#393f35" />
              <Text className="text-primaryText font-bold mt-4">No categories found</Text>
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

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity 
        onPress={openCreateModal}
        className="absolute bottom-28 right-6 bg-accent w-16 h-16 rounded-full items-center justify-center shadow-lg shadow-accent/40 border-4 border-bg"
      >
        <Feather name="plus" size={28} color="#1f2617" />
      </TouchableOpacity>

      {/* 1. Action Modal (Triggered by Long Press) */}
      <Modal visible={actionModalVisible} transparent animationType="fade">
        <TouchableOpacity activeOpacity={1} onPress={() => setActionModalVisible(false)} className="flex-1 bg-black/60 justify-end">
          <View className="bg-bg p-6 rounded-t-[40px]">
            <Text className="text-secondaryText text-sm font-bold uppercase tracking-widest text-center mb-6">
              Options for {selectedCategory?.name || 'Category'}
            </Text>
            
            <TouchableOpacity onPress={openEditModal} className="bg-white p-5 rounded-2xl flex-row items-center mb-3 shadow-sm border border-card">
              <Feather name="edit-2" size={20} color="#1f2617" />
              <Text className="text-primaryText font-black text-lg ml-4">Edit Category</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={confirmDelete} className="bg-red-50 p-5 rounded-2xl flex-row items-center mb-6 shadow-sm border border-red-100">
              <Feather name="trash-2" size={20} color="#ef4444" />
              <Text className="text-red-600 font-black text-lg ml-4">Delete Category</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setActionModalVisible(false)} className="py-4 items-center">
              <Text className="text-secondaryText font-bold text-lg">Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 2. Form Modal (Create / Update) */}
      <Modal visible={formModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-black/70 justify-end">
          <View className="bg-bg p-8 rounded-t-[40px]">
            <View className="flex-row justify-between items-center mb-8">
              <Text className="text-primaryText text-2xl font-black">
                {selectedCategory ? 'Edit Category' : 'New Category'}
              </Text>
              <TouchableOpacity onPress={() => setFormModalVisible(false)} className="bg-card p-2 rounded-full">
                <Feather name="x" size={20} color="#1f2617" />
              </TouchableOpacity>
            </View>

            <View className="mb-8">
              <Text className="text-secondaryText text-[10px] font-bold uppercase ml-4 mb-2">Category Name</Text>
              <TextInput 
                autoFocus
                value={categoryName}
                onChangeText={setCategoryName}
                placeholder="e.g. Mobile Phones"
                placeholderTextColor="#bfb5a8"
                className="bg-white p-5 rounded-2xl border border-card text-primaryText font-bold text-base shadow-sm"
              />
            </View>

            <TouchableOpacity 
              onPress={submitForm}
              disabled={isSubmitting}
              className="bg-primaryText py-5 rounded-[22px] flex-row justify-center items-center shadow-lg"
            >
              {isSubmitting ? <ActivityIndicator color="#e5fc01" /> : (
                <Text className="text-accent font-black text-lg tracking-widest uppercase">Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
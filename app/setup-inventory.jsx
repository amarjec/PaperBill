import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { inventoryTemplates } from '@/src/constants/inventoryTemplates';
import { useAuth } from '@/src/context/AuthContext';
import apiClient from '@/src/api/apiClient';

// ─── business type catalogue ──────────────────────────────────────────────────
const BUSINESS_TYPES = [
  { id: 'plumbing',      label: 'Plumbing',           icon: 'pipe',           color: '#2563eb', bg: 'bg-blue-50',   products: 126, subcats: 10 },
  { id: 'electrical',   label: 'Electrical',          icon: 'flash',          color: '#d97706', bg: 'bg-amber-50',  products: 59,  subcats: 5  },
  { id: 'sanitaryware', label: 'Sanitaryware',        icon: 'toilet',         color: '#0d9488', bg: 'bg-teal-50',   products: 37,  subcats: 6  },
  { id: 'pumps',        label: 'Pumps & Motors',      icon: 'pump',           color: '#7c3aed', bg: 'bg-purple-50', products: 80,  subcats: 8  },
  { id: 'paint',        label: 'Paints',              icon: 'format-paint',   color: '#dc2626', bg: 'bg-red-50',    products: 28,  subcats: 6  },
  { id: 'plywood',      label: 'Plywood',             icon: 'door',           color: '#92400e', bg: 'bg-orange-50', products: 38,  subcats: 8  },
  { id: 'construction', label: 'Construction',        icon: 'crane',          color: '#374151', bg: 'bg-gray-50',   products: 18,  subcats: 4  },
  { id: 'powertools',   label: 'Power Tools',         icon: 'tools',          color: '#16a34a', bg: 'bg-green-50',  products: 11,  subcats: 3  },
];

export default function SetupInventoryScreen() {
  const router = useRouter();
  const { user, updateSessionUser } = useAuth();

  const [selected, setSelected] = useState(new Set());   // multi-select
  const [loading, setLoading]   = useState(false);

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const totalProducts = [...selected].reduce((acc, id) => {
    const t = BUSINESS_TYPES.find(b => b.id === id);
    return acc + (t?.products || 0);
  }, 0);

  // ── import handler ──────────────────────────────────────────────────────────
  const handleImport = () => {
    if (selected.size === 0) {
      Alert.alert('No category selected', 'Please select at least one business category to import.');
      return;
    }

    const labels = [...selected].map(id => BUSINESS_TYPES.find(b => b.id === id)?.label).join(', ');

    Alert.alert(
      'Import Inventory',
      `This will add ~${totalProducts} products across ${selected.size} categor${selected.size > 1 ? 'ies' : 'y'} (${labels}). You can edit or delete them later.\n\nProceed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          onPress: async () => {
            setLoading(true);
            try {
              // Merge all selected templates into one payload
              const merged = [...selected].flatMap(id => inventoryTemplates[id] || []);

              const { data } = await apiClient.post('/inventory/import-template', {
                templateData: merged,
              });

              if (data.success) {
                const updatedUser = { ...user, has_inventory: true };
                await updateSessionUser(updatedUser);
                Alert.alert(
                  'All Done! 🎉',
                  `${totalProducts} products imported successfully. You can now start billing.`,
                  [{ text: 'Go to Profile', onPress: () => router.push('/(tabs)') }]
                );
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to import inventory. Please try again.');
              console.error(err);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // ── loading screen ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center px-10">
        <View className="bg-primaryText w-20 h-20 rounded-[28px] items-center justify-center mb-8"
          style={{ shadowColor: '#1f2617', shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 8 }}
        >
          <MaterialCommunityIcons name="store-plus" size={36} color="#e5fc01" />
        </View>
        <ActivityIndicator size="large" color="#1f2617" />
        <Text className="text-primaryText font-black text-2xl mt-6 text-center tracking-tight">
          Building Your Shop
        </Text>
        <Text className="text-secondaryText text-center mt-2 text-[13px] font-bold leading-6">
          Inserting {totalProducts}+ products, categories{'\n'}and market prices…
        </Text>
        <View className="flex-row flex-wrap justify-center mt-6" style={{ gap: 8 }}>
          {[...selected].map(id => {
            const t = BUSINESS_TYPES.find(b => b.id === id);
            return (
              <View key={id} className="bg-card border border-card px-3 py-1.5 rounded-xl">
                <Text className="text-secondaryText font-bold text-[11px]">{t?.label}</Text>
              </View>
            );
          })}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View className="flex-row items-center px-5 pt-4 pb-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-card w-10 h-10 rounded-2xl items-center justify-center mr-4"
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={18} color="#1f2617" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-primaryText text-xl font-black tracking-tight">Bulk Add Products</Text>
          <Text className="text-secondaryText text-[10px] font-bold mt-0.5">
            Select categories to import
          </Text>
        </View>
      </View>

      {/* ── Intro banner ─────────────────────────────────────────────────────── */}
      <View className="mx-5 mb-4">
        <View
          className="bg-primaryText rounded-[22px] px-5 py-4 flex-row items-center"
          style={{ shadowColor: '#1f2617', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 5 }}
        >
          <View className="bg-accent/20 w-11 h-11 rounded-2xl items-center justify-center mr-4 flex-shrink-0">
            <MaterialCommunityIcons name="store-plus" size={22} color="#e5fc01" />
          </View>
          <View className="flex-1">
            <Text className="text-accent font-black text-[15px] leading-tight">
              Select multiple categories
            </Text>
            <Text className="text-secondary text-[10px] font-bold opacity-55 mt-0.5">
              All products are pre-priced with real market rates. Edit anytime.
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
      >
        {/* ── 2-col grid ───────────────────────────────────────────────────── */}
        <View className="flex-row flex-wrap justify-between" style={{ gap: 10 }}>
          {BUSINESS_TYPES.map((type) => {
            const isSelected = selected.has(type.id);
            return (
              <TouchableOpacity
                key={type.id}
                onPress={() => toggle(type.id)}
                activeOpacity={0.82}
                style={{ width: '48.5%' }}
              >
                <View
                  className={`rounded-[22px] border overflow-hidden ${
                    isSelected
                      ? 'bg-primaryText border-primaryText'
                      : 'bg-white border-card'
                  }`}
                  style={{
                    shadowColor: isSelected ? '#1f2617' : '#c8c0b4',
                    shadowOpacity: isSelected ? 0.22 : 0.08,
                    shadowRadius: isSelected ? 12 : 6,
                    shadowOffset: { width: 0, height: isSelected ? 5 : 2 },
                    elevation: isSelected ? 5 : 2,
                  }}
                >
                  {/* Top accent stripe when selected */}
                  {isSelected && <View className="h-1 bg-accent w-full" />}

                  <View className="px-4 pt-4 pb-4">
                    {/* Icon + check */}
                    <View className="flex-row items-start justify-between mb-3">
                      <View className={`w-11 h-11 rounded-2xl items-center justify-center ${isSelected ? 'bg-accent/20' : type.bg}`}>
                        <MaterialCommunityIcons
                          name={type.icon}
                          size={22}
                          color={isSelected ? '#e5fc01' : type.color}
                        />
                      </View>
                      {/* Checkbox */}
                      <View className={`w-6 h-6 rounded-lg border-2 items-center justify-center ${
                        isSelected ? 'bg-accent border-accent' : 'border-card bg-bg'
                      }`}>
                        {isSelected && <Feather name="check" size={13} color="#1f2617" />}
                      </View>
                    </View>

                    {/* Name */}
                    <Text
                      className={`font-black text-[14px] leading-tight mb-1 ${isSelected ? 'text-accent' : 'text-primaryText'}`}
                      numberOfLines={2}
                    >
                      {type.label}
                    </Text>

                    {/* Counts */}
                    <View className="flex-row items-center" style={{ gap: 6 }}>
                      <View className={`px-2 py-0.5 rounded-md ${isSelected ? 'bg-white/10' : 'bg-card'}`}>
                        <Text className={`text-[9px] font-black uppercase tracking-widest ${isSelected ? 'text-secondary' : 'text-secondaryText'}`}>
                          {type.products} items
                        </Text>
                      </View>
                      <View className={`px-2 py-0.5 rounded-md ${isSelected ? 'bg-white/10' : 'bg-card'}`}>
                        <Text className={`text-[9px] font-black uppercase tracking-widest ${isSelected ? 'text-secondary' : 'text-secondaryText'}`}>
                          {type.subcats} cats
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Select all / clear ────────────────────────────────────────────── */}
        <View className="flex-row mt-4" style={{ gap: 10 }}>
          <TouchableOpacity
            onPress={() => setSelected(new Set(BUSINESS_TYPES.map(b => b.id)))}
            activeOpacity={0.7}
            className="flex-1 bg-white border border-card py-3 rounded-2xl items-center"
          >
            <Text className="text-primaryText font-black text-[11px] uppercase tracking-widest">Select All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelected(new Set())}
            activeOpacity={0.7}
            className="flex-1 bg-white border border-card py-3 rounded-2xl items-center"
          >
            <Text className="text-secondaryText font-black text-[11px] uppercase tracking-widest">Clear</Text>
          </TouchableOpacity>
        </View>

        {/* ── Manual skip ──────────────────────────────────────────────────── */}
        <TouchableOpacity
          onPress={async () => {
            const updatedUser = { ...user, has_inventory: true };
            await updateSessionUser(updatedUser);
            router.back();
          }}
          activeOpacity={0.7}
          className="mt-3 py-4 items-center"
        >
          <Text className="text-secondaryText font-bold text-[11px] uppercase tracking-widest">
            I'll add items manually
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Sticky import bar ────────────────────────────────────────────────── */}
      {selected.size > 0 && (
        <View
          className="absolute bottom-0 left-0 right-0 bg-bg border-t border-card/50 px-5 pt-3 pb-8"
          style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: -3 }, elevation: 10 }}
        >
          <TouchableOpacity
            onPress={handleImport}
            activeOpacity={0.88}
            className="bg-primaryText rounded-[22px] py-4 flex-row items-center justify-center"
            style={{ shadowColor: '#1f2617', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 5 }}
          >
            <MaterialCommunityIcons name="store-check" size={18} color="#e5fc01" style={{ marginRight: 10 }} />
            <View>
              <Text className="text-accent font-black text-[14px] uppercase tracking-widest">
                Import {selected.size} Categor{selected.size > 1 ? 'ies' : 'y'}
              </Text>
              <Text className="text-secondary text-[10px] font-bold opacity-50 text-center">
                ~{totalProducts} products
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

    </SafeAreaView>
  );
}
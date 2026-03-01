import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { inventoryTemplates } from '@/src/constants/inventoryTemplates'; 
import { useAuth } from '@/src/context/AuthContext'; // IMPORT AUTH
import apiClient from '@/src/api/apiClient';

export default function SetupInventoryScreen() {
    const router = useRouter();
    const { user, setUser } = useAuth(); // ACCESS SETUSER
    const [loading, setLoading] = useState(false);

    const businessTypes = [
        { id: 'plumbing', label: 'Plumbing', icon: 'pipe' },
        { id: 'electrical', label: 'Electrical', icon: 'flash' },
        { id: 'construction', label: 'Construction', icon: 'crane' },
        { id: 'paint', label: 'Paints', icon: 'format-paint' },
        { id: 'plywood', label: 'Plywood & Hardware', icon: 'door' },
        { id: 'pumps', label: 'Pumps & Motors', icon: 'pump' },
        { id: 'powertools', label: 'Power Tools', icon: 'tools' },
        { id: 'sanitaryware', label: 'Sanitaryware', icon: 'toilet' },
    ];

    const handleImport = async (typeId) => {
        // const template = inventoryTemplates[typeId];
        const selectedTemplate = inventoryTemplates[typeId];
        
        Alert.alert(
            "Import Template",
            `This will pre-fill your shop with standard ${typeId} items. You can edit prices later. Proceed?`,
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Import", 
                    onPress: async () => {
                        setLoading(true);
                        try {
                            // 1. Call your Bulk Import Backend Controller
                            const { data } = await apiClient.post('/inventory/import-template', { 
                                templateData: selectedTemplate 
                            });

                            if (data.success) {
                                // 2. CRITICAL: Update the user state in Context
                                // This tells _layout.jsx that the inventory setup is finished.
                                const updatedUser = { ...user, has_inventory: true };
                                setUser(updatedUser); 
                                
                                // 3. The Auth Guard in _layout.jsx will now handle the redirect to /(tabs)
                                Alert.alert("Success", "Your shop is ready!");
                            }
                        } catch (err) {
                            Alert.alert("Error", "Failed to build inventory. Please try again.");
                            console.error(err);
                        } finally {
                            setLoading(false);
                            router.push('/(tabs)/profile');
                        }
                    }
                }
            ]
        );
    };

    const handleSkip = () => {
        // Even if they skip, we mark has_inventory as true so they aren't stuck on this screen
        const updatedUser = { ...user, has_inventory: true };
        setUser(updatedUser);
        router.push('/(tabs)/profile');
    };

    if (loading) {
        return (
            <View className="flex-1 bg-bg justify-center items-center px-10">
                <ActivityIndicator size="large" color="#1f2617" />
                <Text className="text-primaryText font-black text-2xl mt-8 text-center">Building Your Shop</Text>
                <Text className="text-secondaryText text-center mt-3 leading-5">
                    We are inserting hundreds of products, categories, and market prices into your database...
                </Text>
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-bg">
            <View className="px-8 py-10">
                <View className="bg-accent w-12 h-12 rounded-2xl items-center justify-center mb-6">
                    <MaterialCommunityIcons name="store-plus" size={24} color="#1f2617" />
                </View>
                <Text className="text-primaryText text-4xl font-black tracking-tighter">Inventory Setup</Text>
                <Text className="text-secondaryText font-medium mt-2 leading-5">
                    Select your primary business category. We'll pre-fill your inventory so you can start billing immediately.
                </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 50 }}>
                <View className="flex-row flex-wrap justify-between">
                    {businessTypes.map((type) => (
                        <Pressable 
                            key={type.id}
                            onPress={() => handleImport(type.id)}
                            className="w-[48%] bg-white p-6 rounded-[36px] border border-card shadow-sm mb-4 items-center active:scale-95 transition-all"
                        >
                            <View className="bg-bg w-14 h-14 rounded-full items-center justify-center mb-4 border border-card">
                                <MaterialCommunityIcons name={type.icon} size={28} color="#1f2617" />
                            </View>
                            <Text className="text-primaryText font-black text-center text-sm tracking-tight">{type.label}</Text>
                        </Pressable>
                    ))}
                </View>

                <Pressable 
                    onPress={handleSkip}
                    className="mt-8 py-4 items-center bg-card/30 rounded-2xl border border-secondary/10"
                >
                    <Text className="text-primaryText font-black uppercase tracking-widest text-[10px]">I'll Add My Own Items Manually</Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}
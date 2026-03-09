import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useShopSetup } from "../src/hooks/useShopSetup";

const BUSINESS_TYPES = ["Hardware", "Electronics", "Other"];

export default function ShopSetupScreen() {
  const { form, updateField, toggleBusinessType, handleSetup, loading } =
    useShopSetup();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <SafeAreaView className="flex-1 bg-primaryText">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-8 py-12">
            <Text className="text-accent text-4xl font-black tracking-tighter">
              Shop Profile
            </Text>
            <Text className="text-secondary font-medium mt-1">
              Final step to launch Paper Bill
            </Text>
          </View>

          <View className="flex-1 bg-bg rounded-t-[45px] p-8 pt-10">
            <View className="flex-row justify-between items-center mb-4 ml-1">
              <Text className="text-primaryText text-[11px] font-black uppercase tracking-widest">
                Business Type
              </Text>
              <Text className="text-secondary text-[10px] font-bold">
                Select multiple
              </Text>
            </View>

            <View className="flex-row flex-wrap mb-6">
              {BUSINESS_TYPES.map((type) => {
                const isSelected = form.businessTypes.includes(type);
                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() => toggleBusinessType(type)}
                    className={`mr-2 mb-2 px-4 py-2.5 rounded-xl border ${isSelected ? "bg-secondaryText border-secondaryText" : "bg-white border-secondary/20"}`}
                  >
                    <Text
                      className={`font-bold text-xs ${isSelected ? "text-accent" : "text-secondaryText"}`}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View className="gap-y-5">
              <InputGroup
                label="Shop Name"
                icon="store-outline"
                placeholder="Agrawal Electronics"
                value={form.shopName}
                onChangeText={(v) => updateField("shopName", v)}
              />
              <InputGroup
                label="Full Address"
                icon="map-pin"
                placeholder="Market, Jabalpur"
                value={form.address}
                onChangeText={(v) => updateField("address", v)}
                multiline
              />

              <View className="flex-row gap-x-3">
                <View className="flex-[1.5]">
                  <InputGroup
                    label="Number"
                    icon="phone"
                    placeholder="Mobile"
                    value={form.number}
                    onChangeText={(v) => updateField("number", v)}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>
                <View className="flex-1">
                  <InputGroup
                    label="Secure PIN"
                    icon="lock"
                    placeholder="****"
                    value={form.pin}
                    onChangeText={(v) => updateField("pin", v)}
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSetup}
              disabled={loading}
              activeOpacity={0.9}
              className="bg-accent py-5 rounded-[22px] mt-10 shadow-lg shadow-accent/20 items-center flex-row justify-center"
            >
              {loading ? (
                <ActivityIndicator color="#1f2617" />
              ) : (
                <>
                  <Text className="text-primaryText font-black text-lg mr-2 uppercase">
                    Complete
                  </Text>
                  <Feather name="arrow-right" size={20} color="#1f2617" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const InputGroup = ({ label, icon, ...props }) => (
  <View>
    <Text className="text-secondary text-[10px] font-bold uppercase ml-4 mb-2">
      {label}
    </Text>
    <View className="bg-white rounded-2xl flex-row items-center px-4 h-14 border border-card">
      {icon === "store-outline" ? (
        <MaterialCommunityIcons name={icon} size={20} color="#bfb5a8" />
      ) : (
        <Feather name={icon} size={18} color="#bfb5a8" />
      )}
      <TextInput
        className="flex-1 ml-3 text-primaryText font-bold text-base"
        placeholderTextColor="#bfb5a8"
        {...props}
      />
    </View>
  </View>
);

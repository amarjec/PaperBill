import React from "react";
import { View, Text, TouchableOpacity, Pressable } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";

export default function GlobalHeader() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { user } = useAuth();

  // --- ROLE DETECTION ---
  // The Staff model has an 'owner_id' field. The User (Owner) model does not.
  const isOwner = user && !user.owner_id;

  // --- DATA EXTRACTION ---
  // Owner sees Shop Name. Staff sees a generic title.
  const titleText = isOwner ? user?.business_name || "KachaBill" : "KachaBill";

  // Owner sees Shop Address. Staff sees a welcome message with their name.
  const subtitleText = isOwner
    ? user?.address || "Tap settings to add address"
    : `Welcome, ${user?.name || "Team Member"}`;

  const isPremium = user?.isPremium || false;

  // Handle backend variations (expiryDate vs subscription.end_date)
  const rawExpiry = user?.expiryDate || user?.subscription?.end_date;
  const formattedExpiry = rawExpiry
    ? new Date(rawExpiry).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      })
    : "N/A";

  const daysUntilExpiry = rawExpiry
    ? Math.ceil((new Date(rawExpiry) - new Date()) / (1000 * 60 * 60 * 24))
    : null;
  const showExpiryWarning =
    isPremium && daysUntilExpiry !== null && daysUntilExpiry <= 7;

  return (
    <View
      className="bg-primaryText px-6 pb-4 border-b border-secondaryText/50 shadow-sm"
      style={{ paddingTop: insets.top + 16 }}
    >
      <View className="flex-row justify-between items-start">
        {/* --- LEFT SIDE: Dynamic Info --- */}
        <View className="flex-1 pr-4 justify-center">
          <Text
            className="text-bg font-black text-2xl tracking-tight mb-1.5"
            numberOfLines={1}
          >
            {titleText}
          </Text>
          <View className="flex-row items-center pr-2">
            {isOwner ? (
              <Feather
                name="map-pin"
                size={12}
                color="#bfb5a8"
                className="mr-1"
              />
            ) : (
              <Feather name="user" size={12} color="#bfb5a8" className="mr-1" />
            )}
            <Text
              className="text-secondary font-semibold text-xs tracking-wide flex-1"
              numberOfLines={1}
            >
              {subtitleText}
            </Text>
          </View>
        </View>

        {/* --- RIGHT SIDE: Badges --- */}
        <View className="pt-1">
          {isOwner ? (
            /* OWNER VIEW: Premium/Free Logic */
            <TouchableOpacity
              activeOpacity={isPremium ? 1 : 0.7}
              onPress={() => !isPremium && router.push("/subscription")}
              className="items-center"
            >
              <View
                className={`px-2 py-1.5 rounded-full flex-row items-center mb-1.5 min-w-[80px] justify-center ${
                  isPremium
                    ? "bg-accent/20 border border-accent/40"
                    : "bg-secondary/40 border border-secondary"
                }`}
              >
                <MaterialCommunityIcons
                  name={isPremium ? "crown" : "rocket-launch-outline"}
                  size={14}
                  color={isPremium ? "#e5fc01" : "#9ca3af"}
                />

                <Text
                  className={`text-[11px] font-black tracking-widest uppercase ml-1 ${
                    isPremium ? "text-accent" : "text-gray-300"
                  }`}
                >
                  {isPremium ? "PREMIUM" : "FREE"}
                </Text>
              </View>

              <Text
                className="text-secondary text-[9px] font-bold uppercase tracking-widest text-center"
                style={{ width: 90 }}
                numberOfLines={1}
              >
                {isPremium ? `TILL ${formattedExpiry}` : ""}
              </Text>
            </TouchableOpacity>
          ) : (
            /* STAFF VIEW: Static Security Badge */
            <View className="items-center">
              <View className="bg-secondaryText px-2 py-1.5 rounded-full flex-row items-center mb-1.5 border border-secondary/10 min-w-[90px] justify-center">
                <Feather name="shield" size={12} color="#d8d0c4" />
                <Text className="text-card text-[11px] font-black tracking-widest uppercase ml-1">
                  STAFF
                </Text>
              </View>
              <Text
                className="text-secondary text-[9px] font-bold uppercase tracking-widest text-center"
                style={{ width: 90 }}
                numberOfLines={1}
              >
                {user?.phone_number || "Active"}
              </Text>
            </View>
          )}
        </View>
      </View>
      {showExpiryWarning && (
        <Pressable
          onPress={() => router.push("/subscription")}
          className="bg-amber-400/20 border border-amber-400/30 mx-4 mt-2 px-4 py-2 rounded-2xl flex-row items-center justify-center"
        >
          <Feather name="alert-circle" size={13} color="#f59e0b" />
          <Text className="text-amber-600 font-bold text-xs ml-2">
            Premium expires in {daysUntilExpiry} day
            {daysUntilExpiry !== 1 ? "s" : ""} — Renew now
          </Text>
        </Pressable>
      )}
    </View>
  );
}

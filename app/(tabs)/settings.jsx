import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useProfile } from "@/src/hooks/useProfile";

// ── Settings row ──────────────────────────────────────────────────────────────
const Row = ({
  icon,
  iconBg = "bg-card",
  iconColor = "#393f35",
  label,
  sub,
  badge,
  onPress,
  rightText,
  danger,
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={onPress ? 0.7 : 1}
    className="flex-row items-center px-4 py-3.5"
  >
    <View
      className={`w-9 h-9 rounded-xl items-center justify-center mr-4 flex-shrink-0 ${iconBg}`}
    >
      <Feather name={icon} size={15} color={danger ? "#ef4444" : iconColor} />
    </View>
    <View className="flex-1">
      <View className="flex-row items-center" style={{ gap: 6 }}>
        <Text
          className={`font-bold text-[14px] ${danger ? "text-red-500" : "text-primaryText"}`}
        >
          {label}
        </Text>
        {badge && (
          <View className="bg-amber-400 px-1.5 py-0.5 rounded-md">
            <Text className="text-primaryText font-black text-[8px] uppercase tracking-widest">
              {badge}
            </Text>
          </View>
        )}
      </View>
      {sub ? (
        <Text className="text-secondaryText text-[10px] font-bold mt-0.5">
          {sub}
        </Text>
      ) : null}
    </View>
    {rightText ? (
      <Text className="text-secondaryText text-[11px] font-bold mr-1">
        {rightText}
      </Text>
    ) : onPress ? (
      <Feather name="chevron-right" size={15} color="#c8c0b4" />
    ) : null}
  </TouchableOpacity>
);

const Sep = () => <View className="h-px bg-card/70 ml-[60px]" />;

const Group = ({ label, children, accent }) => (
  <View className="mb-4 px-5">
    {label && (
      <Text className="text-secondaryText text-[10px] font-black uppercase tracking-widest mb-2 ml-0.5">
        {label}
      </Text>
    )}
    <View
      className={`rounded-[22px] border overflow-hidden ${accent ? "bg-primaryText border-primaryText/50" : "bg-white border-card"}`}
      style={{
        shadowColor: accent ? "#1f2617" : "#c8c0b4",
        shadowOpacity: accent ? 0.2 : 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: accent ? 4 : 2,
      }}
    >
      {children}
    </View>
  </View>
);

// ── Staff identity + permissions card ─────────────────────────────────────────
const StaffCard = ({ profile }) => {
  const initials =
    profile.name
      ?.split(" ")
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?";
  const isSuspended = profile.status === "Suspended";

  const permLevel = (perms) => {
    if (!perms) return { label: "None", color: "#ef4444" };
    const { read, create, update, delete: del } = perms;
    if (read && create && update && del)
      return { label: "Full", color: "#16a34a" };
    if (read && create) return { label: "Standard", color: "#2563eb" };
    if (read) return { label: "View", color: "#d97706" };
    return { label: "None", color: "#ef4444" };
  };

  return (
    <View className="px-5 mb-4">
      <View
        className="bg-primaryText rounded-[24px] overflow-hidden"
        style={{
          shadowColor: "#1f2617",
          shadowOpacity: 0.28,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 6,
        }}
      >
        {/* Accent top stripe */}
        <View className="h-1 bg-accent w-full" />

        <View className="px-5 pt-5 pb-5">
          {/* Avatar + name + status */}
          <View className="flex-row items-center mb-4">
            <View className="bg-accent w-14 h-14 rounded-2xl items-center justify-center mr-4 flex-shrink-0">
              <Text className="text-primaryText font-black text-xl">
                {initials}
              </Text>
            </View>
            <View className="flex-1">
              <Text
                className="text-accent font-black text-[18px] leading-tight"
                numberOfLines={1}
              >
                {profile.name}
              </Text>
              <Text className="text-secondary text-[11px] font-bold opacity-55 mt-0.5">
                {profile.phone_number || "Staff Member"}
              </Text>
            </View>
            <View
              className={`px-3 py-1.5 rounded-xl border ml-2 ${isSuspended ? "bg-red-500/20 border-red-400/30" : "bg-accent/15 border-accent/20"}`}
            >
              <Text
                className={`text-[9px] font-black uppercase tracking-widest ${isSuspended ? "text-red-400" : "text-accent"}`}
              >
                {isSuspended ? "Suspended" : "● Active"}
              </Text>
            </View>
          </View>

          {/* Suspended warning */}
          {isSuspended && (
            <View className="bg-red-500/15 border border-red-400/25 rounded-2xl px-4 py-3 flex-row items-center mb-4">
              <Feather name="alert-triangle" size={13} color="#f87171" />
              <Text className="text-red-400 font-bold text-[11px] ml-2 flex-1">
                Contact your manager to restore access
              </Text>
            </View>
          )}

          {/* Permissions — compact pill row */}
          {profile.permissions &&
            Object.keys(profile.permissions).length > 0 && (
              <View className="border-t border-white/10 pt-4">
                <Text className="text-secondary text-[9px] font-black uppercase tracking-widest opacity-45 mb-2.5">
                  Access Level
                </Text>
                <View className="flex-row flex-wrap" style={{ gap: 6 }}>
                  {Object.entries(profile.permissions).map(([mod, perms]) => {
                    const { label, color } = permLevel(perms);
                    return (
                      <View
                        key={mod}
                        className="flex-row items-center bg-white/8 border border-white/10 rounded-xl px-3 py-1.5"
                        style={{ gap: 5 }}
                      >
                        <View
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <Text className="text-secondary text-[10px] font-bold capitalize opacity-80">
                          {mod}
                        </Text>
                        <Text
                          className="text-[9px] font-black uppercase"
                          style={{ color }}
                        >
                          {label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
        </View>
      </View>
    </View>
  );
};

// ── Screen ────────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const router = useRouter();
  const { profile, loading, isStaff, handleLogout, handleDeleteAccount } =
    useProfile();

  if (loading || !profile) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator size="large" color="#1f2617" />
      </SafeAreaView>
    );
  }

  return (
    // edges={['bottom']} — top is handled by GlobalHeader, bottom prevents tab bar overlap
    <SafeAreaView className="flex-1 bg-bg" edges={["bottom"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 16 }}
      >
        {/* ════ OWNER ══════════════════════════════════════════════════════════ */}
        {!isStaff && (
          <>
            {/* My Shop — profile + analytics + bills grouped */}
            <View className="mb-4 px-5">
              <Text className="text-secondaryText text-[10px] font-black uppercase tracking-widest mb-2 ml-0.5">
                My Shop
              </Text>
              <View
                className="bg-white rounded-[22px] border border-card overflow-hidden"
                style={{
                  shadowColor: "#c8c0b4",
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 3 },
                  elevation: 2,
                }}
              >
                <Row
                  icon="user"
                  iconBg="bg-green-50"
                  iconColor="#10b981"
                  label="Profile"
                  sub="Name, business details & plan"
                  onPress={() => router.push("/account")}
                />
                <Sep />
                {/* Analytics row — purple tinted */}
                <TouchableOpacity
                  onPress={() => router.push("/analytics")}
                  activeOpacity={0.8}
                  className="flex-row items-center px-4 py-4 bg-purple-50"
                >
                  <View className="w-9 h-9 bg-purple-100 rounded-xl items-center justify-center mr-4">
                    <Feather name="bar-chart-2" size={15} color="#7c3aed" />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center" style={{ gap: 6 }}>
                      <Text className="text-primaryText font-bold text-[14px]">
                        Analytics
                      </Text>
                      {!profile.isPremium && (
                        <View className="bg-amber-400 px-1.5 py-0.5 rounded-md">
                          <Text className="text-primaryText font-black text-[8px] uppercase tracking-widest">
                            Pro
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-secondaryText text-[10px] font-bold mt-0.5">
                      Sales, revenue & profit trends
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={15} color="#7c3aed" />
                </TouchableOpacity>
                <Sep />
                {/* recycle bin */}
                <TouchableOpacity
                  onPress={() => router.push("/recycle-bin")}
                  activeOpacity={0.8}
                  className="flex-row items-center px-4 py-4"
                >
                  <View className="w-9 h-9 bg-orange-50 rounded-xl items-center justify-center mr-4">
                    <MaterialCommunityIcons name="delete-empty" size={15} color="#fca5a5" />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center" style={{ gap: 6 }}>
                      <Text className="text-primaryText font-bold text-[14px]">
                        Recycle Bin
                      </Text>
                      {!profile.isPremium && (
                        <View className="bg-amber-400 px-1.5 py-0.5 rounded-md">
                          <Text className="text-primaryText font-black text-[8px] uppercase tracking-widest">
                            Pro
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-secondaryText text-[10px] font-bold mt-0.5">
                      Manage deleted bills & khata 
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={15} color="#7c3aed" />
                </TouchableOpacity>
              
              </View>
            </View>

            <Group label="Management">
              <Row
                icon="users"
                iconBg="bg-indigo-50"
                iconColor="#4338ca"
                label="Manage Staff"
                sub="Roles, accounts & permissions"
                badge={!profile.isPremium ? "Pro" : undefined}
                onPress={() => router.push("/staff")}
              />
              <Sep />
              <Row
                icon="book"
                iconBg="bg-teal-50"
                iconColor="#0d9488"
                label="Manage Customers"
                sub="Ledger and customer records"
                onPress={() => router.push("/customer")}
              />
              <Sep />
              <Row
                icon="package"
                iconBg="bg-orange-50"
                iconColor="#ea580c"
                label="Bulk Add Products"
                sub="Quick inventory import"
                onPress={() => router.push("/setup-inventory")}
              />
            </Group>

            <Group label="About">
              <Row icon="shield" label="Privacy Policy" onPress={() => {router.push("/legal")}} />
              <Sep />
              <Row
                icon="help-circle"
                label="Help & Support"
                onPress={() => {router.push("/support")}}
              />
            </Group>
          </>
        )}

        {/* ════ STAFF ══════════════════════════════════════════════════════════ */}
        {/* {isStaff && (
          <>
            <StaffCard profile={profile} />

            <Group label="Quick Access">
              <Row
                icon="file-text"
                iconBg="bg-blue-50"
                iconColor="#2563eb"
                label="Bills"
                sub="View your recent bills"
                onPress={() => router.push("/(tabs)/history")}
              />
              <Sep />
              <Row
                icon="book"
                iconBg="bg-teal-50"
                iconColor="#0d9488"
                label="Customers & Khata"
                sub="Customer list & outstanding balance"
                onPress={() => router.push("/customer")}
              />
            </Group>
          </>
        )} */}

        {/* ── Account actions — both owner & staff ────────────────────────── */}
        <View className="px-5">
          <Text className="text-secondaryText text-[10px] font-black uppercase tracking-widest mb-2 ml-0.5">
            Account
          </Text>
          <View
            className="bg-white rounded-[22px] border border-card overflow-hidden"
            style={{
              shadowColor: "#c8c0b4",
              shadowOpacity: 0.1,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 3 },
              elevation: 2,
            }}
          >
            <TouchableOpacity
              onPress={handleLogout}
              activeOpacity={0.7}
              className="flex-row items-center px-4 py-3.5"
            >
              <View className="w-9 h-9 bg-card rounded-xl items-center justify-center mr-4">
                <Feather name="log-out" size={15} color="#393f35" />
              </View>
              <Text className="text-primaryText font-bold text-[14px] flex-1">
                Log Out
              </Text>
              <Feather name="chevron-right" size={15} color="#c8c0b4" />
            </TouchableOpacity>
            {!isStaff && (
              <>
                <Sep />
                <TouchableOpacity
                  onPress={handleDeleteAccount}
                  activeOpacity={0.7}
                  className="flex-row items-center px-4 py-3.5"
                >
                  <View className="w-9 h-9 bg-red-50 rounded-xl items-center justify-center mr-4">
                    <Feather name="trash-2" size={15} color="#ef4444" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-red-500 font-bold text-[14px]">
                      Delete Account
                    </Text>
                    <Text className="text-secondaryText text-[10px] font-bold mt-0.5">
                      Permanently removes your shop & data
                    </Text>
                  </View>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useProfile } from '@/src/hooks/useProfile';

// ── Shared atoms ──────────────────────────────────────────────────────────────

const Field = ({ label, ...rest }) => (
  <View className="mb-4">
    <Text className="text-secondaryText text-[9px] font-black uppercase tracking-widest mb-1.5 ml-1">{label}</Text>
    <TextInput
      placeholderTextColor="#bfb5a8"
      className="bg-bg border border-card rounded-2xl px-4 py-4 text-primaryText font-bold"
      {...rest}
    />
  </View>
);

const Sheet = ({ visible, onClose, title, children }) => (
  <Modal visible={visible} transparent animationType="slide">
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 justify-end"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
    >
      <View className="bg-bg rounded-t-[44px] px-6 pt-5 pb-4">
        <View className="w-10 h-1 bg-card rounded-full self-center mb-5" />
        <View className="flex-row items-center justify-between mb-5">
          <Text className="text-primaryText text-xl font-black">{title}</Text>
          <TouchableOpacity onPress={onClose} className="bg-card w-9 h-9 rounded-full items-center justify-center">
            <Feather name="x" size={17} color="#1f2617" />
          </TouchableOpacity>
        </View>
        {children}
      </View>
    </KeyboardAvoidingView>
  </Modal>
);

// ── Screen ────────────────────────────────────────────────────────────────────
export default function AccountScreen() {
  const router = useRouter();
  const {
    profile, loading, isProcessing, isStaff,
    nameModalVisible, setNameModalVisible, openNameModal, handleUpdateName,
    editModalVisible, setEditModalVisible, editForm, setEditForm, openEditModal, handleUpdateProfile,
    pinModalVisible, setPinModalVisible, pinForm, setPinForm, handleSetPin,
  } = useProfile();

  const [nameInput, setNameInput] = useState('');

  if (loading || !profile) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator size="large" color="#1f2617" />
      </SafeAreaView>
    );
  }

  const initials = profile.name?.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?';
  const rawExpiry = profile.expiryDate || profile.subscription?.end_date;
  const expiryStr = rawExpiry
    ? new Date(rawExpiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;

  return (
    <SafeAreaView className="flex-1 bg-bg">

      {/* ── Header with back arrow ──────────────────────────────────────────── */}
      <View className="flex-row items-center px-5 pt-4 pb-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-card w-10 h-10 rounded-2xl items-center justify-center mr-4"
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={18} color="#1f2617" />
        </TouchableOpacity>
        <View>
          <Text className="text-primaryText text-xl font-black tracking-tight">My Account</Text>
          <Text className="text-secondaryText text-[10px] font-bold mt-0.5">
            {isStaff ? 'Staff profile' : 'Personal & business info'}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60, paddingTop: 8 }}
      >

        {/* ── Hero identity card ───────────────────────────────────────────── */}
        <View className="px-5 mb-5">
          <View
            className="bg-primaryText rounded-[28px] overflow-hidden"
            style={{ shadowColor: '#1f2617', shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 8 }}
          >
            {/* Decorative accent stripe */}
            <View className="h-1 bg-accent w-full" />

            <View className="px-5 pt-5 pb-6">
              {/* Top row — avatar + actions */}
              <View className="flex-row items-start justify-between mb-4">
                {/* Avatar */}
                <View className="bg-accent w-[68px] h-[68px] rounded-2xl items-center justify-center"
                  style={{ shadowColor: '#e5fc01', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 }}
                >
                  <Text className="text-primaryText font-black text-2xl">{initials}</Text>
                </View>

                {/* Edit name + plan badge stacked */}
                <View className="items-end gap-2">
                  {!isStaff && (
                    <TouchableOpacity
                      onPress={() => { setNameInput(profile.name || ''); openNameModal(); }}
                      className="bg-white/10 border border-white/10 flex-row items-center px-3 py-1.5 rounded-xl"
                    >
                      <Feather name="edit-2" size={11} color="#e5fc01" />
                      <Text className="text-accent font-black text-[10px] uppercase tracking-widest ml-1.5">Edit Name</Text>
                    </TouchableOpacity>
                  )}
                  <View className={`px-3 py-1.5 rounded-xl border flex-row items-center gap-1.5 ${
                    isStaff
                      ? profile.status === 'Suspended' ? 'bg-red-500/20 border-red-400/30' : 'bg-white/10 border-white/10'
                      : profile.isPremium ? 'bg-amber-400/20 border-amber-400/30' : 'bg-white/10 border-white/10'
                  }`}>
                    {!isStaff && (
                      <MaterialCommunityIcons
                        name={profile.isPremium ? 'crown' : 'rocket-launch-outline'}
                        size={11}
                        color={profile.isPremium ? '#fbbf24' : '#6b7280'}
                      />
                    )}
                    <Text className={`text-[10px] font-black uppercase tracking-widest ${
                      isStaff
                        ? profile.status === 'Suspended' ? 'text-red-400' : 'text-secondary'
                        : profile.isPremium ? 'text-amber-400' : 'text-secondary'
                    }`}>
                      {isStaff
                        ? profile.status === 'Suspended' ? 'Suspended' : 'Staff'
                        : profile.isPremium ? 'Premium' : 'Free'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Name */}
              <Text className="text-accent font-black text-[22px] leading-tight mb-1" numberOfLines={1}>
                {profile.name}
              </Text>
              {/* Email / phone */}
              <Text className="text-secondary text-[12px] font-bold opacity-55" numberOfLines={1}>
                {isStaff ? (profile.phone_number || 'Staff Member') : (profile.email || '')}
              </Text>

              {/* Stats strip (owner only) */}
              {!isStaff && (
                <View className="flex-row mt-5 pt-4 border-t border-white/10">
                  <View className="flex-1 items-center">
                    <Text className="text-secondary opacity-50 text-[9px] font-black uppercase tracking-widest">Plan</Text>
                    <Text className="text-accent font-black text-[13px] mt-0.5">
                      {profile.isPremium ? 'Premium' : 'Free'}
                    </Text>
                  </View>
                  <View className="w-px bg-white/10" />
                  <View className="flex-1 items-center">
                    <Text className="text-secondary opacity-50 text-[9px] font-black uppercase tracking-widest">Role</Text>
                    <Text className="text-accent font-black text-[13px] mt-0.5">Owner</Text>
                  </View>
                  {expiryStr && (
                    <>
                      <View className="w-px bg-white/10" />
                      <View className="flex-1 items-center">
                        <Text className="text-secondary opacity-50 text-[9px] font-black uppercase tracking-widest">Expires</Text>
                        <Text className="text-accent font-black text-[12px] mt-0.5">{expiryStr}</Text>
                      </View>
                    </>
                  )}
                </View>
              )}

              {/* Staff suspended warning */}
              {isStaff && profile.status === 'Suspended' && (
                <View className="mt-4 bg-red-500/20 border border-red-400/30 rounded-2xl px-4 py-3 flex-row items-center">
                  <Feather name="alert-triangle" size={14} color="#f87171" />
                  <Text className="text-red-400 font-bold text-[11px] ml-2">Account suspended — contact your manager</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ── Premium upgrade (owner, free) ────────────────────────────────── */}
        {!isStaff && !profile.isPremium && (
          <View className="px-5 mb-5">
            <TouchableOpacity
              onPress={() => router.push('/subscription')}
              activeOpacity={0.86}
              className="rounded-[22px] overflow-hidden"
              style={{ shadowColor: '#d97706', shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 }}
            >
              {/* Gradient-like layered background */}
              <View className="bg-amber-400 px-5 py-5">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-4">
                    <View className="flex-row items-center mb-1">
                      <MaterialCommunityIcons name="crown" size={16} color="#1c1107" />
                      <Text className="text-amber-900 font-black text-[11px] uppercase tracking-widest ml-1.5">Unlock Premium</Text>
                    </View>
                    <Text className="text-amber-900 font-black text-[18px] leading-tight">
                      Grow your shop faster
                    </Text>
                    <Text className="text-amber-800 text-[11px] font-bold mt-1 opacity-80">
                      Analytics · Staff management · Priority support
                    </Text>
                  </View>
                  <View className="bg-amber-900/20 border border-amber-900/20 w-10 h-10 rounded-2xl items-center justify-center flex-shrink-0">
                    <Feather name="arrow-right" size={18} color="#1c1107" />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Premium active (owner, paid) ─────────────────────────────────── */}
        {!isStaff && profile.isPremium && (
          <View className="px-5 mb-5">
            <View className="bg-white border border-amber-200 rounded-[22px] px-5 py-4 flex-row items-center"
              style={{ shadowColor: '#d97706', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}
            >
              <View className="bg-amber-50 w-11 h-11 rounded-2xl items-center justify-center mr-4 flex-shrink-0">
                <MaterialCommunityIcons name="crown" size={20} color="#d97706" />
              </View>
              <View className="flex-1">
                <Text className="text-primaryText font-black text-[15px]">Premium Active</Text>
                <Text className="text-secondaryText text-[11px] font-bold mt-0.5">
                  {expiryStr ? `Valid till ${expiryStr}` : 'All features unlocked'}
                </Text>
              </View>
              <View className="bg-green-50 border border-green-200 px-2.5 py-1 rounded-xl">
                <Text className="text-green-600 font-black text-[9px] uppercase tracking-widest">Active</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Business details (owner) ─────────────────────────────────────── */}
        {!isStaff && (
          <View className="px-5 mb-5">
            <View className="flex-row items-center justify-between mb-2.5">
              <Text className="text-secondaryText text-[10px] font-black uppercase tracking-widest ml-0.5">Business Details</Text>
              <TouchableOpacity
                onPress={openEditModal}
                className="flex-row items-center bg-primaryText px-3 py-1.5 rounded-xl"
              >
                <Feather name="edit-2" size={11} color="#e5fc01" />
                <Text className="text-accent font-black text-[10px] uppercase tracking-widest ml-1.5">Edit</Text>
              </TouchableOpacity>
            </View>
            <View
              className="bg-white rounded-[22px] border border-card overflow-hidden"
              style={{ shadowColor: '#c8c0b4', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 }}
            >
              {[
                { icon: 'briefcase', label: 'Shop Name',  value: profile.business_name },
                { icon: 'mail',      label: 'Email',      value: profile.email },
                { icon: 'phone',     label: 'Phone',      value: profile.phone_number },
                { icon: 'map-pin',   label: 'Address',    value: profile.address },
              ].map(({ icon, label, value }, i, arr) => (
                <View key={label}>
                  <View className="flex-row items-center px-4 py-3.5">
                    <View className="w-8 h-8 bg-bg rounded-xl items-center justify-center mr-3 flex-shrink-0">
                      <Feather name={icon} size={14} color="#393f35" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-secondaryText text-[9px] font-black uppercase tracking-widest">{label}</Text>
                      <Text className="text-primaryText font-bold text-[14px] mt-0.5 leading-snug">{value || '—'}</Text>
                    </View>
                  </View>
                  {i < arr.length - 1 && <View className="h-px bg-card/60 ml-[56px]" />}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Owner PIN (owner only) ───────────────────────────────────────── */}
        {!isStaff && (
          <View className="px-5 mb-5">
            <Text className="text-secondaryText text-[10px] font-black uppercase tracking-widest mb-2.5 ml-0.5">Security</Text>
            <TouchableOpacity
              onPress={() => setPinModalVisible(true)}
              activeOpacity={0.8}
              className="bg-primaryText rounded-[22px] px-5 py-4 flex-row items-center"
              style={{ shadowColor: '#1f2617', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 }}
            >
              <View className="bg-accent/20 w-10 h-10 rounded-2xl items-center justify-center mr-4 flex-shrink-0">
                <Feather name="lock" size={16} color="#e5fc01" />
              </View>
              <View className="flex-1">
                <Text className="text-accent font-black text-[14px]">Owner PIN</Text>
                <Text className="text-secondary text-[10px] font-bold opacity-60 mt-0.5">
                  Protects profit view & sensitive data
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color="#bfb5a8" />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Staff account info ───────────────────────────────────────────── */}
        {isStaff && (
          <View className="px-5 mb-5">
            <Text className="text-secondaryText text-[10px] font-black uppercase tracking-widest mb-2.5 ml-0.5">Account Info</Text>
            <View
              className="bg-white rounded-[22px] border border-card overflow-hidden"
              style={{ shadowColor: '#c8c0b4', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 }}
            >
              {[
                { icon: 'phone',    label: 'Phone / Employee ID', value: profile.phone_number },
                { icon: 'activity', label: 'Status', value: profile.status === 'Suspended' ? '⚠ Suspended' : '✓ Active' },
              ].map(({ icon, label, value }, i, arr) => (
                <View key={label}>
                  <View className="flex-row items-center px-4 py-3.5">
                    <View className="w-8 h-8 bg-bg rounded-xl items-center justify-center mr-3 flex-shrink-0">
                      <Feather name={icon} size={14} color="#393f35" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-secondaryText text-[9px] font-black uppercase tracking-widest">{label}</Text>
                      <Text className="text-primaryText font-bold text-[14px] mt-0.5">{value || '—'}</Text>
                    </View>
                  </View>
                  {i < arr.length - 1 && <View className="h-px bg-card/60 ml-[56px]" />}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Staff permissions grid ───────────────────────────────────────── */}
        {isStaff && profile.permissions && (
          <View className="px-5 mb-4">
            <Text className="text-secondaryText text-[10px] font-black uppercase tracking-widest mb-2.5 ml-0.5">Your Access Level</Text>
            <View
              className="bg-white rounded-[22px] border border-card p-4"
              style={{ shadowColor: '#c8c0b4', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 }}
            >
              <View className="flex-row flex-wrap justify-between">
                {Object.entries(profile.permissions).map(([mod, perms]) => {
                  const { read, create, update, delete: del } = perms || {};
                  let label = 'No Access', color = 'text-red-400', bg = 'bg-red-50 border-red-100';
                  if (read && create && update && del) { label = 'Full Access'; color = 'text-green-600'; bg = 'bg-green-50 border-green-100'; }
                  else if (read && create)             { label = 'Standard';    color = 'text-blue-600';  bg = 'bg-blue-50 border-blue-100'; }
                  else if (read)                       { label = 'View Only';   color = 'text-amber-600'; bg = 'bg-amber-50 border-amber-100'; }
                  return (
                    <View key={mod} className={`w-[48%] mb-3 rounded-2xl border px-3 py-3 ${bg}`}>
                      <Text className="text-primaryText font-black text-[11px] uppercase tracking-widest">{mod}</Text>
                      <Text className={`font-black text-[10px] uppercase tracking-widest mt-1.5 ${color}`}>{label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}

      </ScrollView>

      {/* ── Name edit sheet ──────────────────────────────────────────────────── */}
      {!isStaff && (
        <>
          <Sheet visible={nameModalVisible} onClose={() => setNameModalVisible(false)} title="Edit Name">
            <Field label="Your Name" value={nameInput} onChangeText={setNameInput}
              placeholder="e.g. Rahul Sharma" autoFocus returnKeyType="done"
            />
            <TouchableOpacity onPress={() => handleUpdateName(nameInput)} disabled={isProcessing}
              className="bg-primaryText py-5 rounded-[22px] items-center mb-8 mt-1"
            >
              {isProcessing ? <ActivityIndicator color="#e5fc01" />
                : <Text className="text-accent font-black text-[14px] uppercase tracking-widest">Save Name</Text>}
            </TouchableOpacity>
          </Sheet>

          {/* ── Business edit sheet ────────────────────────────────────────── */}
          <Sheet visible={editModalVisible} onClose={() => setEditModalVisible(false)} title="Edit Business">
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              <Field label="Shop Name *" value={editForm.business_name} onChangeText={v => setEditForm({ ...editForm, business_name: v })} placeholder="e.g. Sharma Hardware" autoFocus />
              <Field label="Phone Number" value={editForm.phone_number} onChangeText={v => setEditForm({ ...editForm, phone_number: v })} keyboardType="phone-pad" placeholder="10-digit number" />
              <Field label="Address" value={editForm.address} onChangeText={v => setEditForm({ ...editForm, address: v })} placeholder="Full shop address" multiline numberOfLines={2} style={{ textAlignVertical: 'top', minHeight: 72 }} />
              <TouchableOpacity onPress={handleUpdateProfile} disabled={isProcessing}
                className="bg-primaryText py-5 rounded-[22px] items-center mb-10 mt-1"
              >
                {isProcessing ? <ActivityIndicator color="#e5fc01" />
                  : <Text className="text-accent font-black text-[14px] uppercase tracking-widest">Save Details</Text>}
              </TouchableOpacity>
            </ScrollView>
          </Sheet>

          {/* ── PIN modal ──────────────────────────────────────────────────── */}
          <Modal visible={pinModalVisible} transparent animationType="fade">
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              className="flex-1 justify-center px-8"
              style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
            >
              <View className="bg-bg rounded-[40px] p-8 items-center"
                style={{ shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 30, shadowOffset: { width: 0, height: 10 }, elevation: 20 }}
              >
                <View className="bg-primaryText w-16 h-16 rounded-2xl items-center justify-center mb-5"
                  style={{ shadowColor: '#1f2617', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 }}
                >
                  <Feather name="lock" size={26} color="#e5fc01" />
                </View>
                <Text className="text-primaryText text-xl font-black mb-1">Set Owner PIN</Text>
                <Text className="text-secondaryText text-center text-xs font-bold mb-6">
                  4-digit PIN to protect profits & sensitive data
                </Text>
                <TextInput
                  autoFocus secureTextEntry keyboardType="numeric" maxLength={4}
                  value={pinForm.pin} onChangeText={v => setPinForm({ ...pinForm, pin: v })}
                  className="bg-card w-full p-5 rounded-2xl border border-card font-black text-2xl text-center tracking-[10px] mb-3"
                  placeholder="New PIN" placeholderTextColor="#bfb5a8"
                />
                <TextInput
                  secureTextEntry keyboardType="numeric" maxLength={4}
                  value={pinForm.confirmPin} onChangeText={v => setPinForm({ ...pinForm, confirmPin: v })}
                  className="bg-card w-full p-5 rounded-2xl border border-card font-black text-2xl text-center tracking-[10px] mb-7"
                  placeholder="Confirm PIN" placeholderTextColor="#bfb5a8"
                />
                <View className="flex-row gap-3 w-full">
                  <TouchableOpacity onPress={() => { setPinModalVisible(false); setPinForm({ pin: '', confirmPin: '' }); }}
                    className="flex-1 bg-card py-4 rounded-2xl items-center"
                  >
                    <Text className="text-primaryText font-bold">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSetPin} disabled={isProcessing}
                    className="flex-[1.5] bg-primaryText py-4 rounded-2xl items-center"
                  >
                    {isProcessing ? <ActivityIndicator color="#e5fc01" />
                      : <Text className="text-accent font-black uppercase tracking-widest">Set PIN</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </Modal>
        </>
      )}
    </SafeAreaView>
  );
}
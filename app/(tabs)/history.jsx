import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useHistory } from '@/src/hooks/useHistory';
import { BillCard } from '@/src/components/history/BillCard';
import { SearchBar } from '@/src/components/ui/SearchBar';


// ── helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => {
  if (!n) return '₹0';
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
};

const SummaryDivider = () => <View className="w-px bg-white/15 self-stretch mx-1" />;

// ── filter configs ────────────────────────────────────────────────────────────
const DATE_FILTERS = [
  { key: 'all',    label: 'All' },
  { key: 'today',  label: 'Today' },
  { key: 'week',   label: '7 Days' },
  { key: 'month',  label: 'Month' },
  { key: 'year',   label: 'Year' },
  { key: 'custom', label: 'Custom', icon: 'calendar' },
];

const PAY_FILTERS = [
  { key: 'all',            label: 'All',     activeBg: 'bg-primaryText',  activeText: 'text-accent',    dot: null },
  { key: 'Paid',           label: 'Paid',    activeBg: 'bg-green-600',    activeText: 'text-white',     dot: 'bg-green-500' },
  { key: 'Partially',      label: 'Partial', activeBg: 'bg-orange-500',   activeText: 'text-white',     dot: 'bg-orange-400' },
  { key: 'Unpaid',         label: 'Unpaid',  activeBg: 'bg-red-500',      activeText: 'text-white',     dot: 'bg-red-400' },
];

// ── screen ────────────────────────────────────────────────────────────────────
export default function HistoryScreen() {
  const {
    activeTab, setActiveTab,
    searchTerm, setSearchTerm,
    dateFilter, setDateFilter,
    paymentFilter, setPaymentFilter,
    customRange, applyCustomRange,
    filteredData, summary, loading,
    refresh,
  } = useHistory();

  const [showDateModal, setShowDateModal] = useState(false);
  const [tempStart, setTempStart]         = useState(new Date());
  const [tempEnd, setTempEnd]             = useState(new Date());
  const [activePicker, setActivePicker]   = useState(Platform.OS === 'ios' ? 'start' : null);

  const onDateChange = (_, date) => {
    if (Platform.OS === 'android') setActivePicker(null);
    if (date) activePicker === 'start' ? setTempStart(date) : setTempEnd(date);
  };

  const applyCustom = () => {
    applyCustomRange(tempStart, tempEnd);
    setShowDateModal(false);
  };

  const hasActiveFilter = dateFilter !== 'all' || paymentFilter !== 'all' || searchTerm.length > 0;

  const dateLabel = dateFilter === 'custom' && customRange?.start
    ? `${new Date(customRange.start).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} – ${new Date(customRange.end).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}`
    : DATE_FILTERS.find(f => f.key === dateFilter)?.label || 'All Time';

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['bottom']}>

      {/* 1. Reusable Search Bar */}
      <SearchBar 
        value={searchTerm} 
        onChangeText={setSearchTerm} 
        placeholder="Search customer or bill number" 
      />

      {/* ── Bills / Estimates tab toggle ──────────────────────────────────── */}
      <View className="mx-5 mb-3 mt-1">
        <View className="bg-card/50 border border-card rounded-2xl flex-row p-1">
          {['Bills', 'Estimates'].map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => { setActiveTab(tab); setPaymentFilter('all'); }}
              activeOpacity={0.8}
              className={`flex-1 py-2.5 rounded-xl items-center ${activeTab === tab ? 'bg-primaryText' : ''}`}
            >
              <Text className={`font-black text-[12px] uppercase tracking-widest ${activeTab === tab ? 'text-accent' : 'text-secondaryText'}`}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* ── Date filter pills ─────────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8, gap: 8 }}
      >
        {DATE_FILTERS.map(f => {
          const active = dateFilter === f.key;
          const showRange = f.key === 'custom' && dateFilter === 'custom' && customRange?.start;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => f.key === 'custom' ? setShowDateModal(true) : setDateFilter(f.key)}
              activeOpacity={0.75}
              className={`px-4 py-2 rounded-2xl border flex-1 justify-center items-center ${active ? 'bg-primaryText border-primaryText' : 'bg-white border-card'}`}
              style={{ gap: 5 }}
            >
              {f.icon && <Feather name={f.icon} size={11} color={active ? '#e5fc01' : '#bfb5a8'} />}
              <Text className={`font-black text-[12px]  ${active ? 'text-accent' : 'text-secondaryText'}`}>
                {showRange
                  ? `${new Date(customRange.start).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} – ${new Date(customRange.end).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`
                  : f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Payment status pills (bills only) ────────────────────────────── */}
      {/* {activeTab === 'Bills' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 10, gap: 8 }}
        >
          {PAY_FILTERS.map(f => {
            const active = paymentFilter === f.key;
            const countMap = {
              all:             summary.count,
              Paid:            summary.paidCount,
              Partial:         summary.partialCount,
              Unpaid:          summary.unpaidCount,
            };
            const cnt = countMap[f.key];
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setPaymentFilter(f.key)}
                activeOpacity={0.75}
                className={`flex-row items-center px-3.5 py-1.5 rounded-2xl border ${active ? `${f.activeBg} border-transparent` : 'bg-white border-card'}`}
                style={{ gap: 5 }}
              >
                {f.dot && <View className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-white' : f.dot}`} />}
                <Text className={`font-black text-[12px] ${active ? f.activeText : 'text-secondaryText'}`}>
                  {f.label}
                </Text>
                {cnt != null && (
                  <View className={`rounded-full px-1.5 py-0.5 ${active ? 'bg-white/25' : 'bg-card'}`}>
                    <Text className={`text-[9px] font-black ${active ? 'text-white' : 'text-secondaryText'}`}>
                      {cnt}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )} */}

      {/* ── Summary strip ─────────────────────────────────────────────────── */}
      {/* {!loading && summary.count > 0 && (
        <View className="mx-5 mb-3">
          <View
            className="bg-primaryText rounded-[18px] px-4 py-3 flex-row items-center"
            style={{ shadowColor: '#1f2617', shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4 }}
          >
            <View className="flex-1 items-center">
              <Text className="text-secondary text-[8px] font-black uppercase tracking-widest opacity-40 mb-0.5">
                {activeTab === 'Estimates' ? 'Est. Value' : 'Billed'}
              </Text>
              <Text className="text-accent font-black text-[15px]">{fmt(summary.total)}</Text>
            </View>
            {activeTab === 'Bills' && (
              <>
                <SummaryDivider />
                <View className="flex-1 items-center">
                  <Text className="text-secondary text-[8px] font-black uppercase tracking-widest opacity-40 mb-0.5">Collected</Text>
                  <Text className="text-green-400 font-black text-[15px]">{fmt(summary.collected)}</Text>
                </View>
                <SummaryDivider />
                <View className="flex-1 items-center">
                  <Text className="text-secondary text-[8px] font-black uppercase tracking-widest opacity-40 mb-0.5">Udhaar</Text>
                  <Text className={`font-black text-[15px] ${summary.udhaar > 0 ? 'text-red-400' : 'text-secondary opacity-40'}`}>
                    {fmt(summary.udhaar)}
                  </Text>
                </View>
                <SummaryDivider />
                <View className="flex-1 items-center">
                  <Text className="text-secondary text-[8px] font-black uppercase tracking-widest opacity-40 mb-0.5">Bills</Text>
                  <Text className="text-accent font-black text-[15px]">{summary.count}</Text>
                </View>
              </>
            )}
            {activeTab === 'Estimates' && (
              <>
                <SummaryDivider />
                <View className="flex-1 items-center">
                  <Text className="text-secondary text-[8px] font-black uppercase tracking-widest opacity-40 mb-0.5">Count</Text>
                  <Text className="text-accent font-black text-[15px]">{summary.count}</Text>
                </View>
              </>
            )}
          </View>
        </View>
      )} */}

      {/* ── Bill list ─────────────────────────────────────────────────────── */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1f2617" />
          <Text className="text-secondaryText text-[10px] font-black uppercase tracking-widest mt-4 opacity-40">
            Loading…
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}
        >
          {filteredData.length === 0 ? (
            <View className="items-center pt-16 opacity-30">
              <Feather name="file-text" size={44} color="#393f35" />
              <Text className="text-primaryText font-bold mt-3 text-[14px]">
                No {activeTab.toLowerCase()} found
              </Text>
              {hasActiveFilter && (
                <TouchableOpacity
                  onPress={() => { setDateFilter('all'); setPaymentFilter('all'); setSearchTerm(''); }}
                  className="mt-4 px-4 py-2 bg-card rounded-xl"
                >
                  <Text className="text-secondaryText font-black text-[11px] uppercase tracking-widest">
                    Clear Filters
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredData.map(bill => <BillCard key={bill._id} bill={bill} />)
          )}
        </ScrollView>
      )}

      {/* ── Custom date range modal ───────────────────────────────────────── */}
      <Modal visible={showDateModal} transparent animationType="slide">
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <View className="bg-bg rounded-t-[44px] px-6 pt-5 pb-4">
            <View className="w-10 h-1 bg-card rounded-full self-center mb-5" />
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-primaryText text-xl font-black">Custom Range</Text>
              <TouchableOpacity
                onPress={() => setShowDateModal(false)}
                className="bg-card w-9 h-9 rounded-full items-center justify-center"
              >
                <Feather name="x" size={17} color="#1f2617" />
              </TouchableOpacity>
            </View>

            {/* From / To selectors */}
            <View className="flex-row mb-4" style={{ gap: 10 }}>
              {['start', 'end'].map(side => (
                <TouchableOpacity
                  key={side}
                  onPress={() => setActivePicker(side)}
                  activeOpacity={0.75}
                  className={`flex-1 rounded-2xl border px-4 py-3.5 ${activePicker === side ? 'border-primaryText bg-primaryText/5' : 'border-card bg-white'}`}
                >
                  <Text className="text-secondaryText text-[9px] font-black uppercase tracking-widest mb-1">
                    {side === 'start' ? 'From' : 'To'}
                  </Text>
                  <Text className="text-primaryText font-black text-[14px]">
                    {(side === 'start' ? tempStart : tempEnd).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {activePicker && (
              <View className={`bg-white rounded-[22px] mb-4 overflow-hidden border border-card ${Platform.OS === 'ios' ? 'p-2' : ''}`}>
                <DateTimePicker
                  value={activePicker === 'start' ? tempStart : tempEnd}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={onDateChange}
                  maximumDate={new Date()}
                  themeVariant="light"
                />
              </View>
            )}

            <TouchableOpacity
              onPress={applyCustom}
              className="bg-primaryText py-5 rounded-[22px] items-center mt-1 mb-6"
            >
              <Text className="text-accent font-black uppercase tracking-widest">Apply Filter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
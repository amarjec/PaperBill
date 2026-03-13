import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, Platform, Pressable,
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

const SummaryDivider = () => <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'stretch', marginHorizontal: 4 }} />;

// ── filter configs ────────────────────────────────────────────────────────────
const DATE_FILTERS = [
  { key: 'all',    label: 'All Time' },
  { key: 'today',  label: 'Today' },
  { key: 'week',   label: 'Last 7 Days' },
  { key: 'month',  label: 'This Month' },
  { key: 'year',   label: 'This Year' },
  { key: 'custom', label: 'Custom Range', icon: 'calendar' },
];

const PAY_FILTERS = [
  { key: 'all',     label: 'All',     dot: null,          activeColor: '#1f2617',  activeDot: null },
  { key: 'Paid',    label: 'Paid',    dot: '#22c55e',     activeColor: '#16a34a',  activeDot: '#4ade80' },
  { key: 'Partial', label: 'Partial', dot: '#f97316',     activeColor: '#ea580c',  activeDot: '#fb923c' },
  { key: 'Unpaid',  label: 'Unpaid',  dot: '#ef4444',     activeColor: '#dc2626',  activeDot: '#f87171' },
];

// ── Filter summary label (shown on the chip) ──────────────────────────────────
function buildFilterLabel(dateFilter, paymentFilter, customRange, activeTab) {
  const parts = [];

  if (dateFilter === 'custom' && customRange?.start) {
    const s = new Date(customRange.start).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    const e = new Date(customRange.end).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    parts.push(`${s} – ${e}`);
  } else if (dateFilter !== 'all') {
    parts.push(DATE_FILTERS.find(f => f.key === dateFilter)?.label || '');
  }

  if (activeTab === 'Bills' && paymentFilter !== 'all') {
    parts.push(paymentFilter);
  }

  if (parts.length === 0) return 'All Filters';
  return parts.join(' · ');
}

// ── Section header inside modal ───────────────────────────────────────────────
function ModalSection({ title, children }) {
  return (
    <View style={{ marginBottom: 22 }}>
      <Text style={{ fontSize: 10, fontWeight: '800', color: '#a8a29e', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

// ── Pill row (reusable inside modal) ─────────────────────────────────────────
function PillRow({ options, value, onChange, showDots = false }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map(opt => {
        const active = value === opt.key;
        return (
          <TouchableOpacity
            key={opt.key}
            onPress={() => onChange(opt.key)}
            activeOpacity={0.75}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 14,
              paddingVertical: 9,
              borderRadius: 20,
              borderWidth: 1.5,
              gap: 6,
              backgroundColor: active ? '#1f2617' : '#ffffff',
              borderColor: active ? '#1f2617' : '#e7e5e4',
            }}
          >
            {showDots && opt.dot && (
              <View style={{
                width: 7, height: 7, borderRadius: 4,
                backgroundColor: active ? (opt.activeDot || '#e5fc01') : opt.dot,
              }} />
            )}
            {opt.icon && (
              <Feather name={opt.icon} size={12} color={active ? '#e5fc01' : '#a8a29e'} />
            )}
            <Text style={{
              fontSize: 12,
              fontWeight: '800',
              color: active ? '#e5fc01' : '#44403c',
            }}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
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

  // Filter modal state
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Custom date range (within filter modal)
  const [showDatePicker, setShowDatePicker]   = useState(false);
  const [tempStart, setTempStart]             = useState(new Date());
  const [tempEnd, setTempEnd]                 = useState(new Date());
  const [activePicker, setActivePicker]       = useState(Platform.OS === 'ios' ? 'start' : null);

  // Local filter state (applied on confirm, not live)
  const [localDate, setLocalDate]       = useState(dateFilter);
  const [localPayment, setLocalPayment] = useState(paymentFilter);

  const openFilterModal = () => {
    // Sync local state with current filters when opening
    setLocalDate(dateFilter);
    setLocalPayment(paymentFilter);
    setShowDatePicker(false);
    setActivePicker(Platform.OS === 'ios' ? 'start' : null);
    if (customRange?.start) {
      setTempStart(new Date(customRange.start));
      setTempEnd(new Date(customRange.end));
    } else {
      setTempStart(new Date());
      setTempEnd(new Date());
    }
    setShowFilterModal(true);
  };

  const applyFilters = () => {
    if (localDate === 'custom') {
      applyCustomRange(tempStart, tempEnd);
    } else {
      setDateFilter(localDate);
    }
    setPaymentFilter(localPayment);
    setShowFilterModal(false);
  };

  const clearFilters = () => {
    setLocalDate('all');
    setLocalPayment('all');
    setDateFilter('all');
    setPaymentFilter('all');
    setShowFilterModal(false);
  };

  const onDateChange = (_, date) => {
    if (Platform.OS === 'android') setActivePicker(null);
    if (date) activePicker === 'start' ? setTempStart(date) : setTempEnd(date);
  };

  const hasActiveFilter = dateFilter !== 'all' || paymentFilter !== 'all';
  const filterLabel     = buildFilterLabel(dateFilter, paymentFilter, customRange, activeTab);
  const activeFilterCount = (dateFilter !== 'all' ? 1 : 0) + (activeTab === 'Bills' && paymentFilter !== 'all' ? 1 : 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f4f0' }} edges={['bottom']}>

      {/* ── Search bar ────────────────────────────────────────────── */}
      <SearchBar
        value={searchTerm}
        onChangeText={setSearchTerm}
        placeholder="Search customer or bill number"
      />

      {/* ── Tab toggle + Filter chip row ──────────────────────────── */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 10, paddingTop: 4, flexDirection: 'row', gap: 10, alignItems: 'center' }}>

        {/* Bills / Estimates tab toggle */}
        <View style={{ flex: 1, backgroundColor: 'rgba(31,38,23,0.06)', borderRadius: 16, flexDirection: 'row', padding: 3 }}>
          {['Bills', 'Estimates'].map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => { setActiveTab(tab); setPaymentFilter('all'); setLocalPayment('all'); }}
              activeOpacity={0.8}
              style={{
                flex: 1, paddingVertical: 9, borderRadius: 13, alignItems: 'center',
                backgroundColor: activeTab === tab ? '#1f2617' : 'transparent',
              }}
            >
              <Text style={{
                fontWeight: '900', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5,
                color: activeTab === tab ? '#e5fc01' : '#78716c',
              }}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Filter chip */}
        <TouchableOpacity
          onPress={openFilterModal}
          activeOpacity={0.75}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 7,
            paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16,
            backgroundColor: hasActiveFilter ? '#1f2617' : '#ffffff',
            borderWidth: 1.5,
            borderColor: hasActiveFilter ? '#1f2617' : '#e7e5e4',
            // subtle shadow
            shadowColor: '#1f2617',
            shadowOpacity: hasActiveFilter ? 0.2 : 0.06,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: hasActiveFilter ? 4 : 1,
          }}
        >
          <Feather name="sliders" size={13} color={hasActiveFilter ? '#e5fc01' : '#78716c'} />
          <Text style={{
            fontSize: 11, fontWeight: '800',
            color: hasActiveFilter ? '#e5fc01' : '#44403c',
            maxWidth: 90,
          }}
            numberOfLines={1}
          >
            {filterLabel}
          </Text>
          {activeFilterCount > 0 && (
            <View style={{
              backgroundColor: '#e5fc01', borderRadius: 10,
              width: 16, height: 16, alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 9, fontWeight: '900', color: '#1f2617' }}>
                {activeFilterCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Summary strip ─────────────────────────────────────────── */}
      {/* {!loading && summary.count > 0 && (
        <View style={{ marginHorizontal: 20, marginBottom: 10 }}>
          <View style={{
            backgroundColor: '#1f2617', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12,
            flexDirection: 'row', alignItems: 'center',
            shadowColor: '#1f2617', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4,
          }}>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ color: 'rgba(229,252,1,0.45)', fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 2 }}>
                {activeTab === 'Estimates' ? 'Est. Value' : 'Billed'}
              </Text>
              <Text style={{ color: '#e5fc01', fontWeight: '900', fontSize: 14 }}>{fmt(summary.total)}</Text>
            </View>
            {activeTab === 'Bills' && (
              <>
                <SummaryDivider />
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ color: 'rgba(229,252,1,0.45)', fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 2 }}>Collected</Text>
                  <Text style={{ color: '#4ade80', fontWeight: '900', fontSize: 14 }}>{fmt(summary.collected)}</Text>
                </View>
                <SummaryDivider />
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ color: 'rgba(229,252,1,0.45)', fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 2 }}>Udhaar</Text>
                  <Text style={{ color: summary.udhaar > 0 ? '#f87171' : 'rgba(229,252,1,0.3)', fontWeight: '900', fontSize: 14 }}>
                    {fmt(summary.udhaar)}
                  </Text>
                </View>
                <SummaryDivider />
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ color: 'rgba(229,252,1,0.45)', fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 2 }}>Bills</Text>
                  <Text style={{ color: '#e5fc01', fontWeight: '900', fontSize: 14 }}>{summary.count}</Text>
                </View>
              </>
            )}
            {activeTab === 'Estimates' && (
              <>
                <SummaryDivider />
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ color: 'rgba(229,252,1,0.45)', fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 2 }}>Count</Text>
                  <Text style={{ color: '#e5fc01', fontWeight: '900', fontSize: 14 }}>{summary.count}</Text>
                </View>
              </>
            )}
          </View>
        </View>
      )} */}

      {/* ── Bill list ─────────────────────────────────────────────── */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#1f2617" />
          <Text style={{ color: '#a8a29e', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginTop: 14, opacity: 0.6 }}>
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
            <View style={{ alignItems: 'center', paddingTop: 64, opacity: 0.35 }}>
              <Feather name="file-text" size={44} color="#393f35" />
              <Text style={{ color: '#1f2617', fontWeight: '700', marginTop: 12, fontSize: 14 }}>
                No {activeTab.toLowerCase()} found
              </Text>
              {(hasActiveFilter || searchTerm.length > 0) && (
                <TouchableOpacity
                  onPress={() => { setDateFilter('all'); setPaymentFilter('all'); setSearchTerm(''); }}
                  style={{ marginTop: 14, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#e7e5e4', borderRadius: 12 }}
                >
                  <Text style={{ color: '#78716c', fontWeight: '800', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5 }}>
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

      {/* ══════════════════════════════════════════════════════════════
          FILTER MODAL
      ══════════════════════════════════════════════════════════════ */}
      <Modal visible={showFilterModal} transparent animationType="slide" onRequestClose={() => setShowFilterModal(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }}
          onPress={() => setShowFilterModal(false)}
        />
        <View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          backgroundColor: '#fafaf9',
          borderTopLeftRadius: 32, borderTopRightRadius: 32,
          paddingHorizontal: 24,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 36 : 24,
          // shadow
          shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: -4 }, elevation: 20,
        }}>
          {/* Handle */}
          <View style={{ width: 36, height: 4, backgroundColor: '#d6d3d1', borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />

          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <View>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#1c1917', letterSpacing: -0.3 }}>Filters</Text>
              {activeFilterCount > 0 && (
                <Text style={{ fontSize: 11, color: '#a8a29e', fontWeight: '600', marginTop: 1 }}>
                  {activeFilterCount} active filter{activeFilterCount > 1 ? 's' : ''}
                </Text>
              )}
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(localDate !== 'all' || localPayment !== 'all') && (
                <TouchableOpacity
                  onPress={() => { setLocalDate('all'); setLocalPayment('all'); }}
                  style={{ paddingHorizontal: 12, paddingVertical: 7, backgroundColor: '#fee2e2', borderRadius: 10 }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#dc2626' }}>Clear</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#e7e5e4', alignItems: 'center', justifyContent: 'center' }}
              >
                <Feather name="x" size={16} color="#1c1917" />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Date Range section ─────────────────────────────────── */}
          <ModalSection title="Date Range">
            <PillRow
              options={DATE_FILTERS.filter(f => f.key !== 'custom')}
              value={localDate}
              onChange={(key) => { setLocalDate(key); setShowDatePicker(false); }}
            />
            {/* Custom range trigger — separate row */}
            <TouchableOpacity
              onPress={() => { setLocalDate('custom'); setShowDatePicker(true); }}
              activeOpacity={0.75}
              style={{
                marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8,
                paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20,
                borderWidth: 1.5,
                backgroundColor: localDate === 'custom' ? '#1f2617' : '#ffffff',
                borderColor: localDate === 'custom' ? '#1f2617' : '#e7e5e4',
                alignSelf: 'flex-start',
              }}
            >
              <Feather name="calendar" size={13} color={localDate === 'custom' ? '#e5fc01' : '#a8a29e'} />
              <Text style={{ fontSize: 12, fontWeight: '800', color: localDate === 'custom' ? '#e5fc01' : '#44403c' }}>
                {localDate === 'custom' && customRange?.start
                  ? `${new Date(tempStart).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} – ${new Date(tempEnd).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`
                  : 'Custom Range'}
              </Text>
            </TouchableOpacity>

            {/* Date pickers (shown when custom selected) */}
            {localDate === 'custom' && showDatePicker && (
              <View style={{ marginTop: 12, backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: '#e7e5e4', overflow: 'hidden' }}>
                {/* From / To selector tabs */}
                <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e7e5e4' }}>
                  {['start', 'end'].map(side => (
                    <TouchableOpacity
                      key={side}
                      onPress={() => setActivePicker(side)}
                      style={{
                        flex: 1, paddingVertical: 12, alignItems: 'center',
                        borderBottomWidth: 2,
                        borderBottomColor: activePicker === side ? '#1f2617' : 'transparent',
                      }}
                    >
                      <Text style={{ fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, color: '#a8a29e', marginBottom: 2 }}>
                        {side === 'start' ? 'From' : 'To'}
                      </Text>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: activePicker === side ? '#1f2617' : '#78716c' }}>
                        {(side === 'start' ? tempStart : tempEnd).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {activePicker && (
                  <DateTimePicker
                    value={activePicker === 'start' ? tempStart : tempEnd}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    onChange={onDateChange}
                    maximumDate={new Date()}
                    themeVariant="light"
                  />
                )}
              </View>
            )}
          </ModalSection>

          {/* ── Payment Status section (Bills only) ───────────────── */}
          {activeTab === 'Bills' && (
            <ModalSection title="Payment Status">
              <PillRow
                options={PAY_FILTERS}
                value={localPayment}
                onChange={setLocalPayment}
                showDots
              />
            </ModalSection>
          )}

          {/* ── Apply button ───────────────────────────────────────── */}
          <TouchableOpacity
            onPress={applyFilters}
            activeOpacity={0.85}
            style={{
              backgroundColor: '#1f2617', borderRadius: 20,
              paddingVertical: 17, alignItems: 'center', marginTop: 4,
              shadowColor: '#1f2617', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
            }}
          >
            <Text style={{ color: '#e5fc01', fontWeight: '900', fontSize: 13, textTransform: 'uppercase', letterSpacing: 2 }}>
              Apply Filters
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
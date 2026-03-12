import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Pressable,
  ActivityIndicator, Dimensions, Modal, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LineChart } from 'react-native-gifted-charts';
import DateTimePicker from '@react-native-community/datetimepicker';
import PremiumLock from '@/src/components/PremiumLock';
import { useAnalytics } from '@/src/hooks/useAnalytics';
import { useRouter } from 'expo-router';

const SW = Dimensions.get('window').width;

// ── helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => {
  if (!n) return '₹0';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
};
const fmtFull = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

// ── atoms ─────────────────────────────────────────────────────────────────────
const Sep = () => (
  <View style={{ height: 1, backgroundColor: 'rgba(200,192,180,0.3)', marginHorizontal: 16 }} />
);

const SectionLabel = ({ children }) => (
  <Text style={{ color: '#a8a29e', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10, marginLeft: 2 }}>
    {children}
  </Text>
);

// ── metric card ───────────────────────────────────────────────────────────────
const MetricCard = ({ icon, iconColor, iconBg, label, value, sub, subColor }) => (
  <View style={{
    flex: 1, backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: '#ede9e3',
    paddingHorizontal: 16, paddingVertical: 16,
    shadowColor: '#c8c0b4', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  }}>
    <View style={{ width: 32, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: iconBg, marginBottom: 12 }}>
      <Feather name={icon} size={14} color={iconColor} />
    </View>
    <Text style={{ color: '#a8a29e', fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>{label}</Text>
    <Text style={{ color: '#1c1917', fontWeight: '900', fontSize: 17, lineHeight: 20 }}>{value}</Text>
    {sub && <Text style={{ fontSize: 10, fontWeight: '700', marginTop: 2, color: subColor || '#a8a29e' }}>{sub}</Text>}
  </View>
);

// ── rank helpers ──────────────────────────────────────────────────────────────
const rankBg   = ['#f59e0b', '#f5f4f0', '#f5f4f0'];
const rankText = ['#1c1917', '#a8a29e', '#a8a29e'];

// ── filter configs ────────────────────────────────────────────────────────────
const DATE_FILTERS = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'Last 7 Days' },
  { key: 'month', label: 'This Month' },
  { key: 'year',  label: 'This Year' },
  { key: 'custom', label: 'Custom Range', icon: 'calendar' },
];

function buildFilterLabel(filterType, customRange) {
  if (filterType === 'custom' && customRange?.start) {
    const s = new Date(customRange.start).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    const e = new Date(customRange.end).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    return `${s} – ${e}`;
  }
  return DATE_FILTERS.find(f => f.key === filterType)?.label || 'This Month';
}

// ── main screen ───────────────────────────────────────────────────────────────
export default function AnalyticsScreen() {
  const router = useRouter();
  const { data, loading, filterType, setFilterType, customRange, applyCustomRange } = useAnalytics();

  // Filter modal
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [localFilter, setLocalFilter]         = useState(filterType);

  // Custom date (inside modal)
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempStart, setTempStart]           = useState(new Date());
  const [tempEnd, setTempEnd]               = useState(new Date());
  const [activePicker, setActivePicker]     = useState(Platform.OS === 'ios' ? 'start' : null);

  const openFilterModal = () => {
    setLocalFilter(filterType);
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
    if (localFilter === 'custom') {
      applyCustomRange(tempStart, tempEnd);
    } else {
      setFilterType(localFilter);
    }
    setShowFilterModal(false);
  };

  const onDateChange = (_, date) => {
    if (Platform.OS === 'android') setActivePicker(null);
    if (date) activePicker === 'start' ? setTempStart(date) : setTempEnd(date);
  };

  // chart data
  const chartData = useMemo(() => {
    if (!data?.chartData?.length) return [];
    return data.chartData.map(item => {
      const d = new Date(item._id);
      return {
        value: item.dailySales,
        label: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        labelTextStyle: { color: '#bfb5a8', fontSize: 9, fontWeight: '700' },
      };
    });
  }, [data]);

  // metrics
  const summary        = data?.summary || {};
  const totalSales     = summary.totalSales  || 0;
  const totalBills     = summary.totalBills  || 0;
  const totalProfit    = summary.totalProfit || 0;
  const totalUdhaar    = summary.totalUdhaar || 0;
  const avgOrder       = totalBills > 0 ? Math.round(totalSales / totalBills) : 0;
  const marginPct      = totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : '0.0';
  const collectionRate = totalSales > 0 ? (((totalSales - totalUdhaar) / totalSales) * 100).toFixed(1) : '100.0';

  const topProducts  = data?.topProducts?.byProfit   || [];
  const topByQty     = data?.topProducts?.byQuantity || [];
  const topCustomers = data?.topCustomers            || [];

  const filterLabel  = buildFilterLabel(filterType, customRange);
  const isFiltered   = filterType !== 'month'; // 'month' is default

  return (
    <PremiumLock
      featureName="Advanced Analytics"
      description="Track your true profit, find your best-selling items, and visualize your shop's growth with real-time data."
      icon="chart-areaspline"
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f4f0' }}>

        {/* ── Header ──────────────────────────────────────────────── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, gap: 12 }}>

          {/* Back */}
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ede9e3' }}
          >
            <Feather name="arrow-left" size={18} color="#1f2617" />
          </TouchableOpacity>

          {/* Title */}
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#1c1917', fontSize: 20, fontWeight: '900', letterSpacing: -0.3 }}>Analytics</Text>
            <Text style={{ color: '#a8a29e', fontSize: 10, fontWeight: '700', marginTop: 1 }}>{filterLabel}</Text>
          </View>

          {/* Filter chip — replaces refresh button */}
          <TouchableOpacity
            onPress={openFilterModal}
            activeOpacity={0.75}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              paddingHorizontal: 14, paddingVertical: 10,
              borderRadius: 14,
              backgroundColor: isFiltered ? '#1f2617' : '#ffffff',
              borderWidth: 1.5,
              borderColor: isFiltered ? '#1f2617' : '#ede9e3',
              shadowColor: '#1f2617',
              shadowOpacity: isFiltered ? 0.2 : 0.05,
              shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: isFiltered ? 4 : 1,
            }}
          >
            <Feather name="sliders" size={13} color={isFiltered ? '#e5fc01' : '#78716c'} />
            <Text style={{
              fontSize: 11, fontWeight: '800',
              color: isFiltered ? '#e5fc01' : '#44403c',
              maxWidth: 80,
            }} numberOfLines={1}>
              {filterLabel}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Content ─────────────────────────────────────────────── */}
        {loading || !data ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color="#1f2617" />
            <Text style={{ color: '#a8a29e', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginTop: 14, opacity: 0.6 }}>
              Crunching numbers…
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>

            {/* Hero revenue card */}
            <View style={{
              backgroundColor: '#1f2617', borderRadius: 28, paddingHorizontal: 20, paddingVertical: 20, marginBottom: 16,
              shadowColor: '#1f2617', shadowOpacity: 0.28, shadowRadius: 16, shadowOffset: { width: 0, height: 7 }, elevation: 7,
            }}>
              <View style={{ height: 2, backgroundColor: '#e5fc01', borderRadius: 1, width: 40, marginBottom: 16 }} />
              <Text style={{ color: 'rgba(229,252,1,0.5)', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>
                Total Revenue
              </Text>
              <Text style={{ color: '#e5fc01', fontWeight: '900', fontSize: 40, lineHeight: 44, marginBottom: 4 }}>
                {fmt(totalSales)}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: '700' }}>
                {fmtFull(totalSales)}
              </Text>
            </View>

            {/* 2×2 metric grid */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <MetricCard icon="trending-up" iconBg="#f0fdf4" iconColor="#16a34a" label="Est. Profit" value={fmt(totalProfit)} sub={`${marginPct}% margin`} subColor="#16a34a" />
              <MetricCard icon="alert-circle" iconBg="#fef2f2" iconColor="#ef4444" label="New Udhaar" value={fmt(totalUdhaar)}
                sub={totalUdhaar > 0 ? `${(100 - parseFloat(collectionRate)).toFixed(1)}% uncollected` : 'All collected'}
                subColor={totalUdhaar > 0 ? '#ef4444' : '#16a34a'} />
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              <MetricCard icon="check-circle" iconBg="#eff6ff" iconColor="#2563eb" label="Collection Rate" value={`${collectionRate}%`} sub={`₹${(totalSales - totalUdhaar).toLocaleString('en-IN')} received`} subColor="#2563eb" />
              <MetricCard icon="shopping-bag" iconBg="#f5f3ff" iconColor="#7c3aed" label="Avg. Bill Value" value={fmt(avgOrder)} sub={`${totalBills} bills total`} subColor="#7c3aed" />
            </View>

            {/* Revenue trend chart */}
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <SectionLabel>Revenue Trend</SectionLabel>
                <Text style={{ color: '#a8a29e', fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.6 }}>Daily</Text>
              </View>
              <View style={{
                backgroundColor: '#ffffff', borderRadius: 22, borderWidth: 1, borderColor: '#ede9e3',
                paddingTop: 20, paddingBottom: 16, overflow: 'hidden',
                shadowColor: '#c8c0b4', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2,
              }}>
                {chartData.length > 0 ? (
                  <View style={{ alignItems: 'center' }}>
                    <LineChart
                      data={chartData}
                      width={SW - 80}
                      height={160}
                      spacing={chartData.length > 8 ? 38 : (SW - 80) / Math.max(chartData.length, 1)}
                      initialSpacing={12}
                      endSpacing={12}
                      color="#1f2617"
                      thickness={2.5}
                      startFillColor="#e5fc01"
                      endFillColor="#ffffff"
                      startOpacity={0.5}
                      endOpacity={0.02}
                      areaChart curved hideRules
                      yAxisColor="transparent"
                      xAxisColor="#f0ece6"
                      yAxisTextStyle={{ color: '#bfb5a8', fontSize: 9, fontWeight: '700' }}
                      formatYLabel={v => fmt(Number(v))}
                      dataPointsColor="#1f2617"
                      dataPointsRadius={3}
                    />
                  </View>
                ) : (
                  <View style={{ height: 160, alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                    <Feather name="bar-chart-2" size={30} color="#bfb5a8" />
                    <Text style={{ color: '#a8a29e', fontWeight: '700', fontSize: 11, marginTop: 8 }}>No sales data for this period</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Top by profit */}
            {topProducts.length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <SectionLabel>Top by Profit</SectionLabel>
                  <Text style={{ color: '#16a34a', fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5 }}>Est. Margin</Text>
                </View>
                <View style={{ backgroundColor: '#ffffff', borderRadius: 22, borderWidth: 1, borderColor: '#ede9e3', overflow: 'hidden', shadowColor: '#c8c0b4', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 }}>
                  {topProducts.map((item, i) => (
                    <View key={i}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
                        <View style={{ width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: rankBg[i] || '#f5f4f0', marginRight: 12, flexShrink: 0 }}>
                          <Text style={{ fontWeight: '900', fontSize: 11, color: rankText[i] || '#a8a29e' }}>{i + 1}</Text>
                        </View>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={{ color: '#1c1917', fontWeight: '700', fontSize: 13 }} numberOfLines={1}>{item._id}</Text>
                          <Text style={{ color: '#a8a29e', fontSize: 10, fontWeight: '700', marginTop: 2 }}>{item.qtySold} units · Rev {fmt(item.revenue)}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ color: '#a8a29e', fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>Profit</Text>
                          <Text style={{ color: '#16a34a', fontWeight: '900', fontSize: 14, marginTop: 2 }}>+{fmt(item.profit)}</Text>
                        </View>
                      </View>
                      {i < topProducts.length - 1 && <Sep />}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Top by quantity */}
            {topByQty.length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <SectionLabel>Top by Units Sold</SectionLabel>
                  <Text style={{ color: '#7c3aed', fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5 }}>Volume</Text>
                </View>
                <View style={{ backgroundColor: '#ffffff', borderRadius: 22, borderWidth: 1, borderColor: '#ede9e3', overflow: 'hidden', shadowColor: '#c8c0b4', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 }}>
                  {topByQty.map((item, i) => {
                    const maxQty = topByQty[0]?.qtySold || 1;
                    const barW   = Math.round((item.qtySold / maxQty) * 100);
                    return (
                      <View key={i}>
                        <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 12 }}>
                              <View style={{ width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: rankBg[i] || '#f5f4f0', marginRight: 12, flexShrink: 0 }}>
                                <Text style={{ fontWeight: '900', fontSize: 11, color: rankText[i] || '#a8a29e' }}>{i + 1}</Text>
                              </View>
                              <Text style={{ color: '#1c1917', fontWeight: '700', fontSize: 13, flex: 1 }} numberOfLines={1}>{item._id}</Text>
                            </View>
                            <Text style={{ color: '#7c3aed', fontWeight: '900', fontSize: 13 }}>
                              {item.qtySold} <Text style={{ color: '#a8a29e', fontWeight: '700', fontSize: 10 }}>units</Text>
                            </Text>
                          </View>
                          <View style={{ height: 6, backgroundColor: '#f0ece6', borderRadius: 3, marginLeft: 40, overflow: 'hidden' }}>
                            <View style={{ height: '100%', backgroundColor: '#a78bfa', borderRadius: 3, width: `${barW}%` }} />
                          </View>
                        </View>
                        {i < topByQty.length - 1 && <Sep />}
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Top customers */}
            {topCustomers.length > 0 && (
              <View style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <SectionLabel>Top Customers</SectionLabel>
                  <Text style={{ color: '#a8a29e', fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.6 }}>By Spend</Text>
                </View>
                <View style={{ backgroundColor: '#ffffff', borderRadius: 22, borderWidth: 1, borderColor: '#ede9e3', overflow: 'hidden', shadowColor: '#c8c0b4', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 }}>
                  {topCustomers.map((c, i) => {
                    const initials = c.name?.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?';
                    return (
                      <View key={c._id}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
                          <View style={{ width: 36, height: 36, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: i === 0 ? '#1f2617' : '#f5f4f0', marginRight: 12, flexShrink: 0 }}>
                            <Text style={{ fontWeight: '900', fontSize: 12, color: i === 0 ? '#e5fc01' : '#a8a29e' }}>{initials}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: '#1c1917', fontWeight: '700', fontSize: 13 }} numberOfLines={1}>{c.name}</Text>
                            <Text style={{ color: '#a8a29e', fontSize: 10, fontWeight: '700', marginTop: 2 }}>
                              {c.billsCount} bill{c.billsCount !== 1 ? 's' : ''}
                              {c.udhaarBalance > 0 && (
                                <Text style={{ color: '#ef4444' }}> · ₹{c.udhaarBalance?.toLocaleString('en-IN')} pending</Text>
                              )}
                            </Text>
                          </View>
                          <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                            <Text style={{ color: '#a8a29e', fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>Spent</Text>
                            <Text style={{ color: '#1c1917', fontWeight: '900', fontSize: 14, marginTop: 2 }}>{fmt(c.totalSpent)}</Text>
                          </View>
                        </View>
                        {i < topCustomers.length - 1 && <Sep />}
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Empty state */}
            {!topProducts.length && !topCustomers.length && (
              <View style={{ alignItems: 'center', paddingVertical: 64, opacity: 0.3 }}>
                <Feather name="bar-chart-2" size={40} color="#bfb5a8" />
                <Text style={{ color: '#a8a29e', fontWeight: '700', fontSize: 14, marginTop: 12 }}>No data for this period</Text>
              </View>
            )}

          </ScrollView>
        )}

        {/* ══════════════════════════════════════════════════════════
            FILTER MODAL
        ══════════════════════════════════════════════════════════ */}
        <Modal visible={showFilterModal} transparent animationType="slide" onRequestClose={() => setShowFilterModal(false)}>
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }}
            onPress={() => setShowFilterModal(false)}
          />
          <View style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            backgroundColor: '#fafaf9',
            borderTopLeftRadius: 32, borderTopRightRadius: 32,
            paddingHorizontal: 24, paddingTop: 8,
            paddingBottom: Platform.OS === 'ios' ? 36 : 24,
            shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: -4 }, elevation: 20,
          }}>
            {/* Handle */}
            <View style={{ width: 36, height: 4, backgroundColor: '#d6d3d1', borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />

            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#1c1917', letterSpacing: -0.3 }}>Date Range</Text>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#e7e5e4', alignItems: 'center', justifyContent: 'center' }}
              >
                <Feather name="x" size={16} color="#1c1917" />
              </TouchableOpacity>
            </View>

            {/* Quick picks */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {DATE_FILTERS.filter(f => f.key !== 'custom').map(f => {
                const active = localFilter === f.key;
                return (
                  <TouchableOpacity
                    key={f.key}
                    onPress={() => { setLocalFilter(f.key); setShowDatePicker(false); }}
                    activeOpacity={0.75}
                    style={{
                      paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
                      borderWidth: 1.5,
                      backgroundColor: active ? '#1f2617' : '#ffffff',
                      borderColor: active ? '#1f2617' : '#e7e5e4',
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '800', color: active ? '#e5fc01' : '#44403c' }}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom range pill */}
            <TouchableOpacity
              onPress={() => { setLocalFilter('custom'); setShowDatePicker(true); }}
              activeOpacity={0.75}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
                paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginBottom: 12,
                borderWidth: 1.5,
                backgroundColor: localFilter === 'custom' ? '#1f2617' : '#ffffff',
                borderColor: localFilter === 'custom' ? '#1f2617' : '#e7e5e4',
              }}
            >
              <Feather name="calendar" size={13} color={localFilter === 'custom' ? '#e5fc01' : '#a8a29e'} />
              <Text style={{ fontSize: 12, fontWeight: '800', color: localFilter === 'custom' ? '#e5fc01' : '#44403c' }}>
                {localFilter === 'custom' && customRange?.start
                  ? `${new Date(tempStart).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} – ${new Date(tempEnd).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`
                  : 'Custom Range'}
              </Text>
            </TouchableOpacity>

            {/* Date picker (when custom selected) */}
            {localFilter === 'custom' && showDatePicker && (
              <View style={{ backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: '#e7e5e4', overflow: 'hidden', marginBottom: 12 }}>
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

            {/* Apply */}
            <TouchableOpacity
              onPress={applyFilters}
              activeOpacity={0.85}
              style={{
                backgroundColor: '#1f2617', borderRadius: 20, paddingVertical: 17,
                alignItems: 'center', marginTop: 4,
                shadowColor: '#1f2617', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
              }}
            >
              <Text style={{ color: '#e5fc01', fontWeight: '900', fontSize: 13, textTransform: 'uppercase', letterSpacing: 2 }}>
                Apply
              </Text>
            </TouchableOpacity>
          </View>
        </Modal>

      </SafeAreaView>
    </PremiumLock>
  );
}
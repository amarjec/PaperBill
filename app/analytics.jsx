import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Pressable,
  ActivityIndicator, Dimensions, Modal, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
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

// ── tiny atoms ────────────────────────────────────────────────────────────────
const Sep = () => <View className="h-px bg-card/60 mx-4" />;

const SectionLabel = ({ children }) => (
  <Text className="text-secondaryText text-[10px] font-black uppercase tracking-widest mb-2.5 ml-0.5">
    {children}
  </Text>
);

// ── metric card (small, 2-col) ────────────────────────────────────────────────
const MetricCard = ({ icon, iconColor, iconBg, label, value, sub, subColor }) => (
  <View
    className={`flex-1 bg-white rounded-[20px] border border-card px-4 py-4`}
    style={{ shadowColor: '#c8c0b4', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}
  >
    <View className={`w-8 h-8 rounded-xl items-center justify-center mb-3 ${iconBg}`}>
      <Feather name={icon} size={14} color={iconColor} />
    </View>
    <Text className="text-secondaryText text-[9px] font-black uppercase tracking-widest mb-1">{label}</Text>
    <Text className="text-primaryText font-black text-[17px] leading-tight">{value}</Text>
    {sub && <Text className={`text-[10px] font-bold mt-0.5 ${subColor || 'text-secondaryText'}`}>{sub}</Text>}
  </View>
);

// ── rank badge ────────────────────────────────────────────────────────────────
const rankBg = ['bg-amber-400', 'bg-card', 'bg-card'];
const rankText = ['text-primaryText', 'text-secondaryText', 'text-secondaryText'];

// ── filter pills ─────────────────────────────────────────────────────────────
const FILTERS = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: '7 Days' },
  { key: 'month', label: 'Month' },
  { key: 'year',  label: 'Year' },
  { key: 'custom', label: 'Custom' },
];

// ── main screen ───────────────────────────────────────────────────────────────
export default function AnalyticsScreen() {
  const router  = useRouter();
  const { data, loading, filterType, setFilterType, customRange, applyCustomRange, refresh } = useAnalytics();

  const [showDateModal, setShowDateModal]   = useState(false);
  const [tempStart, setTempStart]           = useState(new Date());
  const [tempEnd, setTempEnd]               = useState(new Date());
  const [activePicker, setActivePicker]     = useState(Platform.OS === 'ios' ? 'start' : null);

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

  // derived metrics
  const summary   = data?.summary || {};
  const totalSales   = summary.totalSales   || 0;
  const totalBills   = summary.totalBills   || 0;
  const totalProfit  = summary.totalProfit  || 0;
  const totalUdhaar  = summary.totalUdhaar  || 0;
  const avgOrder     = totalBills > 0 ? Math.round(totalSales / totalBills) : 0;
  const marginPct    = totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : '0.0';
  const collectionRate = totalSales > 0
    ? (((totalSales - totalUdhaar) / totalSales) * 100).toFixed(1)
    : '100.0';

  const topProducts  = data?.topProducts?.byProfit  || [];
  const topByQty     = data?.topProducts?.byQuantity || [];
  const topCustomers = data?.topCustomers || [];

  const handleFilterPress = (key) => {
    if (key === 'custom') { setShowDateModal(true); return; }
    setFilterType(key);
  };

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') setActivePicker(null);
    if (selectedDate) {
      if (activePicker === 'start') setTempStart(selectedDate);
      else setTempEnd(selectedDate);
    }
  };

  const applyCustom = () => {
    applyCustomRange(tempStart, tempEnd);
    setShowDateModal(false);
  };

  // label for current filter
  const filterLabel = filterType === 'custom' && customRange?.start
    ? `${new Date(customRange.start).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} – ${new Date(customRange.end).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}`
    : FILTERS.find(f => f.key === filterType)?.label || 'Analytics';

  return (
    <PremiumLock
      featureName="Advanced Analytics"
      description="Track your true profit, find your best-selling items, and visualize your shop's growth with real-time data."
      icon="chart-areaspline"
    >
      <SafeAreaView className="flex-1 bg-bg">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <View className="flex-row items-center px-5 pt-4 pb-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-card w-10 h-10 rounded-2xl items-center justify-center mr-4"
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={18} color="#1f2617" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-primaryText text-xl font-black tracking-tight">Analytics</Text>
            <Text className="text-secondaryText text-[10px] font-bold mt-0.5">{filterLabel}</Text>
          </View>
          <TouchableOpacity
            onPress={refresh}
            className="bg-card w-10 h-10 rounded-2xl items-center justify-center"
            activeOpacity={0.7}
          >
            <Feather name="refresh-cw" size={16} color="#393f35" />
          </TouchableOpacity>
        </View>

        {/* ── Filter pills ─────────────────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12, gap: 8 }}
        >
          {FILTERS.map(f => {
            const active = filterType === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => handleFilterPress(f.key)}
                activeOpacity={0.75}
                className={`px-4 py-2 rounded-2xl border flex-1 justify-center items-center ${
                  active ? 'bg-primaryText border-primaryText' : 'bg-white border-card'
                }`}
              >
                {f.key === 'custom' && (
                  <Feather name="calendar" size={11} color={active ? '#e5fc01' : '#bfb5a8'} style={{ marginRight: 4 }} />
                )}
                <Text className={`font-black text-[12px] ${active ? 'text-accent' : 'text-secondaryText'}`}>
                  {f.key === 'custom' && filterType === 'custom' && customRange?.start
                    ? `${new Date(customRange.start).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} – ${new Date(customRange.end).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`
                    : f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading || !data ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#1f2617" />
            <Text className="text-secondaryText text-[10px] font-black uppercase tracking-widest mt-4 opacity-50">
              Crunching numbers…
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          >

            {/* ── Hero revenue card ─────────────────────────────────────────── */}
            <View
              className="bg-primaryText rounded-[28px] px-5 py-5 mb-4"
              style={{ shadowColor: '#1f2617', shadowOpacity: 0.28, shadowRadius: 16, shadowOffset: { width: 0, height: 7 }, elevation: 7 }}
            >
              {/* Top stripe */}
              <View className="h-0.5 bg-accent rounded-full w-10 mb-4" />

              <Text className="text-secondary text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">
                Total Revenue
              </Text>
              <Text className="text-accent font-black text-[40px] leading-none mb-1">
                {fmt(totalSales)}
              </Text>
              <Text className="text-secondary text-[11px] font-bold opacity-40">
                {fmtFull(totalSales)}
              </Text>
            </View>

            {/* ── 2×2 metric grid ──────────────────────────────────────────── */}
            <View className="mb-4 flex-row" style={{ gap: 10 }}>
              <MetricCard
                icon="trending-up" iconBg="bg-green-50" iconColor="#16a34a"
                label="Est. Profit"
                value={fmt(totalProfit)}
                sub={`${marginPct}% margin`}
                subColor="text-green-600"
              />
              <MetricCard
                icon="alert-circle" iconBg="bg-red-50" iconColor="#ef4444"
                label="New Udhaar"
                value={fmt(totalUdhaar)}
                sub={totalUdhaar > 0 ? `${(100 - parseFloat(collectionRate)).toFixed(1)}% uncollected` : 'All collected'}
                subColor={totalUdhaar > 0 ? 'text-red-400' : 'text-green-600'}
              />
            </View>
            <View className="mb-5 flex-row" style={{ gap: 10 }}>
              <MetricCard
                icon="check-circle" iconBg="bg-blue-50" iconColor="#2563eb"
                label="Collection Rate"
                value={`${collectionRate}%`}
                sub={`₹${(totalSales - totalUdhaar).toLocaleString('en-IN')} received`}
                subColor="text-blue-600"
              />
              <MetricCard
                icon="shopping-bag" iconBg="bg-purple-50" iconColor="#7c3aed"
                label="Avg. Bill Value"
                value={fmt(avgOrder)}
                sub={`${totalBills} bills total`}
                subColor="text-purple-600"
              />
            </View>

            {/* ── Revenue trend chart ───────────────────────────────────────── */}
            <View className="mb-5">
              <View className="flex-row items-center justify-between mb-2.5">
                <SectionLabel>Revenue Trend</SectionLabel>
                <Text className="text-secondaryText text-[9px] font-black uppercase tracking-widest opacity-50">Daily</Text>
              </View>
              <View
                className="bg-white rounded-[22px] border border-card pt-5 pb-4 overflow-hidden"
                style={{ shadowColor: '#c8c0b4', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 }}
              >
                {chartData.length > 0 ? (
                  <View className="items-center">
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
                      areaChart
                      curved
                      hideRules
                      yAxisColor="transparent"
                      xAxisColor="#f0ece6"
                      yAxisTextStyle={{ color: '#bfb5a8', fontSize: 9, fontWeight: '700' }}
                      formatYLabel={v => fmt(Number(v))}
                      dataPointsColor="#1f2617"
                      dataPointsRadius={3}
                    />
                  </View>
                ) : (
                  <View className="h-[160px] items-center justify-center opacity-30">
                    <Feather name="bar-chart-2" size={30} color="#bfb5a8" />
                    <Text className="text-secondaryText font-bold text-[11px] mt-2">No sales data for this period</Text>
                  </View>
                )}
              </View>
            </View>

            {/* ── Top profitable products ───────────────────────────────────── */}
            {topProducts.length > 0 && (
              <View className="mb-5">
                <View className="flex-row items-center justify-between mb-2.5">
                  <SectionLabel>Top by Profit</SectionLabel>
                  <Text className="text-green-600 text-[9px] font-black uppercase tracking-widest">Est. Margin</Text>
                </View>
                <View
                  className="bg-white rounded-[22px] border border-card overflow-hidden"
                  style={{ shadowColor: '#c8c0b4', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 }}
                >
                  {topProducts.map((item, i) => (
                    <View key={i}>
                      <View className="flex-row items-center px-4 py-3.5">
                        {/* Rank */}
                        <View className={`w-7 h-7 rounded-xl items-center justify-center mr-3 flex-shrink-0 ${rankBg[i] || 'bg-card'}`}>
                          <Text className={`font-black text-[11px] ${rankText[i] || 'text-secondaryText'}`}>{i + 1}</Text>
                        </View>
                        {/* Name + stats */}
                        <View className="flex-1 pr-2">
                          <Text className="text-primaryText font-bold text-[13px]" numberOfLines={1}>{item._id}</Text>
                          <Text className="text-secondaryText text-[10px] font-bold mt-0.5">
                            {item.qtySold} units · Rev {fmt(item.revenue)}
                          </Text>
                        </View>
                        {/* Profit */}
                        <View className="items-end">
                          <Text className="text-secondaryText text-[9px] font-black uppercase tracking-widest">Profit</Text>
                          <Text className="text-green-600 font-black text-[14px] mt-0.5">+{fmt(item.profit)}</Text>
                        </View>
                      </View>
                      {i < topProducts.length - 1 && <Sep />}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ── Top by quantity sold ──────────────────────────────────────── */}
            {topByQty.length > 0 && (
              <View className="mb-5">
                <View className="flex-row items-center justify-between mb-2.5">
                  <SectionLabel>Top by Units Sold</SectionLabel>
                  <Text className="text-purple-600 text-[9px] font-black uppercase tracking-widest">Volume</Text>
                </View>
                <View
                  className="bg-white rounded-[22px] border border-card overflow-hidden"
                  style={{ shadowColor: '#c8c0b4', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 }}
                >
                  {topByQty.map((item, i) => {
                    const maxQty = topByQty[0]?.qtySold || 1;
                    const barW   = Math.round((item.qtySold / maxQty) * 100);
                    return (
                      <View key={i}>
                        <View className="px-4 py-3.5">
                          <View className="flex-row items-center justify-between mb-2">
                            <View className="flex-row items-center flex-1 pr-3">
                              <View className={`w-7 h-7 rounded-xl items-center justify-center mr-3 flex-shrink-0 ${rankBg[i] || 'bg-card'}`}>
                                <Text className={`font-black text-[11px] ${rankText[i] || 'text-secondaryText'}`}>{i + 1}</Text>
                              </View>
                              <Text className="text-primaryText font-bold text-[13px] flex-1" numberOfLines={1}>{item._id}</Text>
                            </View>
                            <Text className="text-purple-600 font-black text-[13px]">{item.qtySold} <Text className="text-secondaryText font-bold text-[10px]">units</Text></Text>
                          </View>
                          {/* Progress bar */}
                          <View className="h-1.5 bg-card rounded-full ml-10 overflow-hidden">
                            <View className="h-full bg-purple-400 rounded-full" style={{ width: `${barW}%` }} />
                          </View>
                        </View>
                        {i < topByQty.length - 1 && <Sep />}
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ── Top customers ─────────────────────────────────────────────── */}
            {topCustomers.length > 0 && (
              <View className="mb-2">
                <View className="flex-row items-center justify-between mb-2.5">
                  <SectionLabel>Top Customers</SectionLabel>
                  <Text className="text-secondaryText text-[9px] font-black uppercase tracking-widest opacity-50">By Spend</Text>
                </View>
                <View
                  className="bg-white rounded-[22px] border border-card overflow-hidden"
                  style={{ shadowColor: '#c8c0b4', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 }}
                >
                  {topCustomers.map((c, i) => {
                    const initials = c.name?.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?';
                    return (
                      <View key={c._id}>
                        <View className="flex-row items-center px-4 py-3.5">
                          {/* Avatar */}
                          <View className={`w-9 h-9 rounded-2xl items-center justify-center mr-3 flex-shrink-0 ${i === 0 ? 'bg-primaryText' : 'bg-card'}`}>
                            <Text className={`font-black text-[12px] ${i === 0 ? 'text-accent' : 'text-secondaryText'}`}>{initials}</Text>
                          </View>
                          <View className="flex-1">
                            <Text className="text-primaryText font-bold text-[13px]" numberOfLines={1}>{c.name}</Text>
                            <Text className="text-secondaryText text-[10px] font-bold mt-0.5">
                              {c.billsCount} bill{c.billsCount !== 1 ? 's' : ''}
                              {c.udhaarBalance > 0 && (
                                <Text className="text-red-400"> · ₹{c.udhaarBalance?.toLocaleString('en-IN')} pending</Text>
                              )}
                            </Text>
                          </View>
                          <View className="items-end ml-2">
                            <Text className="text-secondaryText text-[9px] font-black uppercase tracking-widest">Spent</Text>
                            <Text className="text-primaryText font-black text-[14px] mt-0.5">{fmt(c.totalSpent)}</Text>
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
              <View className="items-center py-16 opacity-30">
                <Feather name="bar-chart-2" size={40} color="#bfb5a8" />
                <Text className="text-secondaryText font-bold text-sm mt-3">No data for this period</Text>
              </View>
            )}

          </ScrollView>
        )}

        {/* ── Custom date modal ─────────────────────────────────────────────── */}
        <Modal visible={showDateModal} transparent animationType="slide">
          <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <View className="bg-bg rounded-t-[44px] px-6 pt-5 pb-4">
              <View className="w-10 h-1 bg-card rounded-full self-center mb-5" />
              <View className="flex-row items-center justify-between mb-5">
                <Text className="text-primaryText text-xl font-black">Custom Range</Text>
                <TouchableOpacity onPress={() => setShowDateModal(false)} className="bg-card w-9 h-9 rounded-full items-center justify-center">
                  <Feather name="x" size={17} color="#1f2617" />
                </TouchableOpacity>
              </View>

              {/* Date selectors */}
              <View className="flex-row mb-4" style={{ gap: 10 }}>
                {['start', 'end'].map(side => (
                  <TouchableOpacity
                    key={side}
                    onPress={() => setActivePicker(side)}
                    activeOpacity={0.7}
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
    </PremiumLock>
  );
}
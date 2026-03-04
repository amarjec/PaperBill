import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Dimensions, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-gifted-charts';
import DateTimePicker from '@react-native-community/datetimepicker';
import PremiumLock from '@/src/components/PremiumLock';
import { useAnalytics } from '@/src/hooks/useAnalytics';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
  // Ensure your useAnalytics hook returns customRange so we can display it!
  const { data, loading, filterType, customRange, applyCustomRange, refresh } = useAnalytics();

  // --- MODAL STATES ---
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [tempStart, setTempStart] = useState(new Date());
  const [tempEnd, setTempEnd] = useState(new Date());
  const [activePicker, setActivePicker] = useState(Platform.OS === 'ios' ? 'start' : null);

  // Format the backend chart data for Gifted Charts
  const chartData = useMemo(() => {
    if (!data?.chartData || data.chartData.length === 0) return [];
    
    return data.chartData.map(item => {
      const dateObj = new Date(item._id);
      const label = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      
      return {
        value: item.dailySales,
        label: label,
        labelTextStyle: { color: '#bfb5a8', fontSize: 10, fontWeight: 'bold' },
        dataPointText: `₹${item.dailySales}`,
      };
    });
  }, [data]);

  const formatCurrency = (amount) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(2)}K`;
    return `₹${amount || 0}`;
  };

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') setActivePicker(null); 
    if (selectedDate) {
      if (activePicker === 'start') setTempStart(selectedDate);
      if (activePicker === 'end') setTempEnd(selectedDate);
    }
  };

  const handleApplyCustom = () => {
    applyCustomRange(tempStart, tempEnd);
    setShowCustomModal(false);
  };

  return (
    <PremiumLock 
      featureName="Advanced Analytics" 
      description="Track your true profit, find your best-selling items, and visualize your shop's growth with real-time data."
      icon="chart-areaspline"
    >
      <SafeAreaView className="flex-1 bg-bg">
        {/* --- HEADER --- */}
        <View className="px-6 py-4 flex-row justify-between items-center">
          <Text className="text-primaryText text-2xl font-black">Analytics</Text>
          <Pressable 
            onPress={refresh} 
            className="bg-card p-3 rounded-2xl active:opacity-50 border border-secondary/10"
          >
            <Feather name="refresh-cw" size={18} color="#1f2617" />
          </Pressable>
        </View>

        {/* --- CLEAN DATE RANGE SELECTOR --- */}
        <View className="px-6 mb-6 mt-2 flex-row justify-between items-center bg-card/20 p-4 rounded-3xl border border-secondary/10 shadow-sm">
          <View>
            <Text className="text-secondaryText text-[10px] uppercase font-bold tracking-widest mb-1">Showing Data For</Text>
            <Text className="text-primaryText font-black text-sm">
              {filterType === 'today' 
                ? "Today's Overview" 
                : customRange?.start && customRange?.end
                  ? `${new Date(customRange.start).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - ${new Date(customRange.end).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
                  : "Custom Range"}
            </Text>
          </View>
          
          <Pressable 
            onPress={() => setShowCustomModal(true)} 
            className="bg-primaryText px-4 py-3 rounded-2xl flex-row items-center active:opacity-70 shadow-md shadow-primaryText/20"
          >
            <Feather name="calendar" size={14} color="#e5fc01" />
            <Text className="text-accent font-black text-[11px] uppercase tracking-widest ml-2">Change</Text>
          </Pressable>
        </View>

        {loading || !data ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#1f2617" />
            <Text className="text-secondaryText font-bold mt-4 animate-pulse uppercase tracking-widest text-[10px]">
              Crunching numbers...
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
            
            {/* --- MASTER METRIC GRID --- */}
            <View className="px-6 flex-row flex-wrap justify-between gap-y-4 mb-8">
              <View className="w-full bg-primaryText p-6 rounded-[32px] shadow-2xl">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-bg font-bold uppercase tracking-widest text-xs opacity-80">Total Revenue</Text>
                  <MaterialCommunityIcons name="trending-up" size={20} color="#e5fc01" />
                </View>
                <Text className="text-accent font-black text-4xl mb-4">
                  ₹{data.summary.totalSales.toLocaleString('en-IN')}
                </Text>
                <View className="flex-row justify-between border-t border-white/10 pt-4 mt-2">
                  <View>
                    <Text className="text-bg text-[10px] uppercase font-bold opacity-60">Bills Generated</Text>
                    <Text className="text-bg font-bold mt-1 text-sm">{data.summary.totalBills}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-bg text-[10px] uppercase font-bold opacity-60">Avg. Order Value</Text>
                    <Text className="text-bg font-bold mt-1 text-sm">
                      ₹{data.summary.totalBills > 0 ? Math.round(data.summary.totalSales / data.summary.totalBills).toLocaleString('en-IN') : 0}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="w-[48%] bg-[#4ade80]/10 p-5 rounded-3xl border border-[#4ade80]/20">
                <View className="bg-[#4ade80]/20 w-8 h-8 rounded-full items-center justify-center mb-3">
                  <Feather name="pie-chart" size={14} color="#4ade80" />
                </View>
                <Text className="text-[#4ade80] text-[10px] uppercase font-bold tracking-widest mb-1">Est. Profit</Text>
                <Text className="text-[#4ade80] font-black text-xl">₹{data.summary.totalProfit.toLocaleString('en-IN')}</Text>
              </View>

              <View className="w-[48%] bg-red-500/10 p-5 rounded-3xl border border-red-500/20">
                <View className="bg-red-500/20 w-8 h-8 rounded-full items-center justify-center mb-3">
                  <Feather name="alert-circle" size={14} color="#ef4444" />
                </View>
                <Text className="text-red-500 text-[10px] uppercase font-bold tracking-widest mb-1">New Udhaar</Text>
                <Text className="text-red-500 font-black text-xl">₹{data.summary.totalUdhaar.toLocaleString('en-IN')}</Text>
              </View>
            </View>

            {/* --- SPLINE AREA CHART --- */}
            <View className="px-6 mb-8">
              <View className="flex-row justify-between items-end mb-6">
                <Text className="text-primaryText font-black text-lg">Revenue Trend</Text>
                <Text className="text-secondaryText text-[10px] font-bold uppercase tracking-widest">Daily Breakdown</Text>
              </View>
              
              <View className="bg-white p-5 pt-8 rounded-[32px] border border-card shadow-sm items-center overflow-hidden">
                {chartData.length > 0 ? (
                  <LineChart
                    data={chartData}
                    width={screenWidth - 120}
                    height={180}
                    spacing={chartData.length > 7 ? 40 : (screenWidth - 120) / Math.max(chartData.length, 1)}
                    initialSpacing={10}
                    color="#1f2617"
                    thickness={3}
                    startFillColor="#e5fc01"
                    endFillColor="#ffffff"
                    startOpacity={0.6}
                    endOpacity={0.1}
                    areaChart
                    curved
                    hideRules
                    yAxisColor="transparent"
                    xAxisColor="#e2e8f0"
                    yAxisTextStyle={{ color: '#bfb5a8', fontSize: 10, fontWeight: 'bold' }}
                    formatYLabel={(label) => formatCurrency(Number(label))}
                    dataPointsColor="#1f2617"
                    dataPointsRadius={4}
                    textFontSize={9}
                    textColor="#1f2617"
                    textShiftY={-10}
                    textShiftX={-10}
                  />
                ) : (
                  <View className="h-[180px] justify-center items-center">
                    <Feather name="bar-chart-2" size={32} color="#e2e8f0" className="mb-2" />
                    <Text className="text-secondaryText font-bold text-xs">No sales data for this period.</Text>
                  </View>
                )}
              </View>
            </View>

            {/* --- TOP PROFITABLE ITEMS --- */}
            <View className="px-6 mb-8">
              <View className="flex-row justify-between items-end mb-4">
                <Text className="text-primaryText font-black text-lg">Top Profitable Items</Text>
                <Text className="text-[#4ade80] text-[10px] font-bold uppercase tracking-widest">By Margin</Text>
              </View>

              {data.topProducts?.byProfit?.length > 0 ? (
                data.topProducts.byProfit.map((item, index) => (
                  <View key={index} className="bg-white p-5 rounded-3xl mb-3 border border-card shadow-sm flex-row justify-between items-center">
                    <View className="flex-1 pr-4">
                      <View className="flex-row items-center mb-1">
                        <View className="bg-card w-6 h-6 rounded-full items-center justify-center mr-2">
                          <Text className="text-primaryText font-bold text-[10px]">{index + 1}</Text>
                        </View>
                        <Text className="text-primaryText font-black text-base flex-1" numberOfLines={1}>
                          {item._id}
                        </Text>
                      </View>
                      <Text className="text-secondaryText text-[10px] font-bold uppercase tracking-widest ml-8">
                        Sold: {item.qtySold} units • Rev: ₹{item.revenue.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View className="items-end pl-3 border-l border-card/50">
                      <Text className="text-secondaryText text-[9px] uppercase font-bold tracking-widest mb-1">Total Profit</Text>
                      <Text className="text-[#4ade80] font-black text-lg">+₹{item.profit.toLocaleString('en-IN')}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View className="bg-card/30 p-6 rounded-3xl items-center border border-dashed border-secondary/20">
                  <Text className="text-secondaryText font-bold text-xs">No product data available yet.</Text>
                </View>
              )}
            </View>

            {/* --- TOP CUSTOMERS --- */}
            <View className="px-6 mb-8">
              <View className="flex-row justify-between items-end mb-4">
                <Text className="text-primaryText font-black text-lg">Top Customers</Text>
                <Text className="text-secondaryText text-[10px] font-bold uppercase tracking-widest">By Total Spent</Text>
              </View>

              {data.topCustomers?.length > 0 ? (
                data.topCustomers.map((customer, index) => (
                  <View key={customer._id} className="bg-primaryText p-5 rounded-3xl mb-3 shadow-md flex-row justify-between items-center">
                    <View className="flex-row items-center flex-1 pr-4">
                      <View className="bg-accent/20 w-10 h-10 rounded-full items-center justify-center mr-3 border border-accent/30">
                        <Feather name="star" size={16} color="#e5fc01" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-bg font-black text-base" numberOfLines={1}>
                          {customer.name}
                        </Text>
                        <Text className="text-bg/60 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                          {customer.billsCount} Invoices
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="text-bg/60 text-[9px] uppercase font-bold tracking-widest mb-1">Total Revenue</Text>
                      <Text className="text-accent font-black text-lg">₹{customer.totalSpent.toLocaleString('en-IN')}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View className="bg-card/30 p-6 rounded-3xl items-center border border-dashed border-secondary/20">
                  <Text className="text-secondaryText font-bold text-xs">No customer data available yet.</Text>
                </View>
              )}
            </View>
          </ScrollView>
        )}

        {/* --- THE CUSTOM DATE MODAL --- */}
        <Modal visible={showCustomModal} animationType="fade" transparent>
          <View className="flex-1 bg-black/80 justify-end">
            <View className="bg-bg p-8 rounded-t-[40px] shadow-2xl">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-primaryText text-2xl font-black">Custom Range</Text>
                <Pressable 
                  onPress={() => setShowCustomModal(false)} 
                  className="bg-card p-2 rounded-full active:opacity-50"
                >
                  <Feather name="x" size={20} color="#1f2617" />
                </Pressable>
              </View>

              <View className="flex-row justify-between gap-4 mb-6">
                <Pressable 
                  onPress={() => setActivePicker('start')} 
                  className={`flex-1 p-4 rounded-2xl border active:opacity-70 ${activePicker === 'start' ? 'border-primaryText bg-primaryText/5' : 'border-card bg-white'}`}
                >
                  <Text className="text-secondaryText text-[10px] uppercase font-bold tracking-widest mb-1">Start Date</Text>
                  <Text className="text-primaryText font-black">{tempStart.toLocaleDateString('en-GB')}</Text>
                </Pressable>

                <Pressable 
                  onPress={() => setActivePicker('end')} 
                  className={`flex-1 p-4 rounded-2xl border active:opacity-70 ${activePicker === 'end' ? 'border-primaryText bg-primaryText/5' : 'border-card bg-white'}`}
                >
                  <Text className="text-secondaryText text-[10px] uppercase font-bold tracking-widest mb-1">End Date</Text>
                  <Text className="text-primaryText font-black">{tempEnd.toLocaleDateString('en-GB')}</Text>
                </Pressable>
              </View>

              {activePicker && (
                <View className={`bg-white rounded-3xl mb-6 overflow-hidden ${Platform.OS === 'ios' ? 'p-2 border border-card' : ''}`}>
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

              <Pressable 
                onPress={handleApplyCustom} 
                className="bg-primaryText py-5 rounded-2xl items-center shadow-lg mt-2 active:opacity-70"
              >
                <Text className="text-accent font-black uppercase tracking-widest">Apply Filter</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </PremiumLock> 
  );
}
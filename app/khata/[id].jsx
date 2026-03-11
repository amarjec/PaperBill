import { useKhataDetail } from "@/src/hooks/useKhataDetail";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useRef } from "react";
import PremiumLock from "@/src/components/PremiumLock";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePermission } from "@/src/hooks/usePermission";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Passbook Row ─────────────────────────────────────────────────────────────
function PassbookRow({ entry, runningBalance, isLast }) {
  const isDebit = entry.type === "debit";

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  const formatTime = (d) =>
    new Date(d).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <View className="flex-row items-stretch">
      {/* Timeline spine */}
      <View className="items-center mr-3 w-6">
        <View
          className={`w-2.5 h-2.5 rounded-full mt-[18px] ${isDebit ? "bg-green-400" : "bg-red-400"}`}
        />
        {!isLast && <View className="flex-1 w-px bg-stone-200 mt-0.5" />}
      </View>

      {/* Row card */}
      <View className="flex-1 mb-3 p-4 rounded-2xl border border-stone-200 bg-stone-50">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1 pr-3">
            <Text
              className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDebit ? "text-green-500" : "text-red-500"}`}
            >
              {isDebit ? "PAYMENT" : "CHARGED"}
            </Text>
            <Text
              className="text-stone-800 font-black text-sm"
              numberOfLines={1}
            >
              {entry.description}
            </Text>
          </View>
          <Text
            className={`font-black text-base ${isDebit ? "text-green-500" : "text-red-500"}`}
          >
            {isDebit ? "− " : "+ "}₹{entry.amount.toLocaleString("en-IN")}
          </Text>
        </View>

        <View className="flex-row justify-between items-center pt-2 border-t border-stone-200">
          <Text className="text-[10px] font-semibold text-stone-400">
            {formatDate(entry.date)}
            {"  "}
            {formatTime(entry.date)}
          </Text>
          <View className="flex-row items-center gap-1">
            <Text className="text-[9px] font-bold uppercase tracking-widest text-stone-400">
              Bal:
            </Text>
            <Text
              className={`font-black text-[11px] ${runningBalance > 0 ? "text-red-500" : "text-green-500"}`}
            >
              ₹{runningBalance.toLocaleString("en-IN")}
            </Text>
          </View>
        </View>

        {isDebit && entry.receivedBy && (
          <View className="mt-2 self-start flex-row items-center gap-1 bg-green-400/10 px-2 py-1 rounded-lg">
            <Feather name="user-check" size={10} color="#4ade80" />
            <Text className="text-[9px] font-bold text-green-400">
              {entry.receivedBy}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Collapsible Passbook ─────────────────────────────────────────────────────
function PassbookSection({ allBills, transactions, safeNum }) {
  const [open, setOpen] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Animated.timing(rotateAnim, {
      toValue: open ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
    setOpen((v) => !v);
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  // ── Build ledger entries ──────────────────────────────────────────────────
  //
  // CREDITS  → allBills only (each invoice is a charge to the customer)
  // DEBITS   → KhataTransactions only (every payment, whether made at bill
  //            creation time or via updateKhataPayment, is stored as a
  //            KhataTransaction by the backend)
  //
  // We intentionally do NOT read bill.amount_paid here. Doing so would
  // double-count every payment because each payment already has a
  // corresponding KhataTransaction record.

  const entries = [];

  allBills.forEach((bill) => {
    entries.push({
      id: `bill-${bill._id}`,
      type: "credit",
      date: bill.createdAt,
      amount: safeNum(bill.total_amount),
      description: `Invoice ${bill.bill_number}`,
      receivedBy: null,
    });
  });

  transactions.forEach((txn) => {
    entries.push({
      id: `txn-${txn._id}`,
      type: txn.type === "Payment" ? "debit" : "credit",
      date: txn.createdAt,
      amount: safeNum(txn.amount),
      description:
        txn.type === "Payment" ? "Payment Received" : "Credit Adjustment",
      receivedBy: txn.received_by || null,
    });
  });

  entries.sort((a, b) => new Date(a.date) - new Date(b.date));

  let balance = 0;
  const rows = entries.map((entry) => {
    balance =
      entry.type === "credit" ? balance + entry.amount : balance - entry.amount;
    return { ...entry, runningBalance: Math.max(0, balance) };
  });

  return (
    <View className="px-6 mb-8">
      {/* Toggle button */}
      <Pressable
        onPress={toggle}
        className="active:opacity-70"
        style={{
          backgroundColor: "#1f2617",
          borderRadius: 20,
          paddingHorizontal: 20,
          paddingVertical: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          shadowColor: "#1f2617",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 6,
        }}
      >
        <View className="flex-row items-center gap-3">
          <View className="bg-[#e5fc01]/10 w-9 h-9 rounded-xl items-center justify-center">
            <MaterialCommunityIcons
              name="book-open-page-variant"
              size={18}
              color="#e5fc01"
            />
          </View>
          <View>
            <Text
              className="font-black text-[13px] uppercase tracking-[2.5px]"
              style={{ color: "#e5fc01" }}
            >
              Passbook
            </Text>
            <Text
              className="text-[10px] font-semibold"
              style={{ color: "#ffffff60" }}
            >
              {rows.length} entries • tap to {open ? "collapse" : "expand"}
            </Text>
          </View>
        </View>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Feather name="chevron-down" size={20} color="#e5fc01" />
        </Animated.View>
      </Pressable>

      {/* Passbook body */}
      {open && (
        <View
          className="border border-t-0 border-stone-200 bg-stone-50 px-4 pt-5 pb-3"
          style={{ borderBottomLeftRadius: 20, borderBottomRightRadius: 20 }}
        >
          {/* Column headers */}
          <View className="flex-row justify-between mb-3 pb-3 border-b border-stone-200">
            {[
              { label: "DATE", flex: 2 },
              { label: "PARTICULARS", flex: 3 },
              { label: "AMOUNT", flex: 2 },
              { label: "BALANCE", flex: 2 },
            ].map((col) => (
              <Text
                key={col.label}
                style={{ flex: col.flex }}
                className="text-[8px] font-black uppercase tracking-[1.5px] text-stone-400"
              >
                {col.label}
              </Text>
            ))}
          </View>

          {rows.length === 0 ? (
            <Text className="text-stone-400 text-center py-5 text-xs font-semibold">
              No transactions yet.
            </Text>
          ) : (
            rows.map((row, idx) => (
              <PassbookRow
                key={row.id}
                entry={row}
                runningBalance={row.runningBalance}
                isLast={idx === rows.length - 1}
              />
            ))
          )}

          {/* Closing balance */}
          {rows.length > 0 && (
            <View
              className="mt-2 px-4 py-3 rounded-2xl flex-row justify-between items-center"
              style={{ backgroundColor: "#1f2617" }}
            >
              <Text
                className="text-[10px] font-bold uppercase tracking-[1.5px]"
                style={{ color: "#ffffff60" }}
              >
                Closing Balance
              </Text>
              <Text
                className="text-base font-black"
                style={{ color: "#e5fc01" }}
              >
                ₹{rows[rows.length - 1].runningBalance.toLocaleString("en-IN")}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
function KhataDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [showAllInvoices, setShowAllInvoices] = useState(false);
  const [showPendingInvoices, setShowPendingInvoices] = useState(true);

  const { can } = usePermission();

  const {
    customer,
    unpaidBills,
    allBills,
    transactions = [],
    loading,
    isProcessing,
    safeNum,
    paymentModalVisible,
    setPaymentModalVisible,
    paymentAmount,
    setPaymentAmount,
    handleBulkPayment,
  } = useKhataDetail(id);

  if (loading || !customer) {
    return (
      <SafeAreaView className="flex-1 bg-bg justify-center items-center">
        <ActivityIndicator size="large" color="#1f2617" />
      </SafeAreaView>
    );
  }

  const totalDebt = safeNum(customer.total_debt);

  const formatDate = (d) =>
    new Date(d).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getStatusStyle = (status) => {
    switch (status) {
      case "Paid":
        return "text-green-400 bg-green-400/10 border-green-400/20";
      case "Unpaid":
        return "text-red-400 bg-red-400/10 border-red-400/20";
      case "Partial":
        return "text-orange-400 bg-orange-400/10 border-orange-400/20";
      default:
        return "text-stone-400 bg-stone-400/10 border-stone-400/20";
    }
  };

  const handleShareReminder = async () => {
    try {
      let msg = `*Payment Reminder*\n\nHello ${customer.name},\nYour total outstanding balance is *₹${totalDebt.toLocaleString("en-IN")}*.\n\n*Pending Bills:*\n`;
      unpaidBills.forEach((b) => {
        const pending = safeNum(b.total_amount) - safeNum(b.amount_paid);
        msg += `• ${b.bill_number} (${formatDate(b.createdAt)}): ₹${pending}\n`;
      });
      msg += `\nPlease settle at your earliest convenience. Thank you!`;
      await Share.share({ message: msg, title: "Payment Reminder" });
    } catch (e) {
      console.log(e.message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      {/* ── Header ── */}
      <View className="px-6 py-4 flex-row gap-3 items-center">
        <Pressable
          onPress={() => router.back()}
          className="bg-card p-3 rounded-2xl active:opacity-50"
        >
          <Feather name="arrow-left" size={20} color="#1f2617" />
        </Pressable>
        <Text className="text-primaryText text-xl font-black">
          Customer Ledger
        </Text>
        {/* <Pressable
          onPress={handleShareReminder}
          disabled={totalDebt <= 0}
          className={`p-3 rounded-2xl active:opacity-50 ${totalDebt > 0 ? "bg-green-400/20" : "bg-card"}`}
        >
          <Feather
            name="share-2"
            size={18}
            color={totalDebt > 0 ? "#4ade80" : "#bfb5a8"}
          />
        </Pressable> */}

      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 160 }}
      >
        {/* ── Account Card ── */}
        <View className="px-6 mb-6 mt-2">
          <View
            className="rounded-[28px] p-6"
            style={{
              backgroundColor: "#1f2617",
              shadowColor: "#1f2617",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            <View className="flex-row justify-between items-center mb-5">
              <View className="flex-row items-center gap-2">
                <MaterialCommunityIcons
                  name="bank-outline"
                  size={13}
                  color="#e5fc0170"
                />
                <Text
                  className="text-[9px] font-extrabold uppercase tracking-[2.5px]"
                  style={{ color: "#e5fc0170" }}
                >
                  Khata Account
                </Text>
              </View>
              <View
                className="px-3 py-1 rounded-full"
                style={{
                  backgroundColor: "#e5fc0110",
                  borderWidth: 1,
                  borderColor: "#e5fc0125",
                }}
              >
                <Text
                  className="text-[8px] font-extrabold uppercase tracking-[1.5px]"
                  style={{ color: "#e5fc01" }}
                >
                  {totalDebt > 0 ? "● Due" : "✓ Settled"}
                </Text>
              </View>
            </View>

            <Text className="text-white text-2xl font-black tracking-tight mb-1">
              {customer.name}
            </Text>

            <View className="flex-row items-center justify-between">
              <Text className="text-white/30 text-xs font-semibold mb-2">
                {customer.phone || "No phone on record"}
              </Text>
              <Text className="text-white/30 text-xs font-semibold mb-2">
                {customer.address || "kotar"}
              </Text>
            </View>

            <View className="border-t border-white/10 mb-5" />

            <View className="flex-row justify-between">
              <View>
                <Text className="text-white/40 text-[9px] font-bold uppercase tracking-[1.5px] mb-1">
                  Outstanding
                </Text>
                <Text
                  className="text-3xl font-black"
                  style={{ color: totalDebt > 0 ? "#ff6b6b" : "#4ade80" }}
                >
                  ₹{totalDebt.toLocaleString("en-IN")}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-white/40 text-[9px] font-bold uppercase tracking-[1.5px] mb-1">
                  Pending Bills
                </Text>
                <Text className="text-white text-3xl font-black">
                  {unpaidBills.length}
                </Text>
              </View>
            </View>

            {totalDebt > 0 && (
              <Pressable
                onPress={handleShareReminder}
                className="mt-5 flex-row items-center justify-center gap-2 py-2.5 rounded-[14px] active:opacity-60"
                style={{
                  backgroundColor: "#25D36618",
                  borderWidth: 1,
                  borderColor: "#25D36630",
                }}
              >
                <MaterialCommunityIcons
                  name="whatsapp"
                  size={15}
                  color="#25D366"
                />
                <Text
                  className="text-[10px] font-extrabold uppercase tracking-[2px]"
                  style={{ color: "#25D366" }}
                >
                  Send WhatsApp Reminder
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* ── Summary Pills ── */}
        {/* <View className="flex-row px-6 gap-3 mb-8">
          {[
            { label: "Total Bills", value: allBills.length, icon: "file-text" },
            {
              label: "Total Billed",
              value: `₹${allBills.reduce((s, b) => s + safeNum(b.total_amount), 0).toLocaleString("en-IN")}`,
              icon: "trending-up",
            },
          ].map((pill) => (
            <View
              key={pill.label}
              className="flex-1 p-4 rounded-2xl border border-stone-200 bg-stone-50"
            >
              <Feather
                name={pill.icon}
                size={14}
                color="#a8a29e"
                style={{ marginBottom: 6 }}
              />
              <Text className="text-primaryText text-lg font-black">
                {pill.value}
              </Text>
              <Text className="text-stone-400 text-[9px] font-bold uppercase tracking-[1.2px] mt-1">
                {pill.label}
              </Text>
            </View>
          ))}
        </View> */}

        {/* ── Passbook (hidden by default, tap to expand) ── */}
        <PassbookSection
          allBills={allBills}
          transactions={transactions}
          safeNum={safeNum}
        />

        {/* ── Pending Invoices ── */}
        <View className="px-6 mb-8">
          <Pressable
            onPress={() => setShowPendingInvoices((prev) => !prev)}
            className="flex-row items-center justify-between mb-3 ml-1 active:opacity-70"
          >
            <Text className="text-stone-400 text-[10px] font-bold uppercase tracking-[2px]">
              Pending Invoices
            </Text>
            <Feather
              name={showPendingInvoices ? "chevron-up" : "chevron-down"}
              size={16}
              color="#a8a29e"
            />
          </Pressable>

          {showPendingInvoices &&
            unpaidBills.length > 0 &&
            unpaidBills.map((bill) => {
              const pending =
                safeNum(bill.total_amount) - safeNum(bill.amount_paid);
              return (
                <Pressable
                  key={bill._id}
                  onPress={() => router.push(`/bill/${bill._id}`)}
                  className="mb-3 p-5 rounded-[20px] border border-card bg-card/10 active:opacity-70"
                >
                  <View className="flex-row justify-between items-center">
                    <View className="flex-1 pr-3">
                      <Text className="text-primaryText font-black text-base mb-1">
                      {bill.bill_number}
                    </Text>
                    <Text className="text-stone-400 text-[11px] font-semibold">
                      {formatDate(bill.createdAt)}
                    </Text>
                    </View>
                    <View className="flex-col items-center">
                       <Text className="text-stone-400 text-[9px] font-bold uppercase tracking-[1px]">
                        Pending
                      </Text>
                      <Text className="text-red-500 text-lg font-black">
                        ₹{pending.toLocaleString("en-IN")}
                      </Text>
                    </View>
                  </View>

                </Pressable>
              );
            })}
        </View>

        {/* ── All Invoices ── */}
        <View className="px-6 mb-8">
          <Pressable
            onPress={() => setShowAllInvoices((prev) => !prev)}
            className="flex-row items-center justify-between mb-3 ml-1 active:opacity-70"
          >
            <Text className="text-stone-400 text-[10px] font-bold uppercase tracking-[2px]">
              All Invoices
            </Text>
            <Feather
              name={showAllInvoices ? "chevron-up" : "chevron-down"}
              size={16}
              color="#a8a29e"
            />
          </Pressable>

          {showAllInvoices &&
            (allBills.length === 0 ? (
              <View className="bg-stone-50 rounded-[20px] border border-dashed border-stone-300 p-8 items-center">
                <Feather name="file-text" size={24} color="#d6d3d1" />
                <Text className="text-stone-400 font-semibold mt-2.5 text-sm">
                  No invoices found.
                </Text>
              </View>
            ) : (
              allBills.map((bill) => {
                const itemsList =
                  bill.items?.map((i) => i.item_name).join(", ") || "—";
                return (
                  <Pressable
                    key={bill._id}
                    onPress={() => router.push(`/bill/${bill._id}`)}
                    className="mb-3 p-5 rounded-[20px] border border-card bg-card/10 active:opacity-70"
                  >
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1 pr-3">
                        <Text className="text-primaryText font-black text-base mb-1">
                          {bill.bill_number}
                        </Text>
                        <Text className="text-stone-400 text-[10px] font-semibold">
                          {formatDate(bill.createdAt)}
                        </Text>
                      </View>
                      <View className="flex-col items-center gap-1">
                        <View
                          className={`px-2 py-1 rounded-full border ${getStatusStyle(bill.status)}`}
                        >
                          <Text
                            className={`text-[8px] font-extrabold uppercase tracking-[1.5px] ${getStatusStyle(bill.status).split(" ")[0]}`}
                          >
                            {bill.status}
                          </Text>
                        </View>
                        <Text className="text-primaryText font-black text-md mr-1">
                          ₹{safeNum(bill.total_amount).toLocaleString("en-IN")}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })
            ))}
        </View>
      </ScrollView>

      {/* ── Sticky CTA ── */}
       {can ('khata', 'update') &&
      <View className="absolute bottom-0 left-0 right-0 bg-bg px-6 pt-4 pb-8 border-t border-stone-200">
        <Pressable
          disabled={totalDebt <= 0}
          onPress={() => setPaymentModalVisible(true)}
          className={`flex-row items-center justify-center gap-3 py-[18px] rounded-[20px] ${
            totalDebt > 0
              ? "bg-primaryText active:opacity-70"
              : "bg-stone-200 opacity-60"
          }`}
          style={
            totalDebt > 0
              ? {
                  shadowColor: "#1f2617",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 12,
                  elevation: 6,
                }
              : {}
          }
        >
          <MaterialCommunityIcons
            name="cash-multiple"
            size={22}
            color={totalDebt > 0 ? "#e5fc01" : "#a8a29e"}
          />
          <Text
            className={`font-black text-[15px] uppercase tracking-[2.5px] ${totalDebt > 0 ? "text-accent" : "text-stone-400"}`}
          >
            {totalDebt > 0 ? "Settle Balance" : "All Cleared"}
          </Text>
        </Pressable>
      </View>}

      {/* ── Payment Modal ── */}
      {can ('khata', 'update') &&
      <Modal visible={paymentModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-end"
          style={{ backgroundColor: "#00000088" }}
        >
          <View className="bg-bg rounded-t-[36px] px-8 pt-6 pb-12 items-center">
            <View className="w-10 h-1 bg-stone-300 rounded-full mb-7" />

            <View className="bg-green-400/20 w-16 h-16 rounded-full items-center justify-center mb-4">
              <MaterialCommunityIcons
                name="hand-coin-outline"
                size={30}
                color="#4ade80"
              />
            </View>

            <Text className="text-primaryText text-2xl font-black mb-1.5">
              Receive Payment
            </Text>
            <Text className="text-stone-400 text-xs font-semibold text-center mb-6 leading-5">
              A lump sum will automatically clear the{"\n"}oldest pending bills
              first.
            </Text>

            <View className="bg-red-400/10 border border-red-400/20 rounded-2xl px-5 py-2.5 mb-5 flex-row gap-2 items-center">
              <Text className="text-red-400 text-[10px] font-black uppercase tracking-[1px]">
                Due
              </Text>
              <Text className="text-red-500 text-base font-black">
                ₹{totalDebt.toLocaleString("en-IN")}
              </Text>
            </View>

            <TextInput
              autoFocus
              keyboardType="numeric"
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              className="bg-white w-full py-5 px-4 rounded-2xl border border-stone-200 font-black text-[32px] text-center mb-6 text-primaryText"
              placeholder="₹ 0"
              placeholderTextColor="#d6d3d1"
            />

            <View className="flex-row gap-3 w-full">
              <Pressable
                onPress={() => setPaymentModalVisible(false)}
                className="flex-1 bg-stone-100 py-4 rounded-[18px] items-center active:opacity-50"
              >
                <Text className="text-primaryText font-bold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleBulkPayment}
                disabled={isProcessing}
                className="flex-[1.6] bg-green-400 py-4 rounded-[18px] items-center active:opacity-50"
                style={{
                  shadowColor: "#4ade80",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.35,
                  shadowRadius: 12,
                  elevation: 6,
                }}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#1f2617" />
                ) : (
                  <Text className="text-[#1f2617] font-black uppercase tracking-[2px]">
                    Confirm
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>}
    </SafeAreaView>
  );
}

export default function KhataDetailRoute() {
  return (
    <PremiumLock
      featureName="Khata & Ledger"
      description="Track customer credit, view full payment history, and manage outstanding dues — all in one place."
      icon="book-open-variant"
    >
      <KhataDetailScreen />
    </PremiumLock>
  );
}
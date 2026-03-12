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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });

const formatAmt = (n) =>
  n === 0 ? "—" : "₹" + Math.abs(n).toLocaleString("en-IN");

// ─── Build ledger rows from raw API data ──────────────────────────────────────
//
// RULE: ONE source of truth per event type.
//
//  • Bills          → "Dr" column  (customer is charged / owes more)
//  • KhataTransactions:
//      type="Payment" → "Cr" column  (customer paid / owes less)
//      type="Credit"  → "Dr" column  (debt added back, e.g. payment reversal
//                                     or bill restore — label differs from bill row)
//
// We NEVER read bill.amount_paid here. Every payment — whether made at bill
// creation time or later — is already stored as a KhataTransaction by the
// backend. Reading amount_paid would double-count every payment.
//
// "Credit Adjustment" entries (type="Credit" in KhataTransactions) are real
// ledger events: bill deletions reversing payments, bill restores, etc.
// We surface them clearly with an audit label from `received_by`.
// ─── Build passbook ledger rows ───────────────────────────────────────────────
//
// DESIGN RULE:
//   • Every bill (active or deleted) gets one Dr row for its total_amount.
//   • Every KhataTransaction with a bill_id gets shown under that bill.
//   • Deleted bills → their row AND all their linked transactions are crossed
//     out (isVoided=true). They still appear so the user sees the full audit
//     trail, but they are EXCLUDED from the running balance calculation.
//   • Backend reversal transactions (type=Payment/Credit created by delete)
//     carry the same bill_id — they are also crossed out. This means we never
//     show confusing "Bill Reversal" / "Payment Reversal" rows in isolation.
//   • Manual bulk payments (bill_id=null) are always active, always counted.
//
function buildLedgerRows(allBills, deletedBills, transactions, safeNum) {
  // Build a Set of deleted bill IDs for O(1) lookup
  const deletedIds = new Set(deletedBills.map((b) => String(b._id)));

  // Index transactions by bill_id for grouping
  // Transactions with bill_id=null are manual/bulk payments — kept separate
  const txnsByBill = {};
  const manualTxns = [];
  transactions.forEach((txn) => {
    const bid = txn.bill_id ? String(txn.bill_id) : null;
    if (bid) {
      if (!txnsByBill[bid]) txnsByBill[bid] = [];
      txnsByBill[bid].push(txn);
    } else {
      manualTxns.push(txn);
    }
  });

  const entries = [];

  // ── Helper: push a bill row + its linked transactions ──────────────────────
  const pushBillGroup = (bill, isVoided) => {
    const billId = String(bill._id);

    // Invoice row
    entries.push({
      id: `bill-${billId}`,
      date: bill.createdAt,
      particulars: `Invoice ${bill.bill_number}`,
      subLabel: isVoided
        ? `Deleted${bill.deleted_by ? ` · ${bill.deleted_by}` : ""}`
        : null,
      drAmount: safeNum(bill.total_amount),
      crAmount: 0,
      isVoided,
      isManual: false,
    });

    // Transactions linked to this bill (payments made at creation or via update).
    // Always strip audit/reversal entries — those have received_by starting with "["
    // and are backend bookkeeping (delete reversals, restore reversals etc.).
    // We only ever show the original payment rows the customer actually made.
    // Voided bills show them crossed out; restored/active bills show them normally.
    const linked = (txnsByBill[billId] || []).filter(
      (txn) => !(txn.received_by || "").startsWith("[")
    );
    linked.forEach((txn) => {
      const isPayment = txn.type === "Payment";
      entries.push({
        id: `txn-${txn._id}`,
        date: txn.createdAt,
        particulars: isPayment ? "Payment Received" : "Adjustment",
        subLabel: txn.received_by
          ? txn.received_by.replace(/^\[|\]$/g, "")
          : null,
        drAmount: isPayment ? 0 : safeNum(txn.amount),
        crAmount: isPayment ? safeNum(txn.amount) : 0,
        isVoided,
        isManual: false,
      });
    });
  };

  // Push all active bills
  allBills.forEach((bill) => pushBillGroup(bill, false));

  // Push all deleted bills (crossed out)
  deletedBills.forEach((bill) => pushBillGroup(bill, true));

  // Push manual bulk payments (no bill_id — always active)
  manualTxns.forEach((txn) => {
    entries.push({
      id: `txn-${txn._id}`,
      date: txn.createdAt,
      particulars: "Payment Received",
      subLabel: txn.received_by || null,
      drAmount: 0,
      crAmount: safeNum(txn.amount),
      isVoided: false,
      isManual: true,
    });
  });

  // ── Sort chronologically ────────────────────────────────────────────────────
  entries.sort((a, b) => new Date(a.date) - new Date(b.date));

  // ── Running balance — voided rows are excluded from the calculation ─────────
  let balance = 0;
  return entries.map((entry) => {
    if (!entry.isVoided) {
      balance += entry.drAmount - entry.crAmount;
    }
    return { ...entry, balance: Math.max(0, balance) };
  });
}

// ─── Ledger Table Row ─────────────────────────────────────────────────────────
//
// isVoided  → bill was deleted: entire row group is crossed out (amber wash +
//             strikethrough). Excluded from running balance.
// isManual  → manual bulk payment (no bill): green-tinted, always active.
// normal    → alternating white/stone.
//
function LedgerRow({ row, isLast, index }) {
  const isEven = index % 2 === 0;
  const hasDr = row.drAmount > 0;
  const hasCr = row.crAmount > 0;

  let rowBg = isEven ? "#fafaf9" : "#ffffff";
  let leftBorderColor = "transparent";
  let leftBorderWidth = 0;

  if (row.isVoided) {
    rowBg = "#fffbeb";           // amber-50 — visually "cancelled"
    leftBorderColor = "#f59e0b"; // amber-400
    leftBorderWidth = 3;
  } else if (row.isManual) {
    rowBg = "#f0fdf4";           // green-50 — bulk payment highlight
    leftBorderColor = "#22c55e"; // green-500
    leftBorderWidth = 3;
  }

  const strike = row.isVoided ? "line-through" : "none";
  const textColor = row.isVoided ? "#a8a29e" : "#1c1917";
  const subColor  = row.isVoided ? "#d6d3d1" : row.isManual ? "#16a34a" : "#a8a29e";
  const drColor   = row.isVoided ? "#d6d3d1" : "#ef4444";
  const crColor   = row.isVoided ? "#d6d3d1" : "#22c55e";
  const drTagColor = row.isVoided ? "#e7e5e4" : "#fca5a5";
  const crTagColor = row.isVoided ? "#e7e5e4" : "#86efac";

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: rowBg,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: "#e7e5e4",
        borderLeftWidth: leftBorderWidth,
        borderLeftColor: leftBorderColor,
        minHeight: 44,
        opacity: row.isVoided ? 0.7 : 1,
      }}
    >
      {/* Col 1 — Date + Particulars */}
      <View style={{ flex: 4, paddingHorizontal: 10, paddingVertical: 8, justifyContent: "center", borderRightWidth: 1, borderRightColor: "#e7e5e4" }}>
        <Text style={{ fontSize: 9, color: subColor, fontWeight: "600", marginBottom: 2 }}>
          {formatDate(row.date)}
          {row.isVoided && (
            <Text style={{ fontSize: 8, color: "#f59e0b", fontWeight: "700" }}> · VOID</Text>
          )}
        </Text>
        <Text style={{ fontSize: 11, color: textColor, fontWeight: "700", lineHeight: 15, textDecorationLine: strike }} numberOfLines={2}>
          {row.particulars}
        </Text>
        {row.subLabel && (
          <Text style={{ fontSize: 9, color: subColor, fontWeight: "500", marginTop: 2, lineHeight: 13 }} numberOfLines={2}>
            {row.subLabel}
          </Text>
        )}
      </View>

      {/* Col 2 — Debit (Dr) */}
      <View style={{ flex: 3, paddingHorizontal: 8, paddingVertical: 8, justifyContent: "center", alignItems: "flex-end", borderRightWidth: 1, borderRightColor: "#e7e5e4" }}>
        {hasDr ? (
          <>
            <Text style={{ fontSize: 10, color: drColor, fontWeight: "800", letterSpacing: 0.3, textDecorationLine: strike }}>
              {formatAmt(row.drAmount)}
            </Text>
            <Text style={{ fontSize: 8, color: drTagColor, fontWeight: "600", marginTop: 1 }}>Dr</Text>
          </>
        ) : (
          <Text style={{ fontSize: 11, color: "#d6d3d1" }}>—</Text>
        )}
      </View>

      {/* Col 3 — Credit (Cr) */}
      <View style={{ flex: 3, paddingHorizontal: 8, paddingVertical: 8, justifyContent: "center", alignItems: "flex-end", borderRightWidth: 1, borderRightColor: "#e7e5e4" }}>
        {hasCr ? (
          <>
            <Text style={{ fontSize: 10, color: crColor, fontWeight: "800", letterSpacing: 0.3, textDecorationLine: strike }}>
              {formatAmt(row.crAmount)}
            </Text>
            <Text style={{ fontSize: 8, color: crTagColor, fontWeight: "600", marginTop: 1 }}>Cr</Text>
          </>
        ) : (
          <Text style={{ fontSize: 11, color: "#d6d3d1" }}>—</Text>
        )}
      </View>

      {/* Col 4 — Running Balance (blank for voided rows — they don't affect balance) */}
      <View style={{ flex: 3, paddingHorizontal: 8, paddingVertical: 8, justifyContent: "center", alignItems: "flex-end" }}>
        {row.isVoided ? (
          <Text style={{ fontSize: 10, color: "#d6d3d1" }}>—</Text>
        ) : (
          <>
            <Text style={{ fontSize: 10, color: row.balance > 0 ? "#ef4444" : "#22c55e", fontWeight: "800", letterSpacing: 0.3 }}>
              {formatAmt(row.balance)}
            </Text>
            {row.balance > 0 && (
              <Text style={{ fontSize: 8, color: "#fca5a5", fontWeight: "600", marginTop: 1 }}>Due</Text>
            )}
            {row.balance === 0 && (
              <Text style={{ fontSize: 8, color: "#86efac", fontWeight: "600", marginTop: 1 }}>Nil</Text>
            )}
          </>
        )}
      </View>
    </View>
  );
}

// ─── Passbook Section ─────────────────────────────────────────────────────────
function PassbookSection({ allBills, deletedBills, transactions, safeNum, totalDebt }) {
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

  const rows = buildLedgerRows(allBills, deletedBills, transactions, safeNum);

  // totalDebt from customer record is the authoritative closing balance.
  // Ledger math can drift when bulk payments partially cover a later-deleted
  // bill — the server's total_debt is always correct, so we anchor to it.
  const closingBalance = totalDebt;

  // Totals only count active (non-voided) rows so the user sees
  // a meaningful Dr/Cr summary that aligns with the closing balance.
  const totalDr = rows.filter(r => !r.isVoided).reduce((s, r) => s + r.drAmount, 0);
  const totalCr = rows.filter(r => !r.isVoided).reduce((s, r) => s + r.crAmount, 0);

  return (
    <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
      {/* Toggle Button */}
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
          borderBottomLeftRadius: open ? 0 : 20,
          borderBottomRightRadius: open ? 0 : 20,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ backgroundColor: "#e5fc0115", width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" }}>
            <MaterialCommunityIcons name="book-open-page-variant" size={18} color="#e5fc01" />
          </View>
          <View>
            <Text style={{ color: "#e5fc01", fontWeight: "900", fontSize: 13, letterSpacing: 2.5, textTransform: "uppercase" }}>
              Passbook
            </Text>
            <Text style={{ color: "#ffffff50", fontWeight: "600", fontSize: 10, marginTop: 2 }}>
              {rows.length} entries · tap to {open ? "collapse" : "expand"}
            </Text>
          </View>
        </View>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Feather name="chevron-down" size={20} color="#e5fc01" />
        </Animated.View>
      </Pressable>

      {/* Ledger Table */}
      {open && (
        <View style={{ borderWidth: 1, borderTopWidth: 0, borderColor: "#e7e5e4", borderBottomLeftRadius: 20, borderBottomRightRadius: 20, overflow: "hidden", backgroundColor: "#fff" }}>

          {/* Column Headers */}
          <View style={{ flexDirection: "row", backgroundColor: "#1f2617", paddingVertical: 10 }}>
            {[
              { label: "DATE / PARTICULARS", flex: 4, align: "flex-start" },
              { label: "DEBIT (Dr)", flex: 3, align: "flex-end" },
              { label: "CREDIT (Cr)", flex: 3, align: "flex-end" },
              { label: "BALANCE", flex: 3, align: "flex-end" },
            ].map((col, i) => (
              <View key={col.label} style={{ flex: col.flex, paddingHorizontal: 10, alignItems: col.align, borderRightWidth: i < 3 ? 1 : 0, borderRightColor: "#ffffff15" }}>
                <Text style={{ color: "#e5fc01", fontSize: 7, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase" }}>
                  {col.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Sub-header legend */}
          <View style={{ flexDirection: "row", backgroundColor: "#fafaf9", paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: "#e7e5e4" }}>
            <View style={{ flex: 4, paddingHorizontal: 10, borderRightWidth: 1, borderRightColor: "#e7e5e4" }}>
              <Text style={{ fontSize: 8, color: "#d6d3d1", fontStyle: "italic" }}>invoices & payments</Text>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 3 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 1, backgroundColor: "#f59e0b" }} />
                  <Text style={{ fontSize: 7, color: "#b45309" }}>deleted · void</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 1, backgroundColor: "#22c55e" }} />
                  <Text style={{ fontSize: 7, color: "#16a34a" }}>manual payment</Text>
                </View>
              </View>
            </View>
            <View style={{ flex: 3, paddingHorizontal: 10, alignItems: "flex-end", borderRightWidth: 1, borderRightColor: "#e7e5e4" }}>
              <Text style={{ fontSize: 8, color: "#fca5a5", fontStyle: "italic" }}>amount owed ↑</Text>
            </View>
            <View style={{ flex: 3, paddingHorizontal: 10, alignItems: "flex-end", borderRightWidth: 1, borderRightColor: "#e7e5e4" }}>
              <Text style={{ fontSize: 8, color: "#86efac", fontStyle: "italic" }}>amount paid ↑</Text>
            </View>
            <View style={{ flex: 3, paddingHorizontal: 10, alignItems: "flex-end" }}>
              <Text style={{ fontSize: 8, color: "#a8a29e", fontStyle: "italic" }}>running due</Text>
            </View>
          </View>

          {/* Rows */}
          {rows.length === 0 ? (
            <View style={{ paddingVertical: 32, alignItems: "center" }}>
              <Text style={{ color: "#a8a29e", fontSize: 13, fontWeight: "600" }}>No transactions yet.</Text>
            </View>
          ) : (
            rows.map((row, idx) => (
              <LedgerRow key={row.id} row={row} index={idx} isLast={idx === rows.length - 1} />
            ))
          )}

          {/* Totals Row */}
          {rows.length > 0 && (
            <View style={{ flexDirection: "row", backgroundColor: "#f5f5f4", borderTopWidth: 2, borderTopColor: "#1f2617", paddingVertical: 10 }}>
              <View style={{ flex: 4, paddingHorizontal: 10, borderRightWidth: 1, borderRightColor: "#d6d3d1", justifyContent: "center" }}>
                <Text style={{ fontSize: 10, color: "#1c1917", fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 }}>Total</Text>
              </View>
              <View style={{ flex: 3, paddingHorizontal: 8, alignItems: "flex-end", borderRightWidth: 1, borderRightColor: "#d6d3d1" }}>
                <Text style={{ fontSize: 10, color: "#ef4444", fontWeight: "800" }}>{formatAmt(totalDr)}</Text>
              </View>
              <View style={{ flex: 3, paddingHorizontal: 8, alignItems: "flex-end", borderRightWidth: 1, borderRightColor: "#d6d3d1" }}>
                <Text style={{ fontSize: 10, color: "#22c55e", fontWeight: "800" }}>{formatAmt(totalCr)}</Text>
              </View>
              <View style={{ flex: 3, paddingHorizontal: 8, alignItems: "flex-end" }}>
                <Text style={{ fontSize: 10, color: closingBalance > 0 ? "#ef4444" : "#22c55e", fontWeight: "800" }}>
                  {formatAmt(closingBalance)}
                </Text>
              </View>
            </View>
          )}

          {/* Closing Balance Banner */}
          {rows.length > 0 && (
            <View style={{ backgroundColor: "#1f2617", paddingHorizontal: 16, paddingVertical: 12, borderBottomLeftRadius: 19, borderBottomRightRadius: 19, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: "#ffffff50", fontSize: 9, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1.5 }}>
                Closing Balance
              </Text>
              <Text style={{ color: closingBalance > 0 ? "#ff6b6b" : "#4ade80", fontSize: 16, fontWeight: "900" }}>
                ₹{closingBalance.toLocaleString("en-IN")}
                <Text style={{ fontSize: 10, fontWeight: "600", color: closingBalance > 0 ? "#ff6b6b90" : "#4ade8090" }}>
                  {closingBalance > 0 ? "  Due" : "  Settled"}
                </Text>
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
    deletedBills = [],
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

  const formatDateLong = (d) =>
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
        msg += `• ${b.bill_number} (${formatDateLong(b.createdAt)}): ₹${pending}\n`;
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
                {customer.address || ""}
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

        {/* ── Passbook (3-column ledger) ── */}
        <PassbookSection
          allBills={allBills}
          deletedBills={deletedBills}
          transactions={transactions}
          safeNum={safeNum}
          totalDebt={totalDebt}
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
                        {formatDateLong(bill.createdAt)}
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
              allBills.map((bill) => (
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
                        {formatDateLong(bill.createdAt)}
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
              ))
            ))}
        </View>
      </ScrollView>

      {/* ── Sticky CTA ── */}
      {can("khata", "update") && (
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
        </View>
      )}

      {/* ── Payment Modal ── */}
      {can("khata", "update") && (
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
                A lump sum will automatically clear the{"\n"}oldest pending
                bills first.
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
        </Modal>
      )}
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
import { useState, useCallback, useMemo } from "react";
import { Alert, Keyboard } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { billApi } from "../api/billApi";
import { userApi } from "../api/userApi";
import { productApi } from "../api/productApi";

export function useBillDetail(billId) {
  const router = useRouter();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Profit & PIN
  const [isProfitVisible, setIsProfitVisible] = useState(false);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);

  // Payment
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentInput, setPaymentInput] = useState("");

  // Full edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editItems, setEditItems] = useState([]);
  const [editDiscount, setEditDiscount] = useState("0");
  const [editExtraFare, setEditExtraFare] = useState("0");
  const [productSearchModal, setProductSearchModal] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // ── Convert Estimate modal ─────────────────────────────────────────────────
  const [convertModalVisible, setConvertModalVisible] = useState(false);
  const [convertAmountPaid, setConvertAmountPaid] = useState("0");

  const safeNum = (val) => {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  };

  const fetchBill = async () => {
    if (!billId) return;
    try {
      setLoading(true);
      const res = await billApi.getById(billId);
      if (res.success) setBill(res.bill);
    } catch {
      Alert.alert("Error", "Failed to load bill details");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBill();
    }, [billId]),
  );

  // ── Profit calc ────────────────────────────────────────────────────────────
  const profitTotals = useMemo(() => {
    if (!bill) return { profit: 0, cost: 0, revenue: 0 };
    let cost = 0,
      itemsTotal = 0;
    bill.items.forEach((item) => {
      cost += safeNum(item.purchase_price) * safeNum(item.quantity);
      itemsTotal += safeNum(item.sale_price) * safeNum(item.quantity);
    });
    const revenue =
      itemsTotal + safeNum(bill.extra_fare) - safeNum(bill.discount);
    return { profit: revenue - cost, cost, revenue };
  }, [bill]);

  // ── Edit mode calc ─────────────────────────────────────────────────────────
  const editTotals = useMemo(() => {
    let itemsTotal = 0;
    editItems.forEach((item) => {
      itemsTotal += safeNum(item.sale_price) * safeNum(item.quantity);
    });
    return {
      itemsTotal,
      finalTotal: itemsTotal + safeNum(editExtraFare) - safeNum(editDiscount),
    };
  }, [editItems, editDiscount, editExtraFare]);

  const startEditing = async () => {
    setEditItems(bill.items.map((item) => ({ ...item })));
    setEditDiscount(String(bill.discount || 0));
    setEditExtraFare(String(bill.extra_fare || 0));
    setIsEditing(true);
    if (catalog.length === 0) {
      const res = await productApi.getAll("all");
      if (res.success) setCatalog(res.products || []);
    }
  };

  const updateEditItem = (index, field, value) => {
    const updated = [...editItems];
    updated[index][field] = value;
    setEditItems(updated);
  };
  const removeEditItem = (index) => {
    const updated = [...editItems];
    updated.splice(index, 1);
    setEditItems(updated);
  };
  const addNewProductToBill = (product) => {
    const isWholesale = bill.price_mode === "Wholesale";
    setEditItems([
      ...editItems,
      {
        product_id: product._id,
        item_name: product.item_name,
        quantity: 1,
        sale_price: isWholesale
          ? safeNum(product.wholesale_price)
          : safeNum(product.retail_price),
        purchase_price: safeNum(product.purchase_price),
        unit: product.unit || "pcs",
        brand_applied: product.default_brand_name || "Generic",
      },
    ]);
    setProductSearchModal(false);
    setSearchQuery("");
  };

  const saveEdits = async () => {
    if (editItems.length === 0)
      return Alert.alert("Error", "Bill must have at least one item.");
    setIsProcessing(true);
    try {
      const res = await billApi.update(billId, {
        items: editItems.map((i) => ({
          ...i,
          quantity: safeNum(i.quantity),
          sale_price: safeNum(i.sale_price),
        })),
        discount: safeNum(editDiscount),
        extra_fare: safeNum(editExtraFare),
        total_amount: editTotals.finalTotal,
      });
      if (res.success) {
        setBill(res.bill);
        setIsEditing(false);
        Alert.alert("Success", "Invoice updated.");
      }
    } catch {
      Alert.alert("Error", "Failed to update invoice.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ── PIN verify ─────────────────────────────────────────────────────────────
  const handleVerifyPin = async () => {
    if (pinInput.length !== 4)
      return Alert.alert("Error", "PIN must be 4 digits");
    Keyboard.dismiss();
    setIsVerifyingPin(true);
    try {
      const res = await userApi.verifyPin(pinInput);
      if (res.success) {
        setIsProfitVisible(true);
        setPinModalVisible(false);
        setPinInput("");
      }
    } catch {
      Alert.alert("Access Denied", "Incorrect PIN");
    } finally {
      setIsVerifyingPin(false);
    }
  };

  // ── Payment ────────────────────────────────────────────────────────────────
  const handleUpdatePayment = async () => {
    const newAmount = safeNum(paymentInput);
    if (newAmount <= 0) return Alert.alert("Error", "Invalid amount");
    const updatedTotalPaid = safeNum(bill.amount_paid) + newAmount;
    setIsProcessing(true);
    try {
      const res = await billApi.update(billId, {
        amount_paid: updatedTotalPaid,
      });
      if (res.success) {
        setBill(res.bill);
        setPaymentModalVisible(false);
        setPaymentInput("");
      }
    } catch {
      Alert.alert("Error", "Failed to update payment");
    } finally {
      setIsProcessing(false);
    }
  };

  // ── DELETE BILL ────────────────────────────────────────────────────────────
  // Soft-deletes the bill. For real bills the backend also reverses khata debt.
  const handleDeleteBill = () => {
    const isEstimate = bill?.is_estimate;
    Alert.alert(
      isEstimate ? "Delete Estimate" : "Delete Bill",
      isEstimate
        ? "This estimate will be moved to the recycle bin."
        : "This bill will be moved to the recycle bin and the customer's outstanding balance will be adjusted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsProcessing(true);
            try {
              await billApi.delete(billId);
              router.back();
            } catch {
              Alert.alert("Error", "Failed to delete.");
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ],
    );
  };

  // ── CONVERT ESTIMATE → BILL ────────────────────────────────────────────────
  const openConvertModal = () => {
    setConvertAmountPaid("0");
    setConvertModalVisible(true);
  };

  const handleConvertEstimate = async () => {
    const paid = safeNum(convertAmountPaid);
    setIsProcessing(true);
    try {
      const res = await billApi.convertEstimate(billId, {
        customer_id: bill.customer_id?._id || bill.customer_id || null,
        amount_paid: paid,
      });
      if (res.success) {
        setConvertModalVisible(false);
        setBill(res.bill);
        Alert.alert(
          "Converted!",
          "Estimate has been converted to a real bill.",
        );
      }
    } catch {
      Alert.alert("Error", "Conversion failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredCatalog = useMemo(() => {
    if (!searchQuery) return catalog;
    return catalog.filter((p) =>
      p.item_name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [catalog, searchQuery]);

  return {
    bill,
    loading,
    isProcessing,
    safeNum,
    profitTotals,
    isProfitVisible,
    setIsProfitVisible,
    pinModalVisible,
    setPinModalVisible,
    pinInput,
    setPinInput,
    handleVerifyPin,
    isVerifyingPin,
    paymentModalVisible,
    setPaymentModalVisible,
    paymentInput,
    setPaymentInput,
    handleUpdatePayment,
    isEditing,
    setIsEditing,
    startEditing,
    saveEdits,
    editItems,
    updateEditItem,
    removeEditItem,
    editDiscount,
    setEditDiscount,
    editExtraFare,
    setEditExtraFare,
    editTotals,
    productSearchModal,
    setProductSearchModal,
    searchQuery,
    setSearchQuery,
    filteredCatalog,
    addNewProductToBill,
    // New exports
    handleDeleteBill,
    convertModalVisible,
    setConvertModalVisible,
    convertAmountPaid,
    setConvertAmountPaid,
    openConvertModal,
    handleConvertEstimate,
  };
}

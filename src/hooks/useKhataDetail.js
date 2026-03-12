import { useState, useCallback } from "react";
import { Alert, Keyboard } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { customerApi } from "../api/customerApi";

export function useKhataDetail(customerId) {
  const router = useRouter();

  const [data, setData] = useState({
    customer: null,
    unpaidBills: [],
    allBills: [],
    deletedBills: [],
    transactions: [],
  });
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");

  const safeNum = (val) => {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  const fetchKhata = async () => {
    if (!customerId) return;
    try {
      setLoading(true);
      const res = await customerApi.getKhata(customerId);
      if (res.success) {
        setData({
          customer: res.customer,
          unpaidBills: res.khata.unpaidBills || [],
          allBills: res.khata.allBills || [],
          deletedBills: res.khata.deletedBills || [],
          transactions: res.khata.transactions || [],
        });
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load Khata details");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchKhata();
    }, [customerId]),
  );

  const handleBulkPayment = async () => {
    const amount = safeNum(paymentAmount);
    if (amount <= 0)
      return Alert.alert("Error", "Please enter a valid amount.");

    if (amount > safeNum(data.customer?.total_debt)) {
      return Alert.alert(
        "Error",
        "Amount cannot exceed the total pending debt.",
      );
    }

    Keyboard.dismiss();
    setIsProcessing(true);
    try {
      const res = await customerApi.recordKhataPayment(customerId, { amount });
      if (res.success) {
        setPaymentModalVisible(false);
        setPaymentAmount("");
        Alert.alert(
          "Success",
          "Payment recorded and applied to pending bills!",
        );
        await fetchKhata();
      }
    } catch (error) {
      Alert.alert("Error", "Failed to process payment.");
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    ...data,
    loading,
    isProcessing,
    safeNum,
    paymentModalVisible,
    setPaymentModalVisible,
    paymentAmount,
    setPaymentAmount,
    handleBulkPayment,
  };
}
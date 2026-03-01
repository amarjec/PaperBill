import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { billApi } from '../api/billApi';

export function useBillDetail(billId) {
  const router = useRouter();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Modals State
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentInput, setPaymentInput] = useState('');
  
  const [brandModalVisible, setBrandModalVisible] = useState(false);
  const [targetBrand, setTargetBrand] = useState('');

  const fetchBill = async () => {
    if (!billId) return;
    try {
      setLoading(true);
      const res = await billApi.getById(billId);
      if (res.success) setBill(res.bill);
    } catch (error) {
      Alert.alert('Error', 'Failed to load bill details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBill();
    }, [billId])
  );

  const handleDelete = () => {
    Alert.alert("Delete Bill", "Are you sure? This will reverse any Khata tracking associated with it.", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: async () => {
          setIsProcessing(true);
          try {
            await billApi.delete(billId);
            router.back();
          } catch (error) {
            Alert.alert("Error", "Failed to delete bill.");
          } finally {
            setIsProcessing(false);
          }
        } 
      }
    ]);
  };

  const handleUpdatePayment = async () => {
    const newAmount = Number(paymentInput);
    if (isNaN(newAmount) || newAmount < 0) return Alert.alert("Error", "Invalid amount");

    // Calculate total paid so far
    const updatedTotalPaid = (bill.amount_paid || 0) + newAmount;
    
    if (updatedTotalPaid > bill.total_amount) {
      return Alert.alert("Error", "Cannot pay more than the total bill amount.");
    }

    setIsProcessing(true);
    try {
      // The backend handles the Khata logic automatically based on the difference
      const res = await billApi.update(billId, { amount_paid: updatedTotalPaid });
      if (res.success) {
        setBill(res.bill);
        setPaymentModalVisible(false);
        setPaymentInput('');
        Alert.alert("Success", "Payment recorded successfully");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update payment");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConvertBrand = async () => {
    if (!targetBrand.trim()) return Alert.alert("Error", "Please enter a brand name");

    setIsProcessing(true);
    try {
      const res = await billApi.convertBrand(billId, targetBrand);
      if (res.success) {
        setBill(res.bill);
        setBrandModalVisible(false);
        setTargetBrand('');
        Alert.alert("Success", res.message);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to convert brand");
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    bill, loading, isProcessing, handleDelete,
    paymentModalVisible, setPaymentModalVisible, paymentInput, setPaymentInput, handleUpdatePayment,
    brandModalVisible, setBrandModalVisible, targetBrand, setTargetBrand, handleConvertBrand
  };
}
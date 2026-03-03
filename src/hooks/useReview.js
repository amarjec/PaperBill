import { useState, useMemo, useEffect } from 'react';
import { Alert, Keyboard } from 'react-native';
import { useApp } from '../context/AppContext';
import { billApi } from '../api/billApi';
import { userApi } from '../api/userApi';

export function useReview() {
  const { list, selectedCustomer, setList, setSelectedCustomer } = useApp();
  
  const [priceMode, setPriceMode] = useState('Retail'); 
  const [discount, setDiscount] = useState('');
  const [extraFare, setExtraFare] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isProfitVisible, setIsProfitVisible] = useState(false);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);

  // CRITICAL FIX: Safe Math Helper. This prevents 'NaN' from destroying the UI.
  const safeNum = (val) => {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  const cartItems = useMemo(() => Object.values(list || {}), [list]);

  const totals = useMemo(() => {
    let itemsTotal = 0;
    let totalCost = 0;

    cartItems.forEach(item => {
      const retail = safeNum(item.retail_price);
      const wholesale = safeNum(item.wholesale_price);
      const purchase = safeNum(item.purchase_price);
      const qty = safeNum(item.qty);

      const activePrice = priceMode === 'Wholesale' ? wholesale : retail;

      itemsTotal += (activePrice * qty);
      totalCost += (purchase * qty);
    });

    const finalTotal = itemsTotal + safeNum(extraFare) - safeNum(discount);
    const profit = finalTotal - totalCost;

    return { itemsTotal, finalTotal, profit };
  }, [cartItems, priceMode, discount, extraFare]);

  // Set initial amount paid to total once, without triggering constant re-renders
  useEffect(() => {
    if (amountPaid === '') {
      setAmountPaid(String(totals.finalTotal));
    }
  }, []);

  const handleVerifyPin = async () => {
    if (pinInput.length !== 4) return Alert.alert("Error", "PIN must be 4 digits");
    Keyboard.dismiss();
    setIsVerifyingPin(true);
    try {
      const res = await userApi.verifyPin(pinInput);
      if (res.success) {
        setIsProfitVisible(true);
        setPinModalVisible(false);
        setPinInput('');
      }
    } catch (error) {
      Alert.alert("Access Denied", "Incorrect PIN");
    } finally {
      setIsVerifyingPin(false);
    }
  };

  const generateBill = async (isEstimate = false) => {
    if (cartItems.length === 0) {
      Alert.alert("Error", "Cart is empty");
      return false;
    }

    setIsSubmitting(true);
    try {
      // Formatted strictly according to Bill.js Schema
      const formattedItems = cartItems.map(item => ({
        product_id: item._id,
        item_name: item.item_name,
        quantity: safeNum(item.qty),
        sale_price: priceMode === 'Wholesale' ? safeNum(item.wholesale_price) : safeNum(item.retail_price),
        purchase_price: safeNum(item.purchase_price),
        unit: item.unit || 'pcs',
        brand_applied: item.default_brand_name || 'Generic' 
      }));

      const payload = {
        customer_id: selectedCustomer?._id || null,
        items: formattedItems,
        is_estimate: isEstimate,
        price_mode: priceMode,
        extra_fare: safeNum(extraFare),
        discount: safeNum(discount),
        amount_paid: safeNum(amountPaid)
      };

      const res = await billApi.create(payload);
      
      if (res.success) {
        setList({});
        setSelectedCustomer(null);
        return true; 
      }
      return false;
    } catch (error) {
      Alert.alert("Error", "Failed to generate document.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    cartItems, selectedCustomer, priceMode, setPriceMode,
    discount, setDiscount, extraFare, setExtraFare, amountPaid, setAmountPaid,
    totals, isSubmitting, isProfitVisible, pinModalVisible, setPinModalVisible, 
    pinInput, setPinInput, isVerifyingPin, handleVerifyPin, generateBill, safeNum,
   setIsProfitVisible
  };
}
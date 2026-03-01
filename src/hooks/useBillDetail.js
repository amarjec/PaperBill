import { useState, useCallback, useMemo } from 'react';
import { Alert, Keyboard } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { billApi } from '../api/billApi';
import { userApi } from '../api/userApi';
import { productApi } from '../api/productApi'; // Needed to fetch catalog for adding items

export function useBillDetail(billId) {
  const router = useRouter();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Profit & PIN States
  const [isProfitVisible, setIsProfitVisible] = useState(false);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);

  // Payment State
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentInput, setPaymentInput] = useState('');

  // --- FULL EDIT MODE STATES ---
  const [isEditing, setIsEditing] = useState(false);
  const [editItems, setEditItems] = useState([]);
  const [editDiscount, setEditDiscount] = useState('0');
  const [editExtraFare, setEditExtraFare] = useState('0');
  
  // Catalog Search for Adding New Products
  const [productSearchModal, setProductSearchModal] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const safeNum = (val) => {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

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

  useFocusEffect(useCallback(() => { fetchBill(); }, [billId]));

  // --- Profit Calculation ---
  const profitTotals = useMemo(() => {
    if (!bill) return { profit: 0, cost: 0, revenue: 0 };
    let cost = 0;
    let itemsTotal = 0;
    bill.items.forEach(item => {
      cost += safeNum(item.purchase_price) * safeNum(item.quantity);
      itemsTotal += safeNum(item.sale_price) * safeNum(item.quantity);
    });
    const revenue = itemsTotal + safeNum(bill.extra_fare) - safeNum(bill.discount);
    return { profit: revenue - cost, cost, revenue };
  }, [bill]);

  // --- Edit Mode Live Calculations ---
  const editTotals = useMemo(() => {
    let itemsTotal = 0;
    editItems.forEach(item => {
      itemsTotal += safeNum(item.sale_price) * safeNum(item.quantity);
    });
    const finalTotal = itemsTotal + safeNum(editExtraFare) - safeNum(editDiscount);
    return { itemsTotal, finalTotal };
  }, [editItems, editDiscount, editExtraFare]);

  // --- FULL CONTROL ACTIONS ---

  const startEditing = async () => {
    // Create a deep copy of items to manipulate safely
    setEditItems(bill.items.map(item => ({ ...item })));
    setEditDiscount(String(bill.discount || 0));
    setEditExtraFare(String(bill.extra_fare || 0));
    setIsEditing(true);

    // Fetch catalog in background so it's ready if they click "Add Product"
    if (catalog.length === 0) {
      const res = await productApi.getAll('all'); 
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
    const isWholesale = bill.price_mode === 'Wholesale';
    const newItem = {
      product_id: product._id,
      item_name: product.item_name,
      quantity: 1,
      sale_price: isWholesale ? safeNum(product.wholesale_price) : safeNum(product.retail_price),
      purchase_price: safeNum(product.purchase_price),
      unit: product.unit || 'pcs',
      brand_applied: product.default_brand_name || 'Generic'
    };
    setEditItems([...editItems, newItem]);
    setProductSearchModal(false);
    setSearchQuery('');
  };

  const saveEdits = async () => {
    if (editItems.length === 0) return Alert.alert("Error", "Bill must have at least one item.");
    
    setIsProcessing(true);
    try {
      const payload = {
        items: editItems.map(item => ({
          ...item,
          quantity: safeNum(item.quantity),
          sale_price: safeNum(item.sale_price)
        })),
        discount: safeNum(editDiscount),
        extra_fare: safeNum(editExtraFare),
        total_amount: editTotals.finalTotal
      };

      const res = await billApi.update(billId, payload);
      if (res.success) {
        setBill(res.bill); // Update local view
        setIsEditing(false);
        Alert.alert("Success", "Invoice updated successfully.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update invoice.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- PIN & Standard Actions ---
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

  const handleUpdatePayment = async () => {
    const newAmount = safeNum(paymentInput);
    if (newAmount <= 0) return Alert.alert("Error", "Invalid amount");

    const updatedTotalPaid = safeNum(bill.amount_paid) + newAmount;
    setIsProcessing(true);
    try {
      const res = await billApi.update(billId, { amount_paid: updatedTotalPaid });
      if (res.success) {
        setBill(res.bill);
        setPaymentModalVisible(false);
        setPaymentInput('');
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update payment");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredCatalog = useMemo(() => {
    if (!searchQuery) return catalog;
    return catalog.filter(p => p.item_name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [catalog, searchQuery]);

  return {
    bill, loading, isProcessing, safeNum, profitTotals,
    isProfitVisible, setIsProfitVisible, pinModalVisible, setPinModalVisible, pinInput, setPinInput, handleVerifyPin,
    paymentModalVisible, setPaymentModalVisible, paymentInput, setPaymentInput, handleUpdatePayment,
    // Edit Mode Exports
    isEditing, setIsEditing, startEditing, saveEdits,
    editItems, updateEditItem, removeEditItem, editDiscount, setEditDiscount, editExtraFare, setEditExtraFare, editTotals,
    productSearchModal, setProductSearchModal, searchQuery, setSearchQuery, filteredCatalog, addNewProductToBill
  };
}
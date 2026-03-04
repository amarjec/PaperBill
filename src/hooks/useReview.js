import { useState, useMemo, useCallback } from 'react';
import { Alert, Keyboard } from 'react-native';
import { useApp } from '../context/AppContext';
import { billApi } from '../api/billApi';
import { userApi } from '../api/userApi';
import { productApi } from '../api/productApi';

export function useReview() {
  const { list, setList, selectedCustomer, setList: clearList, setSelectedCustomer } = useApp();

  const [priceMode, setPriceMode]       = useState('Retail');
  const [discount, setDiscount]         = useState('');
  const [extraFare, setExtraFare]       = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Amount paid — null means "not collecting now" (full paid assumed for estimates)
  const [collectingPayment, setCollectingPayment] = useState(false);
  const [amountPaid, setAmountPaid]               = useState('');

  // Profit sheet
  const [isProfitVisible, setIsProfitVisible]   = useState(false);
  const [pinModalVisible, setPinModalVisible]   = useState(false);
  const [pinInput, setPinInput]                 = useState('');
  const [isVerifyingPin, setIsVerifyingPin]     = useState(false);

  // Add product search
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchTerm, setSearchTerm]                 = useState('');
  const [searchResults, setSearchResults]           = useState([]);
  const [isSearching, setIsSearching]               = useState(false);

  const safeNum = (val) => { const n = Number(val); return isNaN(n) ? 0 : n; };

  // cartItems from global list — treated as LOCAL snapshots for this bill
  const cartItems = useMemo(() => Object.values(list || {}), [list]);

  const totals = useMemo(() => {
    let itemsTotal = 0;
    let totalCost  = 0;

    cartItems.forEach(item => {
      const price    = priceMode === 'Wholesale' ? safeNum(item.wholesale_price) : safeNum(item.retail_price);
      const purchase = safeNum(item.purchase_price);
      const qty      = safeNum(item.qty);
      itemsTotal += price * qty;
      totalCost  += purchase * qty;
    });

    const discountVal  = safeNum(discount);
    const extraFareVal = safeNum(extraFare);
    const finalTotal   = Math.max(0, itemsTotal + extraFareVal - discountVal);
    const profit       = finalTotal - totalCost;

    return { itemsTotal, finalTotal, profit, totalCost };
  }, [cartItems, priceMode, discount, extraFare]);

  // ── Local item editing (no DB change) ────────────────────────────────────
  const updateLocalQty = useCallback((productId, delta) => {
    setList(prev => {
      const updated = { ...prev };
      const item = updated[productId];
      if (!item) return prev;
      const newQty = Math.max(0, safeNum(item.qty) + delta);
      if (newQty === 0) {
        delete updated[productId];
      } else {
        updated[productId] = { ...item, qty: newQty };
      }
      return updated;
    });
  }, [setList]);

  const setLocalQty = useCallback((productId, qty) => {
    setList(prev => {
      const updated = { ...prev };
      if (!updated[productId]) return prev;
      if (qty <= 0) {
        delete updated[productId];
      } else {
        updated[productId] = { ...updated[productId], qty };
      }
      return updated;
    });
  }, [setList]);

  // Bill-only price override — stored as _overridePrice, never touches DB
  const setLocalPrice = useCallback((productId, price) => {
    setList(prev => {
      const updated = { ...prev };
      if (!updated[productId]) return prev;
      updated[productId] = { ...updated[productId], _overridePrice: price };
      return updated;
    });
  }, [setList]);

  const removeLocalItem = useCallback((productId) => {
    setList(prev => {
      const updated = { ...prev };
      delete updated[productId];
      return updated;
    });
  }, [setList]);

  // ── Product search (for "forgot to add" case) ─────────────────────────────
  const searchProducts = useCallback(async (term) => {
    if (!term.trim()) { setSearchResults([]); return; }
    setIsSearching(true);
    try {
      const data = await productApi.getAll('all');
      if (data.success) {
        const lower = term.toLowerCase();
        setSearchResults(
          (data.products || []).filter(p =>
            p.item_name?.toLowerCase().includes(lower)
          ).slice(0, 20)
        );
      }
    } catch {
      Alert.alert('Error', 'Could not search products.');
    } finally {
      setIsSearching(false);
    }
  }, []);

  const addProductFromSearch = useCallback((product) => {
    setList(prev => {
      const existing = prev[product._id];
      return {
        ...prev,
        [product._id]: { ...product, qty: (existing?.qty || 0) + 1 },
      };
    });
  }, [setList]);

  // ── PIN + profit ──────────────────────────────────────────────────────────
  const handleVerifyPin = async () => {
    if (pinInput.length !== 4) return Alert.alert('Error', 'PIN must be 4 digits');
    Keyboard.dismiss();
    setIsVerifyingPin(true);
    try {
      const res = await userApi.verifyPin(pinInput);
      if (res.success) {
        setIsProfitVisible(true);
        setPinModalVisible(false);
        setPinInput('');
      }
    } catch {
      Alert.alert('Access Denied', 'Incorrect PIN');
    } finally {
      setIsVerifyingPin(false);
    }
  };

  // ── Generate bill ─────────────────────────────────────────────────────────
  const generateBill = async (isEstimate = false) => {
    if (cartItems.length === 0) { Alert.alert('Error', 'Cart is empty'); return false; }

    setIsSubmitting(true);
    try {
      const formattedItems = cartItems.map(item => ({
        product_id:     item._id,
        item_name:      item.item_name,
        quantity:       safeNum(item.qty),
        sale_price:     item._overridePrice != null ? safeNum(item._overridePrice) : (priceMode === 'Wholesale' ? safeNum(item.wholesale_price) : safeNum(item.retail_price)),
        purchase_price: safeNum(item.purchase_price),
        unit:           item.unit || 'pcs',
        brand_applied:  item.default_brand_name || 'Generic',
      }));

      // Estimates never have payment/khata data — send zeros, backend ignores them
      const paid = isEstimate
        ? 0
        : collectingPayment
          ? Math.min(safeNum(amountPaid), totals.finalTotal)
          : totals.finalTotal; // full payment assumed if checkbox not ticked

      const payload = {
        customer_id: selectedCustomer?._id || null,
        items:       formattedItems,
        is_estimate: isEstimate,
        price_mode:  priceMode,
        extra_fare:  safeNum(extraFare),
        discount:    safeNum(discount),
        amount_paid: paid,
      };

      const res = await billApi.create(payload);
      if (res.success) {
        setList({});
        setSelectedCustomer(null);
        return true;
      }
      return false;
    } catch {
      Alert.alert('Error', 'Failed to generate document.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    // cart
    cartItems, selectedCustomer, priceMode, setPriceMode,
    // adjustments
    discount, setDiscount, extraFare, setExtraFare,
    // payment
    collectingPayment, setCollectingPayment, amountPaid, setAmountPaid,
    // totals
    totals, safeNum,
    // local item actions
    updateLocalQty, setLocalQty, setLocalPrice, removeLocalItem,
    // product search
    searchModalVisible, setSearchModalVisible,
    searchTerm, setSearchTerm,
    searchResults, isSearching, searchProducts,
    addProductFromSearch,
    // profit
    isProfitVisible, setIsProfitVisible,
    pinModalVisible, setPinModalVisible,
    pinInput, setPinInput, isVerifyingPin, handleVerifyPin,
    // submit
    isSubmitting, generateBill,
  };
}
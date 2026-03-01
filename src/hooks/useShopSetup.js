import { useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../api/userApi';
import { storageService } from '../services/storageService'; 

export function useShopSetup() {
  const { user, token, setUser } = useAuth(); 
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    shopName: '',
    address: '',
    number: '',
    pin: '',
    businessTypes: [] // Changed to an array for multiple selections
  });

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  // Logic to handle multiple business type toggles
  const toggleBusinessType = (type) => {
    setForm(prev => {
      const exists = prev.businessTypes.includes(type);
      return {
        ...prev,
        businessTypes: exists 
          ? prev.businessTypes.filter(t => t !== type) 
          : [...prev.businessTypes, type]
      };
    });
  };

  const handleSetup = async () => {
    const { shopName, address, number, pin, businessTypes } = form;

    // Validation
    if (!shopName || !address || !number || pin.length !== 4 || businessTypes.length === 0) {
      Alert.alert('Details Missing', 'Please fill all fields and select at least one business type.');
      return;
    }

    try {
      setLoading(true);

      // 1. Update Profile using the dedicated API service
      const profileRes = await userApi.updateProfile({
        business_name: shopName,
        phone_number: number,
        address: address,
        business_type: businessTypes // Backend expects an array or string, Mongoose will accept the array
      });

      // 2. Set Secure PIN using the correct POST method
      const pinRes = await userApi.setPin(pin);

      if (profileRes.success && pinRes.success) {
        const updatedUser = profileRes.user;

        // 3. Persist to storage and update context
        await storageService.saveAuth(token, updatedUser);
        setUser(updatedUser);
      }
    } catch (error) {
      console.error("Setup API Error:", error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 'Could not save shop details.';
      Alert.alert('Setup Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { form, updateField, toggleBusinessType, handleSetup, loading };
}
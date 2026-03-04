import { useState, useCallback, useEffect } from 'react';
import { Alert, Keyboard } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { userApi } from '../api/userApi';
import { authApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

export function useProfile() {
  const { user, setUser, updateSessionUser, logout: contextLogout } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Edit Profile Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', business_name: '', phone_number: '', address: '' });

  // Name-only update
  const [nameModalVisible, setNameModalVisible] = useState(false);

  // PIN Modal State
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinForm, setPinForm] = useState({ pin: '', confirmPin: '' });

  const fetchProfile = async () => {
    if (user?.role === 'Staff' || user?.permissions) {
      setProfile(user);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await userApi.getProfile();
      
      if (res.success) {
        setProfile(res.user);
        
        const needsUpdate = 
          user?.isPremium !== res.user.isPremium || 
          user?.has_inventory !== res.user.has_inventory;

        if (needsUpdate) {
          if (updateSessionUser) {
             updateSessionUser(res.user); 
          } else {
             setUser(res.user);    
          }
        }
      }
    } catch (error) {
      console.log("Failed to load profile", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => { 
      fetchProfile(); 
    }, []) 
  );

  const openEditModal = () => {
    setEditForm({
      name:          profile?.name          || '',
      business_name: profile?.business_name || '',
      phone_number:  profile?.phone_number  || '',
      address:       profile?.address       || '',
    });
    setEditModalVisible(true);
  };

  const openNameModal = () => {
    setNameModalVisible(true);
  };

  const handleUpdateName = async (newName) => {
    if (!newName.trim()) return Alert.alert('Error', 'Name cannot be empty.');
    setIsProcessing(true);
    try {
      const payload = {
        name:          newName.trim(),
        business_name: profile?.business_name || '',
        phone_number:  profile?.phone_number  || '',
        address:       profile?.address       || '',
      };
      const res = await userApi.updateProfile(payload);
      if (res.success) {
        setProfile(res.user);
        if (updateSessionUser) await updateSessionUser(res.user);
        setNameModalVisible(false);
        Alert.alert('Updated', 'Name updated successfully.');
      }
    } catch {
      Alert.alert('Error', 'Failed to update name.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!editForm.business_name.trim()) return Alert.alert("Error", "Business name is required.");
    
    setIsProcessing(true);
    try {
      const res = await userApi.updateProfile(editForm);
      if (res.success) {
        setProfile(res.user); // Updates local screen state
        
        if (updateSessionUser) {
          await updateSessionUser(res.user); 
        }

        setEditModalVisible(false);
        Alert.alert("Success", "Profile updated successfully!");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update profile.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSetPin = async () => {
    if (pinForm.pin.length !== 4) return Alert.alert("Error", "PIN must be exactly 4 digits.");
    if (pinForm.pin !== pinForm.confirmPin) return Alert.alert("Error", "PINs do not match.");

    Keyboard.dismiss();
    setIsProcessing(true);
    try {
      const res = await userApi.setPin(pinForm.pin);
      if (res.success) {
        setPinModalVisible(false);
        setPinForm({ pin: '', confirmPin: '' });
        Alert.alert("Secured", "Your Owner PIN has been successfully set.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to set PIN.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Logout", 
        style: "destructive",
        onPress: async () => {
          try {
            await authApi.logout(); 
            await contextLogout();  
          } catch (error) {
            Alert.alert("Error", "Logout failed. Please try again.");
          }
        }
      }
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account", 
      "Are you absolutely sure? This will delete your shop and log you out immediately.", 
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete Forever", 
          style: "destructive",
          onPress: async () => {
            try {
              await userApi.deleteAccount();
              await contextLogout(); 
            } catch (error) {
              Alert.alert("Error", "Failed to delete account.");
            }
          }
        }
      ]
    );
  };

  return {
    profile, loading, isProcessing, isStaff: user?.role === 'Staff' || !!user?.permissions,
    nameModalVisible, setNameModalVisible, openNameModal, handleUpdateName,
    editModalVisible, setEditModalVisible, editForm, setEditForm, openEditModal, handleUpdateProfile,
    pinModalVisible, setPinModalVisible, pinForm, setPinForm, handleSetPin,
    handleLogout, handleDeleteAccount
  };
}
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { staffApi } from '../api/staffApi';

const DEFAULT_PERMISSIONS = {
  bills: { create: false, read: true, update: false, delete: false },
  products: { create: false, read: true, update: false, delete: false },
  customers: { create: false, read: true, update: false, delete: false },
  khata: { create: false, read: true, update: false, delete: false }
};

export function useStaff() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Modal & Form State
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    assigned_pin: '',
    status: 'Active',
    permissions: JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS)) // Deep copy
  });

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await staffApi.getAll();
      if (res.success) setStaffList(res.staff);
    } catch (error) {
      Alert.alert("Error", "Failed to load staff.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchStaff(); }, []));

  const openAddModal = () => {
    setFormData({
      name: '', phone_number: '', assigned_pin: '', status: 'Active',
      permissions: JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS))
    });
    setIsEditing(false);
    setEditId(null);
    setModalVisible(true);
  };

  const openEditModal = (staff) => {
    setFormData({
      name: staff.name,
      phone_number: staff.phone_number,
      assigned_pin: '', // Keep blank for security unless they want to change it
      status: staff.status,
      permissions: staff.permissions || JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS))
    });
    setIsEditing(true);
    setEditId(staff._id);
    setModalVisible(true);
  };

  const togglePermission = (module, action) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          ...prev.permissions[module],
          [action]: !prev.permissions[module][action]
        }
      }
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone_number) {
      return Alert.alert("Error", "Name and phone number are required.");
    }
    if (!isEditing && (!formData.assigned_pin || formData.assigned_pin.length !== 4)) {
      return Alert.alert("Error", "A 4-digit PIN is required for new staff.");
    }

    setIsProcessing(true);
    try {
      if (isEditing) {
        // Only send PIN if they typed a new one
        const payload = { ...formData };
        if (!payload.assigned_pin) delete payload.assigned_pin; 
        
        await staffApi.update(editId, payload);
        Alert.alert("Success", "Staff updated successfully");
      } else {
        await staffApi.add(formData);
        Alert.alert("Success", "Staff member added successfully");
      }
      setModalVisible(false);
      fetchStaff();
    } catch (error) {
      Alert.alert("Error", error?.response?.data?.message || "Operation failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert("Remove Staff", "Are you sure? They will lose access immediately.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive",
        onPress: async () => {
          try {
            await staffApi.delete(id);
            fetchStaff();
          } catch (error) {
            Alert.alert("Error", "Failed to remove staff.");
          }
        }
      }
    ]);
  };

  return {
    staffList, loading, isProcessing,
    modalVisible, setModalVisible, isEditing, formData, setFormData,
    openAddModal, openEditModal, togglePermission, handleSubmit, handleDelete
  };
}
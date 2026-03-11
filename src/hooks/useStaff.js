import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { staffApi } from '../api/staffApi';

// category, subCategory, products → read is always true (not shown in UI)
// bills → read always true; expose: create, and manage (update+delete)
// customers → expose: read, manage (create+update+delete)
// khata → expose: read, manage (update — khata has no create/delete from staff)
const DEFAULT_PERMISSIONS = {
  category:    { create: false, read: true, update: false, delete: false },
  subCategory: { create: false, read: true, update: false, delete: false },
  products:    { create: false, read: true, update: false, delete: false },
  customers:   { create: false, read: false, update: false, delete: false },
  bills:       { create: true, read: true,  update: false, delete: false },
  khata:       { create: false, read: false, update: false, delete: false },
};

export function useStaff() {
  const [staffList, setStaffList]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing]       = useState(false);
  const [editId, setEditId]             = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    assigned_pin: '',
    status: 'Active',
    permissions: JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS)),
  });

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await staffApi.getAll();
      if (res.success) setStaffList(res.staff);
    } catch {
      Alert.alert('Error', 'Failed to load staff.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchStaff(); }, []));

  const openAddModal = () => {
    setFormData({
      name: '', phone_number: '', assigned_pin: '', status: 'Active',
      permissions: JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS)),
    });
    setIsEditing(false);
    setEditId(null);
    setModalVisible(true);
  };

  const openEditModal = (staff) => {
    // Merge incoming permissions over defaults so all keys exist
    const merged = JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS));
    const incoming = staff.permissions || {};
    Object.keys(merged).forEach(mod => {
      if (incoming[mod]) {
        merged[mod] = { ...merged[mod], ...incoming[mod] };
      }
    });
    // Enforce always-true reads
    merged.category.read    = true;
    merged.subCategory.read = true;
    merged.products.read    = true;
    merged.bills.read       = true;

    setFormData({
      name: staff.name,
      phone_number: staff.phone_number,
      assigned_pin: '',
      status: staff.status,
      permissions: merged,
    });
    setIsEditing(true);
    setEditId(staff._id);
    setModalVisible(true);
  };

  // ── Granular toggle (used internally) ──────────────────────────────────────
  const _setPermField = (module, field, value) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: { ...prev.permissions[module], [field]: value },
      },
    }));
  };

  // ── Smart toggles for the new UI ───────────────────────────────────────────

  /** category: single toggle → create+update+delete */
  const toggleManageCategory = (val) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        category: { ...prev.permissions.category, create: val, update: val, delete: val },
      },
    }));
  };

  /** subCategory: single toggle → create+update+delete */
  const toggleManageSubCategory = (val) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        subCategory: { ...prev.permissions.subCategory, create: val, update: val, delete: val },
      },
    }));
  };

  /** products: single toggle → create+update+delete */
  const toggleManageProducts = (val) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        products: { ...prev.permissions.products, create: val, update: val, delete: val },
      },
    }));
  };

  /** customers read toggle — turning off also disables manage */
  const toggleCustomerRead = (val) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        customers: {
          ...prev.permissions.customers,
          read: val,
          // if read is revoked, manage must go too
          ...(val ? {} : { create: false, update: false, delete: false }),
        },
      },
    }));
  };

  /** customers manage → create+update+delete (only callable when read=true) */
  const toggleManageCustomers = (val) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        customers: { ...prev.permissions.customers, create: val, update: val, delete: val },
      },
    }));
  };

  /** bills: create toggle */
  const toggleBillCreate = (val) => _setPermField('bills', 'create', val);

  /** bills: manage → update+delete */
  const toggleManageBills = (val) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        bills: { ...prev.permissions.bills, update: val, delete: val },
      },
    }));
  };

  /** khata read toggle — turning off also disables manage */
  const toggleKhataRead = (val) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        khata: {
          ...prev.permissions.khata,
          read: val,
          ...(val ? {} : { update: false }),
        },
      },
    }));
  };

  /** khata manage → update */
  const toggleManageKhata = (val) => _setPermField('khata', 'update', val);

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!formData.name || !formData.phone_number) {
      return Alert.alert('Error', 'Name and phone number are required.');
    }
    if (!isEditing && (!formData.assigned_pin || formData.assigned_pin.length !== 4)) {
      return Alert.alert('Error', 'A 4-digit PIN is required for new staff.');
    }

    setIsProcessing(true);
    try {
      if (isEditing) {
        const payload = { ...formData };
        if (!payload.assigned_pin) delete payload.assigned_pin;
        await staffApi.update(editId, payload);
        Alert.alert('Success', 'Staff updated successfully');
      } else {
        await staffApi.add(formData);
        Alert.alert('Success', 'Staff member added successfully');
      }
      setModalVisible(false);
      fetchStaff();
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Operation failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Remove Staff', 'Are you sure? They will lose access immediately.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          try {
            await staffApi.delete(id);
            fetchStaff();
          } catch {
            Alert.alert('Error', 'Failed to remove staff.');
          }
        },
      },
    ]);
  };

  return {
    staffList, loading, isProcessing,
    modalVisible, setModalVisible, isEditing, formData, setFormData,
    openAddModal, openEditModal, handleSubmit, handleDelete,
    // new permission toggles
    toggleManageCategory,
    toggleManageSubCategory,
    toggleManageProducts,
    toggleCustomerRead,
    toggleManageCustomers,
    toggleBillCreate,
    toggleManageBills,
    toggleKhataRead,
    toggleManageKhata,
  };
}
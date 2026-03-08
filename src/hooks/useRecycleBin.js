import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { recycleBinApi } from '../api/recycleBinApi'; // see note at bottom

export function useRecycleBin() {
  const [items, setItems]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selected, setSelected]       = useState(new Set()); // Set of "_id" strings
  const [selectMode, setSelectMode]   = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchBin = async () => {
    try {
      setLoading(true);
      const res = await recycleBinApi.getAll();
      if (res.success) setItems(res.items);
    } catch {
      Alert.alert('Error', 'Failed to load recycle bin.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => {
    fetchBin();
    return () => { setSelected(new Set()); setSelectMode(false); };
  }, []));

  // ── Selection helpers ──────────────────────────────────────────────────────
  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(items.map(i => i._id)));
  const clearSelection = () => { setSelected(new Set()); setSelectMode(false); };

  const enterSelectMode = (id) => {
    setSelectMode(true);
    setSelected(new Set([id]));
  };

  // ── Restore ────────────────────────────────────────────────────────────────
  const _restorePayload = (ids) =>
    items.filter(i => ids.includes(i._id)).map(i => ({ id: i._id, type: i._type }));

  const restoreOne = (item) => {
    Alert.alert('Restore', `Restore "${item._displayName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Restore', onPress: async () => {
          setIsProcessing(true);
          try {
            await recycleBinApi.restore([{ id: item._id, type: item._type }]);
            fetchBin();
          } catch { Alert.alert('Error', 'Restore failed.'); }
          finally { setIsProcessing(false); }
        },
      },
    ]);
  };

  const restoreSelected = () => {
    const ids = [...selected];
    Alert.alert('Restore', `Restore ${ids.length} item(s)?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Restore', onPress: async () => {
          setIsProcessing(true);
          try {
            await recycleBinApi.restore(_restorePayload(ids));
            clearSelection();
            fetchBin();
          } catch { Alert.alert('Error', 'Restore failed.'); }
          finally { setIsProcessing(false); }
        },
      },
    ]);
  };

  // ── Hard delete ────────────────────────────────────────────────────────────
  const hardDeleteOne = (item) => {
    Alert.alert(
      'Delete Forever',
      `Permanently delete "${item._displayName}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever', style: 'destructive', onPress: async () => {
            setIsProcessing(true);
            try {
              await recycleBinApi.hardDelete([{ id: item._id, type: item._type }]);
              fetchBin();
            } catch { Alert.alert('Error', 'Delete failed.'); }
            finally { setIsProcessing(false); }
          },
        },
      ]
    );
  };

  const hardDeleteSelected = () => {
    const ids = [...selected];
    Alert.alert(
      'Delete Forever',
      `Permanently delete ${ids.length} item(s)? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever', style: 'destructive', onPress: async () => {
            setIsProcessing(true);
            try {
              await recycleBinApi.hardDelete(_restorePayload(ids));
              clearSelection();
              fetchBin();
            } catch { Alert.alert('Error', 'Delete failed.'); }
            finally { setIsProcessing(false); }
          },
        },
      ]
    );
  };

  // ── Empty bin ──────────────────────────────────────────────────────────────
  const emptyBin = () => {
    if (items.length === 0) return;
    Alert.alert(
      'Empty Recycle Bin',
      `Permanently delete all ${items.length} item(s)? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Empty Bin', style: 'destructive', onPress: async () => {
            setIsProcessing(true);
            try {
              await recycleBinApi.empty();
              clearSelection();
              fetchBin();
            } catch { Alert.alert('Error', 'Failed to empty bin.'); }
            finally { setIsProcessing(false); }
          },
        },
      ]
    );
  };

  return {
    items, loading, isProcessing,
    selected, selectMode, setSelectMode,
    toggleSelect, selectAll, clearSelection, enterSelectMode,
    restoreOne, restoreSelected,
    hardDeleteOne, hardDeleteSelected,
    emptyBin,
  };
}
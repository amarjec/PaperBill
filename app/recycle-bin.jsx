import React from 'react';
import {
  View, Text, ScrollView, Pressable,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRecycleBin } from '@/src/hooks/useRecycleBin';

// ─── Type config ──────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  Customer:    { icon: 'user',       label: 'Customer',    color: '#3b9eff', bg: 'rgba(59,158,255,0.1)'  },
  Product:     { icon: 'box',        label: 'Product',     color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
  Bill:        { icon: 'file-text',  label: 'Bill',        color: '#a855f7', bg: 'rgba(168,85,247,0.1)'  },
  Category:    { icon: 'tag',        label: 'Category',    color: '#10b981', bg: 'rgba(16,185,129,0.1)'  },
  Subcategory: { icon: 'folder',     label: 'Sub-Category',color: '#f97316', bg: 'rgba(249,115,22,0.1)'  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const formatTime = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

const timeAgo = (d) => {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)    return 'just now';
  if (mins < 60)   return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days < 30)   return `${days}d ago`;
  return formatDate(d);
};

// ─── Single item card ─────────────────────────────────────────────────────────
const BinCard = ({ item, isSelected, selectMode, onPress, onLongPress, onRestore, onHardDelete }) => {
  const cfg = TYPE_CONFIG[item._type] || TYPE_CONFIG.Product;

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={300}
      activeOpacity={0.8}
      style={{
        backgroundColor: '#fff',
        borderRadius: 20,
        marginBottom: 10,
        borderWidth: 1.5,
        borderColor: isSelected ? '#1f2617' : '#f0ece6',
        shadowColor: '#c8c0b4',
        shadowOpacity: 0.15,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
        overflow: 'hidden',
      }}
    >
      {/* Selection indicator stripe */}
      {isSelected && (
        <View style={{ height: 3, backgroundColor: '#1f2617' }} />
      )}

      <View style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {/* Checkbox / Type icon */}
        <View style={{ position: 'relative' }}>
          <View style={{
            width: 42, height: 42, borderRadius: 12,
            backgroundColor: cfg.bg,
            alignItems: 'center', justifyContent: 'center',
          }}>
            {selectMode ? (
              <View style={{
                width: 20, height: 20, borderRadius: 6,
                backgroundColor: isSelected ? '#1f2617' : 'transparent',
                borderWidth: 2, borderColor: isSelected ? '#1f2617' : '#c8c0b4',
                alignItems: 'center', justifyContent: 'center',
              }}>
                {isSelected && <Feather name="check" size={12} color="#e5fc01" />}
              </View>
            ) : (
              <Feather name={cfg.icon} size={18} color={cfg.color} />
            )}
          </View>
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <View style={{
              backgroundColor: cfg.bg,
              paddingHorizontal: 6, paddingVertical: 2,
              borderRadius: 5,
            }}>
              <Text style={{ fontSize: 9, fontWeight: '700', color: cfg.color, letterSpacing: 0.5 }}>
                {cfg.label.toUpperCase()}
              </Text>
            </View>
            {item._type === 'Bill' && item.total_amount != null && (
              <Text style={{ fontSize: 10, color: '#a89a8a', fontWeight: '600' }}>
                ₹{Number(item.total_amount).toLocaleString('en-IN')}
              </Text>
            )}
          </View>

          <Text style={{ fontSize: 15, fontWeight: '800', color: '#1f2617', letterSpacing: -0.3 }} numberOfLines={1}>
            {item._displayName}
          </Text>

          {/* Audit row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <Feather name="trash-2" size={10} color="#c8c0b4" />
            <Text style={{ fontSize: 11, color: '#b0a090', fontWeight: '600' }}>
              {item.deleted_by ? `by ${item.deleted_by}` : 'Deleted'}
              {item.deleted_at ? `  ·  ${timeAgo(item.deleted_at)}` : ''}
            </Text>
          </View>
          <Text style={{ fontSize: 10, color: '#c8c0b4', fontWeight: '500', marginTop: 1 }}>
            {formatDate(item.deleted_at)}  {formatTime(item.deleted_at)}
          </Text>
        </View>

        {/* Action buttons (hidden in select mode) */}
        {!selectMode && (
          <View style={{ gap: 6 }}>
            <Pressable
              onPress={() => onRestore(item)}
              style={{
                backgroundColor: '#f0fdf4',
                borderWidth: 1, borderColor: '#bbf7d0',
                borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
                alignItems: 'center',
              }}
            >
              <MaterialCommunityIcons name="restore" size={16} color="#16a34a" />
              <Text style={{ fontSize: 9, color: '#16a34a', fontWeight: '700', marginTop: 1 }}>
                Restore
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onHardDelete(item)}
              style={{
                backgroundColor: '#fff1f2',
                borderWidth: 1, borderColor: '#fecdd3',
                borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
                alignItems: 'center',
              }}
            >
              <Feather name="trash-2" size={14} color="#e11d48" />
              <Text style={{ fontSize: 9, color: '#e11d48', fontWeight: '700', marginTop: 1 }}>
                Delete
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ─── Empty state ──────────────────────────────────────────────────────────────
const EmptyBin = () => (
  <View style={{ alignItems: 'center', marginTop: 80, opacity: 0.45 }}>
    <MaterialCommunityIcons name="delete-empty-outline" size={56} color="#393f35" />
    <Text style={{ color: '#1f2617', fontWeight: '800', fontSize: 16, marginTop: 14 }}>
      Recycle Bin is Empty
    </Text>
    <Text style={{ color: '#8a8070', fontSize: 12, textAlign: 'center', marginTop: 6, paddingHorizontal: 40 }}>
      Deleted items will appear here. You can restore them or delete forever.
    </Text>
  </View>
);

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function RecycleBinScreen() {
  const router = useRouter();
  const {
    items, loading, isProcessing,
    selected, selectMode, setSelectMode,
    toggleSelect, selectAll, clearSelection, enterSelectMode,
    restoreOne, restoreSelected,
    hardDeleteOne, hardDeleteSelected,
    emptyBin,
  } = useRecycleBin();

  const selectedCount = selected.size;
  const allSelected   = selectedCount === items.length && items.length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f7f4ef' }}>

      {/* ── Header ── */}
      <View style={{
        paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {selectMode ? (
          /* Select mode header */
          <>
            <Pressable
              onPress={clearSelection}
              style={{ backgroundColor: '#e8e4de', width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}
            >
              <Feather name="x" size={17} color="#1f2617" />
            </Pressable>

            <Pressable onPress={allSelected ? clearSelection : selectAll}>
              <Text style={{ color: '#1f2617', fontWeight: '800', fontSize: 15 }}>
                {selectedCount} selected
              </Text>
            </Pressable>

            <Pressable
              onPress={allSelected ? clearSelection : selectAll}
              style={{ backgroundColor: '#e8e4de', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 }}
            >
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#1f2617' }}>
                {allSelected ? 'Deselect All' : 'Select All'}
              </Text>
            </Pressable>
          </>
        ) : (
          /* Normal header */
          <>
            <Pressable
              onPress={() => router.back()}
              style={{ backgroundColor: '#e8e4de', width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}
            >
              <Feather name="arrow-left" size={17} color="#1f2617" />
            </Pressable>

            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 17, fontWeight: '900', color: '#1f2617', letterSpacing: -0.5 }}>
                Recycle Bin
              </Text>
              {items.length > 0 && (
                <Text style={{ fontSize: 10, color: '#a89a8a', fontWeight: '600', marginTop: 1 }}>
                  {items.length} item{items.length !== 1 ? 's' : ''}
                </Text>
              )}
            </View>

            {/* Empty bin button */}
            <Pressable
              onPress={emptyBin}
              disabled={items.length === 0}
              style={{
                backgroundColor: items.length > 0 ? '#fff1f2' : '#f0ece6',
                borderWidth: 1,
                borderColor: items.length > 0 ? '#fecdd3' : '#e8e4de',
                paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
                flexDirection: 'row', alignItems: 'center', gap: 5,
              }}
            >
              <MaterialCommunityIcons
                name="delete-sweep-outline"
                size={15}
                color={items.length > 0 ? '#e11d48' : '#c8c0b4'}
              />
              <Text style={{
                fontSize: 11, fontWeight: '800',
                color: items.length > 0 ? '#e11d48' : '#c8c0b4',
              }}>
                Empty
              </Text>
            </Pressable>
          </>
        )}
      </View>

      {/* ── List ── */}
      {loading ? (
        <ActivityIndicator size="large" color="#1f2617" style={{ marginTop: 60 }} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        >
          {items.length === 0 ? (
            <EmptyBin />
          ) : (
            items.map(item => (
              <BinCard
                key={`${item._type}-${item._id}`}
                item={item}
                isSelected={selected.has(item._id)}
                selectMode={selectMode}
                onPress={() => {
                  if (selectMode) toggleSelect(item._id);
                  // else: no-op tap — actions are via the inline buttons
                }}
                onLongPress={() => enterSelectMode(item._id)}
                onRestore={restoreOne}
                onHardDelete={hardDeleteOne}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* ── Selection action bar (appears when in select mode) ── */}
      {selectMode && selectedCount > 0 && (
        <View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          backgroundColor: '#fff',
          borderTopWidth: 1, borderTopColor: '#f0ece6',
          paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32,
          flexDirection: 'row', gap: 10,
        }}>
          {/* Restore selected */}
          <Pressable
            onPress={restoreSelected}
            disabled={isProcessing}
            style={{
              flex: 1,
              backgroundColor: '#f0fdf4',
              borderWidth: 1.5, borderColor: '#bbf7d0',
              borderRadius: 16, paddingVertical: 14,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#16a34a" />
            ) : (
              <>
                <MaterialCommunityIcons name="restore" size={18} color="#16a34a" />
                <Text style={{ color: '#16a34a', fontWeight: '800', fontSize: 13 }}>
                  Restore ({selectedCount})
                </Text>
              </>
            )}
          </Pressable>

          {/* Hard delete selected */}
          <Pressable
            onPress={hardDeleteSelected}
            disabled={isProcessing}
            style={{
              flex: 1,
              backgroundColor: '#1f2617',
              borderRadius: 16, paddingVertical: 14,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#e5fc01" />
            ) : (
              <>
                <Feather name="trash-2" size={16} color="#e5fc01" />
                <Text style={{ color: '#e5fc01', fontWeight: '800', fontSize: 13 }}>
                  Delete ({selectedCount})
                </Text>
              </>
            )}
          </Pressable>
        </View>
      )}

    </SafeAreaView>
  );
}
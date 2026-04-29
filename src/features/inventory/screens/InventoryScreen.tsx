import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useInventory } from '../hooks/useInventory';

const stockItems = [
  { id: '1', name: 'Paracetamol 500mg', stock: 'In Stock', qty: 150, price: 'Rs 25', risk: 'normal' },
  { id: '2', name: 'Amoxicillin 250mg', stock: 'Low', qty: 8, price: 'Rs 85', risk: 'low' },
  { id: '3', name: 'Cetirizine 10mg', stock: 'In Stock', qty: 45, price: 'Rs 35', risk: 'normal' },
  { id: '4', name: 'Metformin 500mg', stock: 'Critical', qty: 6, price: 'Rs 70', risk: 'critical' },
];

export const InventoryScreen = () => {
  const { lowStockCount } = useInventory();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Inventory</Text>
        <View style={styles.quickAdd}>
          <Text style={styles.quickAddText}>+ Quick Add</Text>
        </View>
      </View>

      <View style={styles.searchRow}>
        <Text style={styles.searchText}>Search medicine or barcode...</Text>
      </View>

      <View style={styles.chipsRow}>
        <Text style={styles.chipActive}>All (4)</Text>
        <Text style={styles.chip}>{`Low Stock (${lowStockCount || 2})`}</Text>
        <Text style={styles.chip}>Expiring (1)</Text>
      </View>

      {stockItems.map(item => (
        <View key={item.id} style={styles.itemCard}>
          <View style={styles.itemTopRow}>
            <Text style={styles.itemTitle}>{item.name}</Text>
            <Text
              style={[
                styles.stockBadge,
                item.risk === 'critical' && styles.stockCritical,
                item.risk === 'low' && styles.stockLow,
              ]}
            >
              {item.stock}
            </Text>
          </View>
          <Text style={styles.itemMeta}>Batch: B2025-001   Exp: Dec 2026   Rack: A1-01</Text>
          <View style={styles.itemBottomRow}>
            <Text style={styles.itemQty}>{`Qty: ${item.qty}`}</Text>
            <Text style={styles.itemPrice}>{item.price}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F5F6',
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#2A2A2A',
  },
  quickAdd: {
    backgroundColor: '#1CA39A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  quickAddText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  searchRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E3DE',
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 10,
  },
  searchText: {
    color: '#B59D90',
    fontSize: 14,
    fontWeight: '500',
  },
  chipsRow: {
    flexDirection: 'row',
    backgroundColor: '#EFEBE7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 12,
    marginBottom: 12,
  },
  chipActive: {
    color: '#453C37',
    fontSize: 12,
    fontWeight: '700',
  },
  chip: {
    color: '#9C8175',
    fontSize: 12,
    fontWeight: '600',
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E3DE',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: {
    color: '#342F2D',
    fontSize: 16,
    fontWeight: '800',
  },
  stockBadge: {
    backgroundColor: '#E6F5ED',
    color: '#2B8F55',
    borderRadius: 10,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 11,
    fontWeight: '700',
  },
  stockLow: {
    backgroundColor: '#FFF2E4',
    color: '#E06A00',
  },
  stockCritical: {
    backgroundColor: '#FFE8E8',
    color: '#CC2020',
  },
  itemMeta: {
    color: '#AB9285',
    marginTop: 6,
    fontSize: 12,
  },
  itemBottomRow: {
    marginTop: 7,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemQty: {
    color: '#6F655F',
    fontWeight: '600',
  },
  itemPrice: {
    color: '#1CA39A',
    fontWeight: '700',
    fontSize: 16,
  },
});

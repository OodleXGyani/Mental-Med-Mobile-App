import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Barcode, Search } from 'lucide-react-native';
import { useAppDispatch } from '../../../app/hooks';
import { updateMedicineQuantity, addMedicine } from '../store/inventorySlice';
import { useInventory } from '../hooks/useInventory';
import { InventoryCard } from '../components/InventoryCard';
import { QuickAddMedicineModal } from '../components/QuickAddMedicineModal';
import { MedicineDetailModal } from '../components/MedicineDetailModal';
import { AddStockModal } from '../components/AddStockModal';
import { RemoveStockModal } from '../components/RemoveStockModal';
import { Medicine, InventoryFilter } from '../types';

export const InventoryScreen = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const inventory = useInventory();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<InventoryFilter>('All');
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(
    null,
  );
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showRemoveStockModal, setShowRemoveStockModal] = useState(false);
  const [medicineForStock, setMedicineForStock] = useState<Medicine | null>(
    null,
  );

  // Get filtered medicines based on search and filter
  const displayedMedicines = useMemo(() => {
    let filtered = inventory.medicines;

    // Apply search
    if (searchQuery.trim()) {
      filtered = inventory.searchMedicines(searchQuery);
    }

    // Apply filter
    if (activeFilter === 'Low Stock') {
      filtered = filtered.filter(
        m => m.status === 'Low' || m.status === 'Critical',
      );
    } else if (activeFilter === 'Expiring') {
      filtered = filtered.filter(
        m => m.status === 'Expiring' || m.status === 'Expired',
      );
    }

    return filtered;
  }, [searchQuery, activeFilter, inventory.medicines]);

  // Calculate counts for filter tabs
  const allCount = inventory.medicines.length;
  const lowStockCount = inventory.medicines.filter(
    m => m.status === 'Low' || m.status === 'Critical',
  ).length;
  const expiringCount = inventory.medicines.filter(
    m => m.status === 'Expiring' || m.status === 'Expired',
  ).length;

  const handleQuickAdd = (medicineData: Omit<Medicine, 'id' | 'status'>) => {
    const newMedicine: Medicine = {
      id: `med-${Date.now()}`,
      ...medicineData,
      status: 'In Stock',
    };
    dispatch(addMedicine(newMedicine));
  };

  const handleCardPress = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setShowDetailModal(true);
  };

  const handleBarcodePress = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setShowDetailModal(true);
  };

  const handleAddStockPress = (medicine: Medicine) => {
    setMedicineForStock(medicine);
    setShowDetailModal(false);
    setShowAddStockModal(true);
  };

  const handleRemoveStockPress = (medicine: Medicine) => {
    setMedicineForStock(medicine);
    setShowDetailModal(false);
    setShowRemoveStockModal(true);
  };

  const handleAddStockSubmit = (quantity: number, reason: string) => {
    if (medicineForStock) {
      dispatch(
        updateMedicineQuantity({
          medicineId: medicineForStock.id,
          quantity,
          reason,
          type: 'add',
        }),
      );
      setShowAddStockModal(false);
      setMedicineForStock(null);
    }
  };

  const handleRemoveStockSubmit = (quantity: number, reason: string) => {
    if (medicineForStock) {
      dispatch(
        updateMedicineQuantity({
          medicineId: medicineForStock.id,
          quantity,
          reason,
          type: 'remove',
        }),
      );
      setShowRemoveStockModal(false);
      setMedicineForStock(null);
    }
  };

  const handleBarcodeIconPress = () => {
    // Here you would typically open a barcode scanner
    // For now, we'll show the detail modal for the first medicine in displayed list
    // In a real app, this would scan a barcode and find the matching medicine
    if (displayedMedicines.length > 0) {
      setSelectedMedicine(displayedMedicines[0]);
      setShowDetailModal(true);
    }
  };

  return (
    <View
      style={[
        styles.screen,
        {
          paddingTop: Math.max(insets.top, 10),
          paddingBottom: Math.max(insets.bottom, 14),
        },
      ]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Inventory</Text>
          <TouchableOpacity
            style={styles.quickAddButton}
            onPress={() => setShowQuickAddModal(true)}
          >
            <Text style={styles.quickAddText}>+ Quick Add</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={18} color="#B59D90" strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search medicine or barcode..."
            placeholderTextColor="#B59D90"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearButton}>✕</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleBarcodeIconPress} hitSlop={8}>
              <Barcode size={18} color="#1CA39A" strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterRow}>
          {(['All', 'Low Stock', 'Expiring'] as const).map(filter => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterTab,
                activeFilter === filter && styles.filterTabActive,
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === filter && styles.filterTextActive,
                ]}
              >
                {filter === 'All'
                  ? `All (${allCount})`
                  : filter === 'Low Stock'
                  ? `Low Stock (${lowStockCount})`
                  : `Expiring (${expiringCount})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Medicine List */}
        {displayedMedicines.length > 0 ? (
          displayedMedicines.map(medicine => (
            <InventoryCard
              key={medicine.id}
              medicine={medicine}
              onPress={handleCardPress}
              onBarcodeScan={handleBarcodePress}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No medicines found</Text>
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      <QuickAddMedicineModal
        visible={showQuickAddModal}
        onClose={() => setShowQuickAddModal(false)}
        onSubmit={handleQuickAdd}
      />

      <MedicineDetailModal
        visible={showDetailModal}
        medicine={selectedMedicine}
        onClose={() => setShowDetailModal(false)}
        onAddStock={handleAddStockPress}
        onRemoveStock={handleRemoveStockPress}
      />

      <AddStockModal
        visible={showAddStockModal}
        medicineName={medicineForStock?.name || ''}
        currentStock={medicineForStock?.quantity || 0}
        onClose={() => setShowAddStockModal(false)}
        onSubmit={handleAddStockSubmit}
      />

      <RemoveStockModal
        visible={showRemoveStockModal}
        medicineName={medicineForStock?.name || ''}
        currentStock={medicineForStock?.quantity || 0}
        onClose={() => setShowRemoveStockModal(false)}
        onSubmit={handleRemoveStockSubmit}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F5F6',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#2A2A2A',
  },
  quickAddButton: {
    backgroundColor: '#1CA39A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  quickAddText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E3DE',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#2A2A2A',
  },
  clearButton: {
    fontSize: 18,
    color: '#B59D90',
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E3DE',
  },
  filterTabActive: {
    backgroundColor: '#1CA39A',
    borderColor: '#1CA39A',
  },
  filterText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#8B7B6F',
    textAlign: 'center',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
  },
});

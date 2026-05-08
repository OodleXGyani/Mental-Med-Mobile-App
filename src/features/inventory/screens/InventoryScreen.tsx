import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Barcode, Plus, Search } from 'lucide-react-native';
import { InventoryCard } from '../components/InventoryCard';
import { QuickAddMedicineModal } from '../components/QuickAddMedicineModal';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { inventoryService } from '../services/inventoryService';
import {
  InventoryFilter,
  InventoryItem,
  Medicine,
  BarcodeScannedItem,
} from '../types';
import { STACK_ROUTES } from '../../../shared/constants/routes';
import { InventoryStackParamList } from '../../../navigation/types';
import { useAppTheme } from '../../../shared/theme';

type Props = NativeStackScreenProps<
  InventoryStackParamList,
  typeof STACK_ROUTES.INVENTORY_HOME
>;

const isExpired = (item: InventoryItem) =>
  item.status.toLowerCase() === 'expired';

const isExpiringSoon = (item: InventoryItem) =>
  item.status.toLowerCase().includes('expiring') || item.days_left <= 30;

const isLowStock = (item: InventoryItem) =>
  item.reorder_level > 0 &&
  item.quantity <= item.reorder_level &&
  !isExpired(item);

const matchesSearch = (item: InventoryItem, query: string) => {
  const searchText = query.trim().toLowerCase();

  if (!searchText) {
    return true;
  }

  return [
    item.medicine_id,
    item.name,
    item.category,
    item.company,
    item.warehouse,
    item.batch_no,
    item.status,
  ]
    .join(' ')
    .toLowerCase()
    .includes(searchText);
};

export const InventoryScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<InventoryFilter>('All');
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  const loadInventory = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const items = await inventoryService.fetchInventoryItems();
      setInventoryItems(items);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to load inventory items.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadInventory();
    }, [loadInventory]),
  );

  const displayedItems = useMemo(() => {
    return inventoryItems.filter(item => {
      if (!matchesSearch(item, searchQuery)) {
        return false;
      }

      if (activeFilter === 'Low Stock') {
        return isLowStock(item);
      }

      if (activeFilter === 'Expiring') {
        return isExpiringSoon(item) || isExpired(item);
      }

      return true;
    });
  }, [activeFilter, inventoryItems, searchQuery]);

  const allCount = inventoryItems.length;
  const lowStockCount = inventoryItems.filter(isLowStock).length;
  const expiringCount = inventoryItems.filter(
    item => isExpiringSoon(item) || isExpired(item),
  ).length;

  const handleOpenDetails = (item: InventoryItem) => {
    navigation.navigate(STACK_ROUTES.INVENTORY_DETAILS, { item });
  };

  const handleQuickAddSubmit = async (
    _medicine: Omit<Medicine, 'id' | 'status'>,
  ) => {
    setShowQuickAdd(true);
    try {
      // Here you would typically send the data to your backend
      // For now, we'll just show a success alert and reload inventory
      Alert.alert(
        'Success',
        'Medicine added successfully! Pending approval from admin.',
      );
      setShowQuickAdd(false);
      await loadInventory();
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to add medicine',
      );
    }
  };

  const handleBarcodeScanned = (item: BarcodeScannedItem) => {
    const matchingItem =
      inventoryItems.find(
        inv =>
          inv.medicine_id === item.item_code &&
          inv.warehouse === item.default_warehouse,
      ) ?? inventoryItems.find(inv => inv.medicine_id === item.item_code);

    if (matchingItem) {
      navigation.navigate(STACK_ROUTES.INVENTORY_DETAILS, {
        item: matchingItem,
        scannedBarcode: item,
      });
    } else {
      Alert.alert(
        'Item Not Found',
        `Item code ${item.item_code} was scanned, but it was not found in current inventory.`,
      );
    }
  };

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: theme.colors.background },
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
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Inventory
          </Text>
          <TouchableOpacity
            style={[
              styles.quickAddButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => setShowQuickAdd(true)}
          >
            <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.quickAddButtonText}>Quick Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <View
            style={[
              styles.searchContainer,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Search size={18} color={theme.colors.mutedText} strokeWidth={2} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="Search medicine or barcode..."
              placeholderTextColor={theme.colors.mutedText}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text
                  style={[
                    styles.clearButton,
                    { color: theme.colors.mutedText },
                  ]}
                >
                  ✕
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity
            style={[
              styles.barcodeButton,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => setShowBarcodeScanner(true)}
            hitSlop={8}
          >
            <Barcode size={19} color={theme.colors.primary} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          {(['All', 'Low Stock', 'Expiring'] as const).map(filter => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterTab,
                activeFilter === filter && {
                  backgroundColor: theme.colors.primary,
                  borderColor: theme.colors.primary,
                },
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: theme.colors.mutedText },
                  activeFilter === filter && { color: '#FFFFFF' },
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

        {loading ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={[styles.stateText, { color: theme.colors.mutedText }]}>
              Loading inventory...
            </Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.stateContainer}>
            <Text style={[styles.errorText, { color: theme.colors.danger }]}>
              {errorMessage}
            </Text>
            <TouchableOpacity
              style={[
                styles.retryButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={loadInventory}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : displayedItems.length > 0 ? (
          displayedItems.map(item => (
            <InventoryCard
              key={`${item.medicine_id}-${item.batch_no}-${item.warehouse}`}
              item={item}
              onPress={handleOpenDetails}
              onBarcodeScan={handleOpenDetails}
            />
          ))
        ) : (
          <View style={styles.stateContainer}>
            <Text style={[styles.stateText, { color: theme.colors.mutedText }]}>
              No inventory items found
            </Text>
          </View>
        )}
      </ScrollView>

      <QuickAddMedicineModal
        visible={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onSubmit={handleQuickAddSubmit}
      />

      <BarcodeScannerModal
        visible={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onScannedItem={handleBarcodeScanned}
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
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  quickAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1CA39A',
    borderRadius: 8,
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  quickAddButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2A2A2A',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8E3DE',
    paddingHorizontal: 12,
    minHeight: 46,
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
  barcodeButton: {
    width: 46,
    height: 46,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  stateContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  stateText: {
    fontSize: 14,
    color: '#6D625A',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    color: '#D32F2F',
    fontWeight: '600',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 4,
    backgroundColor: '#1CA39A',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

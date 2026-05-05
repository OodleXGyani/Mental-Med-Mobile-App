import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { Barcode, Search } from 'lucide-react-native';
import { InventoryCard } from '../components/InventoryCard';
import { inventoryService } from '../services/inventoryService';
import { InventoryFilter, InventoryItem } from '../types';
import { STACK_ROUTES } from '../../../shared/constants/routes';
import { InventoryStackParamList } from '../../../navigation/types';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<InventoryFilter>('All');
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

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
      void loadInventory();
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
        <View style={styles.header}>
          <Text style={styles.title}>Inventory</Text>
          <Text style={styles.subtitle}>
            Live stock from the pharmacy backend
          </Text>
        </View>

        <View style={styles.searchContainer}>
          <Search size={18} color="#B59D90" strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search medicine, batch, warehouse..."
            placeholderTextColor="#B59D90"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearButton}>✕</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => setActiveFilter('All')}
              hitSlop={8}
            >
              <Barcode size={18} color="#1CA39A" strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>

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

        {loading ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="small" color="#1CA39A" />
            <Text style={styles.stateText}>Loading inventory...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.stateContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity
              style={styles.retryButton}
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
            <Text style={styles.stateText}>No inventory items found</Text>
          </View>
        )}
      </ScrollView>
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
    marginBottom: 12,
    marginTop: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#2A2A2A',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#8B7B6F',
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

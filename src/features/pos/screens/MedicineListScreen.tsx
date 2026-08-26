import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  DeviceEventEmitter,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronLeft, Plus, Search } from 'lucide-react-native';
import { posService } from '../services/posService';
import { Medicine } from '../types';
import { POSStackParamList } from '../../../navigation/types';
import { STACK_ROUTES } from '../../../shared/constants/routes';
import { useAppTheme } from '../../../shared/theme';

type Props = NativeStackScreenProps<
  POSStackParamList,
  typeof STACK_ROUTES.POS_MEDICINE_LIST
>;

const formatPrice = (price: number | undefined) => {
  if (price === undefined || price === null) return '₹ 0.00';
  return `₹ ${price.toFixed(2)}`;
};

export const MedicineListScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [filteredMedicines, setFilteredMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Load medicines on mount
  useEffect(() => {
    const loadMedicines = async () => {
      try {
        setLoading(true);
        const data = await posService.fetchMedicines();
        setMedicines(data);
        setFilteredMedicines(data);
      } catch (e: unknown) {
        console.error(e);
        setError(e instanceof Error ? e.message : 'Failed to load medicines');
      } finally {
        setLoading(false);
      }
    };

    loadMedicines();
  }, []);

  // Search filter
  useEffect(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) {
      setFilteredMedicines(medicines);
      return;
    }
    const filtered = medicines.filter(
      (medicine) =>
        medicine.item_name?.toLowerCase().includes(query) ||
        medicine.item_code?.toLowerCase().includes(query),
    );
    setFilteredMedicines(filtered);
  }, [searchText, medicines]);

  const handleSelectMedicine = useCallback(
    (medicine: Medicine) => {
      DeviceEventEmitter.emit('POS_MEDICINE_SELECTED', medicine);
      navigation.goBack();
    },
    [navigation],
  );

  const renderMedicineItem = useCallback(
    ({ item }: { item: Medicine }) => {
      const stock = item.quantity ?? 0;
      const isOutOfStock = stock <= 0;

      return (
        <Pressable
          style={[
            styles.medicineCard,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
          onPress={() => handleSelectMedicine(item)}
        >
          <View style={styles.medicineCardContent}>
            <Text style={[styles.medicineName, { color: theme.colors.text }]}>
              {item.item_name}
            </Text>
            <View style={styles.medicineDetails}>
              <Text
                style={[
                  styles.medicineDetailText,
                  { color: theme.colors.mutedText },
                ]}
              >
                Code: {item.item_code}
              </Text>
              {item.batch ? (
                <Text
                  style={[
                    styles.medicineDetailText,
                    { color: theme.colors.mutedText },
                  ]}
                >
                  • Batch: {item.batch}
                </Text>
              ) : null}
              {item.expiry_date ? (
                <Text
                  style={[
                    styles.medicineDetailText,
                    { color: theme.colors.mutedText },
                  ]}
                >
                  • Exp: {item.expiry_date}
                </Text>
              ) : null}
            </View>

            <View style={styles.stockBadgeRow}>
              <View
                style={[
                  styles.stockBadge,
                  {
                    backgroundColor: isOutOfStock
                      ? 'rgba(239, 68, 68, 0.15)'
                      : 'rgba(16, 185, 129, 0.15)',
                    borderColor: isOutOfStock
                      ? 'rgba(239, 68, 68, 0.3)'
                      : 'rgba(16, 185, 129, 0.3)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.stockBadgeText,
                    { color: isOutOfStock ? '#EF4444' : '#10B981' },
                  ]}
                >
                  {isOutOfStock ? 'Out of stock' : `In Stock: ${stock}`}
                </Text>
              </View>
              {item.gst ? (
                <Text style={[styles.gstText, { color: theme.colors.mutedText }]}>
                  GST {item.gst}%
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.medicineCardRight}>
            <Text style={[styles.medicinePrice, { color: theme.colors.text }]}>
              {formatPrice(item.rate)}
            </Text>
            <Pressable
              style={[
                styles.addButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => handleSelectMedicine(item)}
            >
              <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
            </Pressable>
          </View>
        </Pressable>
      );
    },
    [theme, handleSelectMedicine],
  );

  if (error) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.background, paddingTop: insets.top },
        ]}
      >
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <ChevronLeft size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Select Medicine
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            {error}
          </Text>
          <Pressable
            style={[
              styles.retryButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => {
              setError(null);
              setLoading(true);
              posService
                .fetchMedicines()
                .then(data => {
                  setMedicines(data);
                  setFilteredMedicines(data);
                })
                .catch(err => {
                  setError(
                    err instanceof Error
                      ? err.message
                      : 'Failed to load medicines',
                  );
                })
                .finally(() => setLoading(false));
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background, paddingTop: insets.top },
      ]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <ChevronLeft size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Select Medicine
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchContainer}>
        <Search
          size={16}
          color={theme.colors.mutedText}
          strokeWidth={2}
          style={styles.searchIcon}
        />
        <TextInput
          style={[
            styles.searchInput,
            {
              color: theme.colors.text,
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
          placeholder="Search medicines by brand or code..."
          placeholderTextColor={theme.colors.mutedText}
          value={searchText}
          onChangeText={setSearchText}
          autoFocus={true}
        />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
            style={{ marginBottom: 12 }}
          />
          <Text style={[styles.loadingText, { color: theme.colors.mutedText }]}>
            Loading medicines catalogue...
          </Text>
        </View>
      ) : filteredMedicines.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.mutedText }]}>
            No medicines match your search
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredMedicines}
          renderItem={renderMedicineItem}
          keyExtractor={(item, index) =>
            `${item.item_code}-${item.batch || ''}-${item.warehouse || ''}-${index}`
          }
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'relative',
    justifyContent: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 28,
    zIndex: 1,
  },
  searchInput: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingLeft: 38,
    paddingRight: 16,
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 8,
  },
  medicineCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  medicineCardContent: {
    flex: 1,
    marginRight: 12,
  },
  medicineName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  medicineDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  medicineDetailText: {
    fontSize: 11,
  },
  stockBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stockBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  stockBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  gstText: {
    fontSize: 10.5,
  },
  medicineCardRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  medicinePrice: {
    fontSize: 15,
    fontWeight: '700',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyText: {
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});

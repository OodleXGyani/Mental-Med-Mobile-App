import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  if (price === undefined || price === null) return '₹ 0';
  return `₹ ${price.toFixed(2)}`;
};

export const MedicineListScreen = ({ navigation, route }: Props) => {
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
      setLoading(true);
      setError(null);
      try {
        const data = await posService.fetchMedicines();
        setMedicines(data);
        setFilteredMedicines(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load medicines',
        );
      } finally {
        setLoading(false);
      }
    };

    void loadMedicines();
  }, []);

  // Filter medicines based on search
  useEffect(() => {
    const query = searchText.toLowerCase();
    const filtered = medicines.filter(
      medicine =>
        medicine.item_name?.toLowerCase().includes(query) ||
        medicine.item_code?.toLowerCase().includes(query),
    );
    setFilteredMedicines(filtered);
  }, [searchText, medicines]);

  const handleSelectMedicine = useCallback(
    (medicine: Medicine) => {
      // Pass medicine to parent and go back
      if (route.params?.onMedicineSelected) {
        route.params.onMedicineSelected(medicine);
      }
      navigation.goBack();
    },
    [navigation, route.params],
  );

  const renderMedicineItem = useCallback(
    ({ item }: { item: Medicine }) => (
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
              {item.item_code}
            </Text>
            {item.batch && (
              <Text
                style={[
                  styles.medicineDetailText,
                  { color: theme.colors.mutedText },
                ]}
              >
                • Batch: {item.batch}
              </Text>
            )}
            {item.expiry_date && (
              <Text
                style={[
                  styles.medicineDetailText,
                  { color: theme.colors.mutedText },
                ]}
              >
                • Exp: {item.expiry_date}
              </Text>
            )}
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
            <Plus size={16} color="#FFFFFF" strokeWidth={2} />
          </Pressable>
        </View>
      </Pressable>
    ),
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
          <Pressable onPress={() => navigation.goBack()}>
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
        <Pressable onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Select Medicine
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchContainer}>
        <Search
          size={14}
          color={theme.colors.mutedText}
          strokeWidth={2.5}
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
          placeholder="Search by name or code..."
          placeholderTextColor={theme.colors.mutedText}
          value={searchText}
          onChangeText={setSearchText}
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
            Loading medicines...
          </Text>
        </View>
      ) : filteredMedicines.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.mutedText }]}>
            {searchText ? 'No medicines found' : 'No medicines available'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredMedicines}
          renderItem={renderMedicineItem}
          keyExtractor={(item, index) =>
            `${item.item_code || 'medicine'}-${index}`
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
    borderBottomWidth: 1,
    borderBottomColor: '#E8E3DE',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    borderRadius: 8,
    borderWidth: 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  medicineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  medicineCardContent: {
    flex: 1,
    marginRight: 12,
  },
  medicineName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  medicineDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  medicineDetailText: {
    fontSize: 12,
    marginRight: 8,
  },
  medicineCardRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  medicinePrice: {
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    borderRadius: 8,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});

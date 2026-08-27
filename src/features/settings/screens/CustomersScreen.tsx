import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronRight, ChevronLeft, Search } from 'lucide-react-native';
import { customerService } from '../services/customerService';
import { CustomerListItem } from '../types';
import { STACK_ROUTES } from '../../../shared/constants/routes';
import { SettingsStackParamList } from '../../../navigation/types';
import { useAppTheme } from '../../../shared/theme';
import { CustomerFormModal } from '../components/CustomerFormModal';

type Props = NativeStackScreenProps<
  SettingsStackParamList,
  typeof STACK_ROUTES.CUSTOMERS_HOME
>;

const formatCurrency = (value: number | null | undefined) => {
  const numberValue = Number(value ?? 0);
  return `Rs ${numberValue.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`;
};

const getInitial = (name: string) => name.trim().charAt(0).toUpperCase() || 'C';

export const CustomersScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchText, setSearchText] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const nextCustomers = await customerService.fetchCustomers();
      setCustomers(nextCustomers);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to load customers.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadCustomers();
    }, [loadCustomers]),
  );

  const filteredCustomers = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    if (!query) {
      return customers;
    }

    return customers.filter(customer => {
      const phone = customer.contact.mobile || '';
      return (
        customer.customer_name.toLowerCase().includes(query) ||
        customer.customer_code.toLowerCase().includes(query) ||
        phone.includes(query)
      );
    });
  }, [customers, searchText]);

  const handleAddSuccess = ({ message }: { message: string }) => {
    setShowAddModal(false);
    Alert.alert('Success', message);
    void loadCustomers();
  };

  return (
    <>
      <ScrollView
        style={[styles.screen, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 10) + 8,
            paddingBottom: Math.max(insets.bottom, 14) + 18,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={8}
            style={styles.backButton}
          >
            <ChevronLeft size={24} color={theme.colors.text} strokeWidth={2} />
          </Pressable>
          <View style={styles.headerTextBlock}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Customers
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.mutedText }]}>
              Live customer directory from the backend
            </Text>
          </View>
          <Pressable
            style={[
              styles.addButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </Pressable>
        </View>

        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Search size={18} color={theme.colors.mutedText} strokeWidth={2.2} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Search by name or phone..."
            placeholderTextColor={theme.colors.mutedText}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {loading ? (
          <View
            style={[
              styles.stateBox,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.stateText, { color: theme.colors.mutedText }]}>
              Loading customers...
            </Text>
          </View>
        ) : errorMessage ? (
          <View
            style={[
              styles.stateBox,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.stateTitle, { color: theme.colors.text }]}>
              Unable to load customers
            </Text>
            <Text style={[styles.stateText, { color: theme.colors.mutedText }]}>
              {errorMessage}
            </Text>
            <Pressable
              style={[
                styles.retryButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => void loadCustomers()}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : filteredCustomers.length > 0 ? (
          filteredCustomers.map(customer => (
            <Pressable
              style={[
                styles.customerRow,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}
              key={customer.customer_code}
              onPress={() =>
                navigation.navigate(STACK_ROUTES.CUSTOMER_DETAILS, {
                  customerCode: customer.customer_code,
                })
              }
            >
              <View
                style={[
                  styles.avatarCircle,
                  { backgroundColor: theme.dark ? '#163330' : '#E5F4F3' },
                ]}
              >
                <Text
                  style={[styles.avatarText, { color: theme.colors.primary }]}
                >
                  {getInitial(customer.customer_name)}
                </Text>
              </View>

              <View style={styles.customerInfo}>
                <Text
                  style={[styles.customerName, { color: theme.colors.text }]}
                >
                  {customer.customer_name}
                </Text>
                <Text
                  style={[
                    styles.customerMeta,
                    { color: theme.colors.mutedText },
                  ]}
                  numberOfLines={1}
                >
                  {customer.contact.mobile || customer.customer_code} •{' '}
                  {customer.status}
                </Text>
                <Text
                  style={[
                    styles.customerSubMeta,
                    { color: theme.colors.mutedText },
                  ]}
                  numberOfLines={1}
                >
                  {customer.contact.email || customer.customer_type} • Last
                  order {customer.last_order_date || 'N/A'}
                </Text>
              </View>

              <View style={styles.customerRight}>
                <Text
                  style={[styles.amountText, { color: theme.colors.primary }]}
                  numberOfLines={1}
                >
                  {formatCurrency(customer.total_billing)}
                </Text>
                <ChevronRight
                  size={18}
                  color={theme.colors.mutedText}
                  strokeWidth={2.5}
                />
              </View>
            </Pressable>
          ))
        ) : (
          <View
            style={[
              styles.emptyState,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              No customers found
            </Text>
            <Text style={[styles.emptyText, { color: theme.colors.mutedText }]}>
              Try a different search term or add a new customer.
            </Text>
          </View>
        )}
      </ScrollView>

      <CustomerFormModal
        visible={showAddModal}
        mode="create"
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
      />
    </>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F5F6',
  },
  content: {
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 3,
  },
  headerTextBlock: {
    flex: 1,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#2A2A2A',
  },
  subtitle: {
    fontSize: 12,
    color: '#8B7B6F',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#1CA39A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  searchContainer: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E3DE',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    color: '#2A2A2A',
    fontSize: 14,
  },
  customerRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E3DE',
    paddingHorizontal: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5F4F3',
  },
  avatarText: {
    color: '#1CA39A',
    fontWeight: '800',
    fontSize: 16,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    color: '#312F2E',
    fontSize: 15,
    fontWeight: '700',
  },
  customerMeta: {
    color: '#8B7B6F',
    fontSize: 12,
    marginTop: 3,
  },
  customerSubMeta: {
    color: '#A68F82',
    fontSize: 11,
    marginTop: 3,
  },
  customerRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
  },
  amountText: {
    color: '#1CA39A',
    fontWeight: '800',
    fontSize: 14,
    maxWidth: 100,
  },
  stateBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E3DE',
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 10,
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2A2A2A',
  },
  stateText: {
    color: '#8B7B6F',
    fontSize: 13,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 6,
    backgroundColor: '#1CA39A',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E3DE',
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2A2A2A',
  },
  emptyText: {
    color: '#8B7B6F',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '92%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E3DE',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2A2A2A',
  },
  modalBody: {
    flexGrow: 0,
  },
  modalBodyContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2A2A2A',
    marginBottom: 8,
  },
  required: {
    color: '#E03131',
  },
  input: {
    backgroundColor: '#F5F5F6',
    borderWidth: 1,
    borderColor: '#E8E3DE',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#2A2A2A',
  },
  multilineInput: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#E03131',
  },
  errorText: {
    color: '#E03131',
    fontSize: 12,
    marginTop: 4,
  },
  modalFooter: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E8E3DE',
  },
  addCustomerButton: {
    backgroundColor: '#1CA39A',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  addCustomerButtonDisabled: {
    opacity: 0.7,
  },
  addCustomerButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
});

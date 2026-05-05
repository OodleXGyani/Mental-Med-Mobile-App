import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
import { ChevronRight, Search, X } from 'lucide-react-native';
import { customerService } from '../services/customerService';
import { CreateCustomerRequest, CustomerListItem } from '../types';
import { STACK_ROUTES } from '../../../shared/constants/routes';
import { SettingsStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<
  SettingsStackParamList,
  typeof STACK_ROUTES.CUSTOMERS_HOME
>;

type AddCustomerFormState = {
  customer_name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
};

type FormErrors = Partial<Record<keyof AddCustomerFormState, string>>;

const initialFormState: AddCustomerFormState = {
  customer_name: '',
  contact_person: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
};

const formatCurrency = (value: number | null | undefined) => {
  const numberValue = Number(value ?? 0);
  return `Rs ${numberValue.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`;
};

const getInitial = (name: string) => name.trim().charAt(0).toUpperCase() || 'C';

export const CustomersScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchText, setSearchText] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] =
    useState<AddCustomerFormState>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

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

  const validateForm = () => {
    const nextErrors: FormErrors = {};
    let isValid = true;

    if (!formData.customer_name.trim()) {
      nextErrors.customer_name = 'Customer name is required';
      isValid = false;
    }

    if (!formData.contact_person.trim()) {
      nextErrors.contact_person = 'Contact person is required';
      isValid = false;
    }

    if (!formData.phone.trim()) {
      nextErrors.phone = 'Phone number is required';
      isValid = false;
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      nextErrors.phone = 'Phone must be 10 digits';
      isValid = false;
    }

    if (!formData.address.trim()) {
      nextErrors.address = 'Address is required';
      isValid = false;
    }

    if (!formData.city.trim()) {
      nextErrors.city = 'City is required';
      isValid = false;
    }

    if (!formData.state.trim()) {
      nextErrors.state = 'State is required';
      isValid = false;
    }

    if (!formData.pincode.trim()) {
      nextErrors.pincode = 'Pincode is required';
      isValid = false;
    } else if (!/^\d{6}$/.test(formData.pincode.replace(/\D/g, ''))) {
      nextErrors.pincode = 'Pincode must be 6 digits';
      isValid = false;
    }

    setErrors(nextErrors);
    return isValid;
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setErrors({});
  };

  const handleCloseModal = () => {
    if (submitting) {
      return;
    }

    setShowAddModal(false);
    resetForm();
  };

  const handleAddCustomer = async () => {
    if (submitting || !validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const payload: CreateCustomerRequest = {
        ...formData,
        customer_type: 'Company',
        credit_limit: 500000,
      };

      const message = await customerService.createCustomer(payload);
      setShowAddModal(false);
      resetForm();
      Alert.alert('Success', message);
      await loadCustomers();
    } catch (error) {
      Alert.alert(
        'Unable to create customer',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderInput = (
    label: string,
    field: keyof AddCustomerFormState,
    placeholder: string,
    options?: {
      keyboardType?: React.ComponentProps<typeof TextInput>['keyboardType'];
      autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
      multiline?: boolean;
      numberOfLines?: number;
      maxLength?: number;
      required?: boolean;
    },
  ) => (
    <View style={styles.formGroup}>
      <Text style={styles.label}>
        {label}{' '}
        {options?.required !== false ? (
          <Text style={styles.required}>*</Text>
        ) : null}
      </Text>
      <TextInput
        style={[
          styles.input,
          options?.multiline && styles.multilineInput,
          errors[field] && styles.inputError,
        ]}
        placeholder={placeholder}
        placeholderTextColor="#B59D90"
        value={formData[field]}
        onChangeText={text => {
          setFormData(prev => ({ ...prev, [field]: text }));
          if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
          }
        }}
        keyboardType={options?.keyboardType}
        autoCapitalize={options?.autoCapitalize ?? 'sentences'}
        multiline={options?.multiline}
        numberOfLines={options?.numberOfLines}
        maxLength={options?.maxLength}
      />
      {errors[field] ? (
        <Text style={styles.errorText}>{errors[field]}</Text>
      ) : null}
    </View>
  );

  return (
    <>
      <ScrollView
        style={styles.screen}
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
          <View style={styles.headerTextBlock}>
            <Text style={styles.title}>Customers</Text>
            <Text style={styles.subtitle}>
              Live customer directory from the backend
            </Text>
          </View>
          <Pressable
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </Pressable>
        </View>

        <View style={styles.searchContainer}>
          <Search size={18} color="#B59D90" strokeWidth={2.2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or phone..."
            placeholderTextColor="#B59D90"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator size="large" color="#1CA39A" />
            <Text style={styles.stateText}>Loading customers...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateTitle}>Unable to load customers</Text>
            <Text style={styles.stateText}>{errorMessage}</Text>
            <Pressable
              style={styles.retryButton}
              onPress={() => void loadCustomers()}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : filteredCustomers.length > 0 ? (
          filteredCustomers.map(customer => (
            <Pressable
              style={styles.customerRow}
              key={customer.customer_code}
              onPress={() =>
                navigation.navigate(STACK_ROUTES.CUSTOMER_DETAILS, {
                  customerCode: customer.customer_code,
                })
              }
            >
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {getInitial(customer.customer_name)}
                </Text>
              </View>

              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>
                  {customer.customer_name}
                </Text>
                <Text style={styles.customerMeta} numberOfLines={1}>
                  {customer.contact.mobile || customer.customer_code} •{' '}
                  {customer.status}
                </Text>
                <Text style={styles.customerSubMeta} numberOfLines={1}>
                  {customer.contact.email || customer.customer_type} • Last
                  order {customer.last_order_date || 'N/A'}
                </Text>
              </View>

              <View style={styles.customerRight}>
                <Text style={styles.amountText} numberOfLines={1}>
                  {formatCurrency(customer.total_billing)}
                </Text>
                <ChevronRight size={18} color="#B59D90" strokeWidth={2.5} />
              </View>
            </Pressable>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No customers found</Text>
            <Text style={styles.emptyText}>
              Try a different search term or add a new customer.
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoid}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Customer</Text>
                <Pressable onPress={handleCloseModal}>
                  <X size={24} color="#2A2A2A" strokeWidth={2.5} />
                </Pressable>
              </View>

              <ScrollView
                style={styles.modalBody}
                contentContainerStyle={styles.modalBodyContent}
                showsVerticalScrollIndicator={false}
              >
                {renderInput(
                  'Customer Name',
                  'customer_name',
                  'ABC Pharma Pvt Ltd',
                )}
                {renderInput(
                  'Contact Person',
                  'contact_person',
                  'Rahul Sharma',
                )}
                {renderInput('Phone', 'phone', '9876543210', {
                  keyboardType: 'phone-pad',
                  maxLength: 10,
                })}
                {renderInput('Email', 'email', 'rahul@abcpharma.com', {
                  keyboardType: 'email-address',
                  autoCapitalize: 'none',
                  required: false,
                })}
                {renderInput(
                  'Address',
                  'address',
                  'Plot 12, Industrial Area Phase 2',
                  {
                    multiline: true,
                    numberOfLines: 3,
                  },
                )}
                {renderInput('City', 'city', 'Delhi')}
                {renderInput('State', 'state', 'Delhi')}
                {renderInput('Pincode', 'pincode', '110034', {
                  keyboardType: 'number-pad',
                  maxLength: 6,
                })}
              </ScrollView>

              <View style={styles.modalFooter}>
                <Pressable
                  style={[
                    styles.addCustomerButton,
                    submitting && styles.addCustomerButtonDisabled,
                  ]}
                  onPress={handleAddCustomer}
                  disabled={submitting}
                >
                  <Text style={styles.addCustomerButtonText}>
                    {submitting ? 'Saving...' : 'Add Customer'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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

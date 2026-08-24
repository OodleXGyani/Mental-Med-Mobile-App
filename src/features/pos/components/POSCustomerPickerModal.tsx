import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, ChevronDown, History, Search, User, UserPlus, X } from 'lucide-react-native';
import { Customer } from '../types';
import { useAppTheme } from '../../../shared/theme';
import { customerService } from '../../settings/services/customerService';

const INDIAN_STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

type Props = {
  visible: boolean;
  initialTab?: 'search' | 'add';
  searchValue: string;
  onSearchChange: (value: string) => void;
  customers: Customer[];
  onSelectCustomer: (customer: Customer) => void;
  onViewPastOrders?: (customer: Customer) => void;
  onClose: () => void;
};

export const POSCustomerPickerModal = ({
  visible,
  initialTab = 'search',
  searchValue,
  onSearchChange,
  customers,
  onSelectCustomer,
  onViewPastOrders,
  onClose,
}: Props) => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'search' | 'add'>(initialTab);

  // Add New Customer Form State (Matches Web POS form)
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('Telangana');
  const [newPincode, setNewPincode] = useState('');
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [stateSearchText, setStateSearchText] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Validation Logic
  const trimmedName = newName.trim();
  const trimmedPhone = newPhone.trim();
  const trimmedEmail = newEmail.trim();
  const trimmedPincode = newPincode.trim();

  let nameError = '';
  if (!trimmedName) {
    nameError = 'Customer Name is required';
  } else if (trimmedName.length < 2) {
    nameError = 'Name must be at least 2 characters';
  } else if (!/^[a-zA-Z\s.'-]+$/.test(trimmedName)) {
    nameError = 'Name can only contain letters and spaces';
  }

  let phoneError = '';
  if (!trimmedPhone) {
    phoneError = 'Phone Number is required';
  } else if (trimmedPhone.length !== 10) {
    phoneError = 'Must be exactly 10 digits';
  } else if (!/^[6-9]\d{9}$/.test(trimmedPhone)) {
    phoneError = 'Must start with 6, 7, 8, or 9';
  }

  let emailError = '';
  if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    emailError = 'Invalid email format (e.g. name@domain.com)';
  }

  let pincodeError = '';
  if (trimmedPincode && trimmedPincode.length !== 6) {
    pincodeError = 'Pincode must be 6 digits';
  }

  const isFormValid = !nameError && !phoneError && !emailError && !pincodeError;

  // Sync initial tab when modal becomes visible
  useEffect(() => {
    if (visible) {
      setActiveTab(initialTab);
      setFormError(null);
      setTouched({});
    }
  }, [visible, initialTab]);

  const handleCreateAndSelectCustomer = async () => {
    setTouched({
      name: true,
      phone: true,
      email: true,
      address: true,
      pincode: true,
    });

    const trimmedAddress = newAddress.trim();
    const trimmedCity = newCity.trim();
    const hasAddress = Boolean(trimmedAddress || trimmedCity);

    // If user started entering address, both address and city are required
    let addrError = '';
    if (hasAddress && !trimmedAddress) {
      addrError = 'Address Line is required when adding an address.';
    } else if (hasAddress && !trimmedCity) {
      addrError = 'City is required when adding an address.';
    }

    if (!isFormValid || addrError) {
      setFormError(
        nameError ||
          phoneError ||
          emailError ||
          pincodeError ||
          addrError ||
          'Please fix the errors above.',
      );
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const selectedState = newState.trim() || 'Telangana';

      await customerService.createCustomer({
        customer_name: trimmedName,
        phone: trimmedPhone,
        email: trimmedEmail,
        address: hasAddress ? trimmedAddress : '',
        contact_person: trimmedName,
        city: hasAddress ? trimmedCity : '',
        state: hasAddress ? selectedState : '',
        pincode: hasAddress ? trimmedPincode : '',
        customer_type: 'Individual',
        credit_limit: 0,
      });

      // Clear form
      setNewName('');
      setNewPhone('');
      setNewEmail('');
      setNewAddress('');
      setNewCity('');
      setNewState('Telangana');
      setNewPincode('');
      setTouched({});

      // Immediately select newly created customer
      onSelectCustomer({
        id: trimmedName,
        name: trimmedName,
        phone: trimmedPhone,
        loyalty_points: 0,
        loyalty_redemption_value: 0,
      });
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Failed to create customer.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={styles.modalBackdropBottom}>
        <View
          style={[
            styles.bottomSheet,
            {
              backgroundColor: theme.colors.card,
              paddingBottom: Math.max(insets.bottom, 20) + 12,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.headerTitleRow}>
              <User size={20} color={theme.colors.primary} />
              <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>
                Customer Management
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={20} color={theme.colors.mutedText} />
            </Pressable>
          </View>

          {/* Segmented Tab Controls (Matching Web POS) */}
          <View
            style={[
              styles.tabContainer,
              theme.dark ? styles.tabContainerDark : styles.tabContainerLight,
            ]}
          >
            <Pressable
              style={[
                styles.tabButton,
                activeTab === 'search' && [
                  styles.tabButtonActive,
                  { backgroundColor: theme.colors.card },
                ],
              ]}
              onPress={() => {
                setActiveTab('search');
                setFormError(null);
              }}
            >
              <Search
                size={14}
                color={
                  activeTab === 'search'
                    ? theme.colors.primary
                    : theme.colors.mutedText
                }
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'search'
                    ? styles.tabTextActive
                    : styles.tabTextInactive,
                  {
                    color:
                      activeTab === 'search'
                        ? theme.colors.text
                        : theme.colors.mutedText,
                  },
                ]}
              >
                Search Customer
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.tabButton,
                activeTab === 'add' && [
                  styles.tabButtonActive,
                  { backgroundColor: theme.colors.card },
                ],
              ]}
              onPress={() => {
                setActiveTab('add');
                setFormError(null);
              }}
            >
              <UserPlus
                size={14}
                color={
                  activeTab === 'add'
                    ? theme.colors.primary
                    : theme.colors.mutedText
                }
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'add'
                    ? styles.tabTextActive
                    : styles.tabTextInactive,
                  {
                    color:
                      activeTab === 'add'
                        ? theme.colors.text
                        : theme.colors.mutedText,
                  },
                ]}
              >
                Add New Customer
              </Text>
            </Pressable>
          </View>

          {/* TAB 1: Search Customer */}
          {activeTab === 'search' ? (
            <View style={styles.tabContent}>
              <TextInput
                style={[
                  styles.customerSearchInput,
                  {
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                    backgroundColor: theme.colors.background,
                  },
                ]}
                placeholder="Search customer by name or phone..."
                placeholderTextColor={theme.colors.mutedText}
                value={searchValue}
                onChangeText={onSearchChange}
              />

              <ScrollView
                style={styles.customerList}
                showsVerticalScrollIndicator={false}
              >
                {customers.length === 0 ? (
                  <View style={styles.emptyListWrap}>
                    <Text
                      style={[
                        styles.emptyListText,
                        { color: theme.colors.mutedText },
                      ]}
                    >
                      No customers found matching search
                    </Text>
                    <Pressable
                      style={[
                        styles.switchToAddBtn,
                        { borderColor: theme.colors.primary },
                      ]}
                      onPress={() => {
                        setNewName(searchValue);
                        setActiveTab('add');
                      }}
                    >
                      <UserPlus size={13} color={theme.colors.primary} />
                      <Text
                        style={[
                          styles.switchToAddBtnText,
                          { color: theme.colors.primary },
                        ]}
                      >
                        Create "{searchValue || 'New Customer'}"
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  customers.map((customer, index) => (
                    <View
                      key={`cust-${
                        customer.id || customer.phone || 'c'
                      }-${index}`}
                      style={[
                        styles.customerListItem,
                        {
                          borderColor: theme.colors.border,
                          backgroundColor: theme.colors.card,
                        },
                      ]}
                    >
                      <Pressable
                        style={styles.customerListContent}
                        onPress={() => onSelectCustomer(customer)}
                      >
                        <View style={styles.customerListLeft}>
                          <View
                            style={[
                              styles.customerAvatar,
                              theme.dark ? styles.avatarDark : styles.avatarLight,
                            ]}
                          >
                            <User size={14} color={theme.colors.primary} />
                          </View>
                          <View>
                            <Text
                              style={[
                                styles.customerListName,
                                { color: theme.colors.text },
                              ]}
                            >
                              {customer.name}
                            </Text>
                            <Text
                              style={[
                                styles.customerListPhone,
                                { color: theme.colors.mutedText },
                              ]}
                            >
                              {customer.phone || 'No phone'}
                            </Text>
                          </View>
                        </View>
                      </Pressable>
                      {onViewPastOrders && (
                        <Pressable
                          style={styles.pastOrdersButton}
                          onPress={() => onViewPastOrders(customer)}
                        >
                          <History
                            size={16}
                            color={theme.colors.primary}
                            strokeWidth={2}
                          />
                        </Pressable>
                      )}
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          ) : (
            /* TAB 2: Add New Customer Form (Matching Web POS screenshot) */
            <ScrollView
              style={styles.formScroll}
              showsVerticalScrollIndicator={false}
            >
              {formError ? (
                <View style={styles.formErrorBanner}>
                  <Text style={styles.formErrorText}>{formError}</Text>
                </View>
              ) : null}

              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <View style={styles.formLabelRow}>
                    <Text
                      style={[styles.formLabel, { color: theme.colors.text }]}
                    >
                      Customer Name <Text style={styles.reqStar}>*</Text>
                    </Text>
                    <Text
                      style={[
                        styles.charCount,
                        { color: theme.colors.mutedText },
                      ]}
                    >
                      {newName.length}/50
                    </Text>
                  </View>
                  <TextInput
                    style={[
                      styles.formInput,
                      {
                        color: theme.colors.text,
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                      },
                      touched.name && nameError ? styles.inputErrorBorder : null,
                    ]}
                    placeholder="Enter customer name"
                    placeholderTextColor={theme.colors.mutedText}
                    autoCapitalize="words"
                    maxLength={50}
                    value={newName}
                    onChangeText={text => {
                      setNewName(text.slice(0, 50));
                      if (formError) setFormError(null);
                    }}
                    onBlur={() =>
                      setTouched(prev => ({ ...prev, name: true }))
                    }
                  />
                  {touched.name && nameError ? (
                    <Text style={styles.fieldErrorText}>{nameError}</Text>
                  ) : null}
                </View>

                <View style={styles.formCol}>
                  <View style={styles.formLabelRow}>
                    <Text
                      style={[styles.formLabel, { color: theme.colors.text }]}
                    >
                      Phone Number <Text style={styles.reqStar}>*</Text>
                    </Text>
                    <Text
                      style={[
                        styles.charCount,
                        { color: theme.colors.mutedText },
                      ]}
                    >
                      {newPhone.length}/10
                    </Text>
                  </View>
                  <TextInput
                    style={[
                      styles.formInput,
                      {
                        color: theme.colors.text,
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                      },
                      touched.phone && phoneError ? styles.inputErrorBorder : null,
                    ]}
                    placeholder="10-digit mobile"
                    placeholderTextColor={theme.colors.mutedText}
                    keyboardType="number-pad"
                    maxLength={10}
                    value={newPhone}
                    onChangeText={text => {
                      const digitsOnly = text
                        .replace(/[^0-9]/g, '')
                        .slice(0, 10);
                      setNewPhone(digitsOnly);
                      if (formError) setFormError(null);
                    }}
                    onBlur={() =>
                      setTouched(prev => ({ ...prev, phone: true }))
                    }
                  />
                  {touched.phone && phoneError ? (
                    <Text style={styles.fieldErrorText}>{phoneError}</Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.formGroup}>
                <View style={styles.formLabelRow}>
                  <Text
                    style={[styles.formLabel, { color: theme.colors.text }]}
                  >
                    Email Address
                  </Text>
                  <Text
                    style={[
                      styles.charCount,
                      { color: theme.colors.mutedText },
                    ]}
                  >
                    {newEmail.length}/80
                  </Text>
                </View>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      color: theme.colors.text,
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.border,
                    },
                    touched.email && emailError ? styles.inputErrorBorder : null,
                  ]}
                  placeholder="customer@example.com (optional)"
                  placeholderTextColor={theme.colors.mutedText}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={80}
                  value={newEmail}
                  onChangeText={text => {
                    setNewEmail(text.trim().slice(0, 80));
                    if (formError) setFormError(null);
                  }}
                  onBlur={() =>
                    setTouched(prev => ({ ...prev, email: true }))
                  }
                />
                {touched.email && emailError ? (
                  <Text style={styles.fieldErrorText}>{emailError}</Text>
                ) : null}
              </View>

              <View style={styles.formGroup}>
                <View style={styles.formLabelRow}>
                  <Text
                    style={[styles.formLabel, { color: theme.colors.text }]}
                  >
                    Address
                  </Text>
                  <Text
                    style={[
                      styles.charCount,
                      { color: theme.colors.mutedText },
                    ]}
                  >
                    {newAddress.length}/200
                  </Text>
                </View>
                <TextInput
                  style={[
                    styles.formInputMulti,
                    {
                      borderColor: theme.colors.border,
                      color: theme.colors.text,
                      backgroundColor: theme.colors.background,
                    },
                  ]}
                  placeholder="Street address, locality (optional)"
                  placeholderTextColor={theme.colors.mutedText}
                  multiline
                  numberOfLines={2}
                  maxLength={200}
                  value={newAddress}
                  onChangeText={text => setNewAddress(text.slice(0, 200))}
                />
              </View>

              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <View style={styles.formLabelRow}>
                    <Text
                      style={[styles.formLabel, { color: theme.colors.text }]}
                    >
                      City
                    </Text>
                    <Text
                      style={[
                        styles.charCount,
                        { color: theme.colors.mutedText },
                      ]}
                    >
                      {newCity.length}/50
                    </Text>
                  </View>
                  <TextInput
                    style={[
                      styles.formInput,
                      {
                        borderColor: theme.colors.border,
                        color: theme.colors.text,
                        backgroundColor: theme.colors.background,
                      },
                    ]}
                    placeholder="e.g. Hyderabad"
                    placeholderTextColor={theme.colors.mutedText}
                    autoCapitalize="words"
                    maxLength={50}
                    value={newCity}
                    onChangeText={text => setNewCity(text.slice(0, 50))}
                  />
                </View>

                <View style={styles.formCol}>
                  <View style={styles.formLabelRow}>
                    <Text
                      style={[styles.formLabel, { color: theme.colors.text }]}
                    >
                      Pincode
                    </Text>
                    <Text
                      style={[
                        styles.charCount,
                        { color: theme.colors.mutedText },
                      ]}
                    >
                      {newPincode.length}/6
                    </Text>
                  </View>
                  <TextInput
                    style={[
                      styles.formInput,
                      {
                        color: theme.colors.text,
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                      },
                      touched.pincode && pincodeError ? styles.inputErrorBorder : null,
                    ]}
                    placeholder="6-digit PIN"
                    placeholderTextColor={theme.colors.mutedText}
                    keyboardType="number-pad"
                    maxLength={6}
                    value={newPincode}
                    onChangeText={text => {
                      const digitsOnly = text
                        .replace(/[^0-9]/g, '')
                        .slice(0, 6);
                      setNewPincode(digitsOnly);
                      if (formError) setFormError(null);
                    }}
                    onBlur={() =>
                      setTouched(prev => ({ ...prev, pincode: true }))
                    }
                  />
                  {touched.pincode && pincodeError ? (
                    <Text style={styles.fieldErrorText}>{pincodeError}</Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.formGroup}>
                <View style={styles.formLabelRow}>
                  <Text
                    style={[styles.formLabel, { color: theme.colors.text }]}
                  >
                    State
                  </Text>
                </View>
                <Pressable
                  style={[
                    styles.stateSelectorBtn,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.background,
                    },
                  ]}
                  onPress={() => {
                    setStateSearchText('');
                    setShowStatePicker(true);
                  }}
                >
                  <Text
                    style={[
                      styles.stateSelectorText,
                      {
                        color: newState
                          ? theme.colors.text
                          : theme.colors.mutedText,
                      },
                    ]}
                  >
                    {newState || 'Select State'}
                  </Text>
                  <ChevronDown size={16} color={theme.colors.mutedText} />
                </Pressable>
              </View>

              <Pressable
                disabled={isSubmitting}
                style={[
                  styles.submitCustomerBtn,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={handleCreateAndSelectCustomer}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <UserPlus size={16} color="#FFFFFF" />
                    <Text style={styles.submitCustomerBtnText}>
                      Add Customer & Select
                    </Text>
                  </>
                )}
              </Pressable>
            </ScrollView>
          )}
        </View>
      </View>

      {/* Nested State Picker Modal */}
      <Modal visible={showStatePicker} transparent animationType="slide">
        <View style={styles.modalBackdropBottom}>
          <View
            style={[
              styles.statePickerSheet,
              {
                backgroundColor: theme.colors.card,
                paddingBottom: Math.max(insets.bottom, 20) + 10,
              },
            ]}
          >
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>
                Select State
              </Text>
              <Pressable
                onPress={() => setShowStatePicker(false)}
                hitSlop={8}
              >
                <X size={20} color={theme.colors.mutedText} />
              </Pressable>
            </View>

            <TextInput
              style={[
                styles.customerSearchInput,
                {
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                  backgroundColor: theme.colors.background,
                },
              ]}
              placeholder="Search Indian states..."
              placeholderTextColor={theme.colors.mutedText}
              value={stateSearchText}
              onChangeText={setStateSearchText}
            />

            <ScrollView
              style={styles.stateListScroll}
              showsVerticalScrollIndicator={false}
            >
              {INDIAN_STATES.filter(s =>
                s
                  .toLowerCase()
                  .includes(stateSearchText.trim().toLowerCase()),
              ).map(stateName => {
                const isSelected = newState === stateName;
                return (
                  <Pressable
                    key={stateName}
                    style={[
                      styles.stateOptionItem,
                      {
                        borderColor: theme.colors.border,
                        backgroundColor: isSelected
                          ? theme.dark
                            ? '#163330'
                            : '#ECF8F6'
                          : theme.colors.card,
                      },
                    ]}
                    onPress={() => {
                      setNewState(stateName);
                      setShowStatePicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.stateOptionText,
                        isSelected
                          ? styles.stateOptionTextSelected
                          : styles.stateOptionTextUnselected,
                        {
                          color: isSelected
                            ? theme.colors.primary
                            : theme.colors.text,
                        },
                      ]}
                    >
                      {stateName}
                    </Text>
                    {isSelected && (
                      <Check size={16} color={theme.colors.primary} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdropBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
    maxHeight: '85%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetTitle: {
    fontWeight: '800',
    fontSize: 18,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 10,
    marginBottom: 14,
  },
  tabContainerLight: {
    backgroundColor: '#F1F5F9',
  },
  tabContainerDark: {
    backgroundColor: '#1E293B',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 12.5,
  },
  tabTextActive: {
    fontWeight: '700',
  },
  tabTextInactive: {
    fontWeight: '500',
  },
  avatarLight: {
    backgroundColor: '#ECF8F6',
  },
  avatarDark: {
    backgroundColor: '#163330',
  },
  inputErrorBorder: {
    borderColor: '#EF4444',
  },
  tabContent: {
    flexShrink: 1,
  },
  walkInCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  walkInLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  walkInIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walkInTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  walkInSub: {
    fontSize: 10.5,
    marginTop: 1,
  },
  customerSearchInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    fontSize: 13,
  },
  customerList: {
    maxHeight: 260,
  },
  emptyListWrap: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  emptyListText: {
    fontSize: 12.5,
  },
  switchToAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  switchToAddBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  customerListItem: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerListContent: {
    flex: 1,
  },
  customerListLeft: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  customerAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerListName: {
    fontSize: 13,
    fontWeight: '700',
  },
  customerListPhone: {
    fontSize: 11,
    marginTop: 1,
  },
  pastOrdersButton: {
    padding: 8,
    borderRadius: 6,
  },
  formScroll: {
    maxHeight: 380,
  },
  formErrorBanner: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#F87171',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  formErrorText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '600',
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  formCol: {
    flex: 1,
  },
  formGroup: {
    marginBottom: 12,
  },
  formLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  charCount: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  reqStar: {
    color: '#EF4444',
  },
  fieldErrorText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
  },
  formInputMulti: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  stateSelectorBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stateSelectorText: {
    fontSize: 13,
    fontWeight: '500',
  },
  statePickerSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    maxHeight: '75%',
  },
  stateListScroll: {
    maxHeight: 320,
    marginTop: 6,
  },
  stateOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 6,
  },
  stateOptionText: {
    fontSize: 13.5,
  },
  stateOptionTextSelected: {
    fontWeight: '700',
  },
  stateOptionTextUnselected: {
    fontWeight: '500',
  },
  submitCustomerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 10,
    marginTop: 6,
    marginBottom: 10,
  },
  submitCustomerBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

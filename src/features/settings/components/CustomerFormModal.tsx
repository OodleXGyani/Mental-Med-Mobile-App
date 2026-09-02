import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from 'lucide-react-native';
import { useAppTheme } from '../../../shared/theme';
import { customerService } from '../services/customerService';
import { CustomerDetails, CreateCustomerPayload } from '../types';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const formatDisplayDOB = (value: string): string => {
  if (!value) return '';
  const parts = value.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const date = new Date(y, m, d);
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date);
    }
  }
  return value;
};

const CUSTOMER_TYPE_OPTIONS = ['Individual', 'Company', 'Partnership'] as const;

const COUNTRY_OPTIONS = [
  'India',
  'United States',
  'United Arab Emirates',
  'United Kingdom',
  'Nepal',
  'Bangladesh',
];

const STATE_OPTIONS = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam',
  'Bihar', 'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
  'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha',
  'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

const STATUS_OPTIONS = ['Active', 'Inactive'] as const;

export const lookupStateFromPincode = (pincode: string): { state?: string; country: string; city?: string } => {
  const pin = pincode.replace(/\D/g, '');
  if (pin.length < 3) return { country: 'India' };

  const p3 = parseInt(pin.slice(0, 3), 10);
  const p2 = parseInt(pin.slice(0, 2), 10);

  // 11: Delhi
  if (p2 === 11) return { state: 'Delhi', country: 'India', city: 'Delhi' };
  // 12-13: Haryana
  if (p2 >= 12 && p2 <= 13) return { state: 'Haryana', country: 'India' };
  // 14-15: Punjab
  if (p2 >= 14 && p2 <= 15) return { state: 'Punjab', country: 'India' };
  // 16: Chandigarh
  if (p2 === 16) return { state: 'Chandigarh', country: 'India', city: 'Chandigarh' };
  // 17: Himachal Pradesh
  if (p2 === 17) return { state: 'Himachal Pradesh', country: 'India' };
  // 18-19: Jammu & Kashmir / Ladakh
  if (p3 === 194) return { state: 'Ladakh', country: 'India' };
  if (p2 >= 18 && p2 <= 19) return { state: 'Jammu and Kashmir', country: 'India' };
  // 20-28: Uttar Pradesh / Uttarakhand
  if ((p3 >= 246 && p3 <= 249) || p3 === 263 || p3 === 262) return { state: 'Uttarakhand', country: 'India' };
  if (p2 >= 20 && p2 <= 28) return { state: 'Uttar Pradesh', country: 'India' };
  // 30-34: Rajasthan
  if (p2 >= 30 && p2 <= 34) return { state: 'Rajasthan', country: 'India' };
  // 36-39: Gujarat / Daman & Diu / Dadra
  if (p3 === 396 || p3 === 362) return { state: 'Dadra and Nagar Haveli and Daman and Diu', country: 'India' };
  if (p2 >= 36 && p2 <= 39) return { state: 'Gujarat', country: 'India' };
  // 40-44: Maharashtra / Goa
  if (p3 === 403) return { state: 'Goa', country: 'India', city: 'Goa' };
  if (p2 >= 40 && p2 <= 44) return { state: 'Maharashtra', country: 'India' };
  // 45-49: MP / Chhattisgarh
  if (p2 === 49) return { state: 'Chhattisgarh', country: 'India' };
  if (p2 >= 45 && p2 <= 48) return { state: 'Madhya Pradesh', country: 'India' };
  // 50-53: Telangana / Andhra Pradesh
  if (p3 >= 500 && p3 <= 509) return { state: 'Telangana', country: 'India' };
  if (p2 >= 51 && p2 <= 53) return { state: 'Andhra Pradesh', country: 'India' };
  // 56-59: Karnataka
  if (p2 >= 56 && p2 <= 59) return { state: 'Karnataka', country: 'India' };
  // 60-66: Tamil Nadu / Puducherry
  if (p3 === 605 || p3 === 607 || p3 === 609) return { state: 'Puducherry', country: 'India' };
  if (p2 >= 60 && p2 <= 66) return { state: 'Tamil Nadu', country: 'India' };
  // 67-69: Kerala / Lakshadweep
  if (p3 === 682) return { state: 'Lakshadweep', country: 'India' };
  if (p2 >= 67 && p2 <= 69) return { state: 'Kerala', country: 'India' };
  // 70-74: West Bengal / Andaman
  if (p3 === 744) return { state: 'Andaman and Nicobar Islands', country: 'India' };
  if (p2 >= 70 && p2 <= 74) return { state: 'West Bengal', country: 'India' };
  // 75-77: Odisha
  if (p2 >= 75 && p2 <= 77) return { state: 'Odisha', country: 'India' };
  // 78: Assam
  if (p2 === 78) return { state: 'Assam', country: 'India' };
  // 79: North East
  if (p3 >= 790 && p3 <= 792) return { state: 'Arunachal Pradesh', country: 'India' };
  if (p3 >= 793 && p3 <= 794) return { state: 'Meghalaya', country: 'India' };
  if (p3 === 795) return { state: 'Manipur', country: 'India' };
  if (p3 === 796) return { state: 'Mizoram', country: 'India' };
  if (p3 === 797 || p3 === 798) return { state: 'Nagaland', country: 'India' };
  if (p3 === 799) return { state: 'Tripura', country: 'India' };
  // 737: Sikkim
  if (p3 === 737) return { state: 'Sikkim', country: 'India' };
  // 80-85: Bihar / Jharkhand
  if (p3 >= 814 && p3 <= 835) return { state: 'Jharkhand', country: 'India' };
  if (p2 >= 80 && p2 <= 85) return { state: 'Bihar', country: 'India' };

  return { country: 'India' };
};

export type FormState = {
  customer_name: string;
  customer_type: string;
  custom_date_of_birth: string;
  custom_is_chronic_patient: boolean;
  contact_person: string;
  phone: string;
  email: string;
  credit_limit: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  status: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const emptyForm: FormState = {
  customer_name: '',
  customer_type: 'Individual',
  custom_date_of_birth: '',
  custom_is_chronic_patient: false,
  contact_person: '',
  phone: '',
  email: '',
  credit_limit: '',
  address: '',
  city: '',
  state: 'Telangana',
  country: 'India',
  pincode: '',
  status: 'Active',
};

const toFormState = (details: CustomerDetails): FormState => ({
  customer_name: details.customer_name || '',
  customer_type: details.customer_type || 'Individual',
  custom_date_of_birth: details.custom_date_of_birth || '',
  custom_is_chronic_patient: Boolean(details.custom_is_chronic_patient),
  contact_person: details.contact_person || '',
  phone: details.phone || '',
  email: details.email || '',
  credit_limit:
    details.credit_limit !== null && details.credit_limit !== undefined
      ? String(details.credit_limit)
      : '',
  address: details.address || '',
  city: details.city || '',
  state: details.state || 'Telangana',
  country: details.country || 'India',
  pincode: details.pincode || '',
  status: details.status || 'Active',
});

export type CustomerFormSuccessPayload = {
  customerId?: string;
  customerName: string;
  phone: string;
  message: string;
};

type Props = {
  visible: boolean;
  mode?: 'create' | 'edit';
  customerId?: string;
  initialData?: CustomerDetails | null;
  onClose: () => void;
  onSuccess: (result: CustomerFormSuccessPayload) => void;
};

export const CustomerFormModal = ({
  visible,
  mode = 'create',
  customerId,
  initialData,
  onClose,
  onSuccess,
}: Props) => {
  const theme = useAppTheme();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Active inline picker sheet (State, Country, or DOB Calendar) within the SAME modal root
  const [activePicker, setActivePicker] = useState<'state' | 'country' | 'dob' | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const [dobPickerDate, setDobPickerDate] = useState<Date>(() => new Date(2000, 0, 1));
  const [dobViewMode, setDobViewMode] = useState<'day' | 'month' | 'year'>('day');

  useEffect(() => {
    if (!visible) {
      setActivePicker(null);
      setPickerSearch('');
      setDobViewMode('day');
      setSubmitting(false);
      return;
    }
    setErrors({});
    setSubmitting(false);
    setActivePicker(null);
    setPickerSearch('');
    setDobViewMode('day');
    if (mode === 'edit' && initialData) {
      setForm(toFormState(initialData));
    } else {
      setForm(emptyForm);
    }
  }, [visible, mode, initialData]);

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'pincode') {
        const pin = String(value).replace(/\D/g, '');
        if (pin.length === 6) {
          const resolved = lookupStateFromPincode(pin);
          if (resolved.state) {
            next.state = resolved.state;
          }
          if (resolved.country) {
            next.country = resolved.country;
          }
          if (resolved.city && !prev.city.trim()) {
            next.city = resolved.city;
          }
        }
      }
      return next;
    });

    if (field === 'pincode') {
      const pin = String(value).replace(/\D/g, '');
      if (pin.length === 6) {
        fetch(`https://api.postalpincode.in/pincode/${pin}`)
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data) && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
              const po = data[0].PostOffice[0];
              const apiState = po.State as string;
              const apiDistrict = po.District as string;
              setForm(curr => ({
                ...curr,
                state: apiState && STATE_OPTIONS.includes(apiState) ? apiState : curr.state,
                country: 'India',
                city: !curr.city.trim() && apiDistrict ? apiDistrict : curr.city,
              }));
              setErrors(curr => ({
                ...curr,
                state: undefined,
                country: undefined,
                pincode: undefined,
              }));
            }
          })
          .catch(() => {});
      }
    }

    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const next: FormErrors = {};
    const trimmedName = form.customer_name.trim();
    const phoneDigits = form.phone.replace(/\D/g, '');
    const trimmedEmail = form.email.trim();
    const trimmedDOB = form.custom_date_of_birth.trim();
    const trimmedAddress = form.address.trim();
    const trimmedCity = form.city.trim();
    const pincodeDigits = form.pincode.replace(/\D/g, '');

    // Customer Name *
    if (!trimmedName) {
      next.customer_name = 'Customer Name is required';
    } else if (trimmedName.length < 2) {
      next.customer_name = 'Name must be at least 2 characters';
    } else if (!/^[a-zA-Z\s.'-]+$/.test(trimmedName)) {
      next.customer_name = 'Name can only contain letters and spaces';
    }

    // Customer Type *
    if (!form.customer_type) {
      next.customer_type = 'Please select customer type';
    }

    // Date of Birth *
    if (!trimmedDOB) {
      next.custom_date_of_birth = 'Date of Birth is required';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmedDOB)) {
      next.custom_date_of_birth = 'Use YYYY-MM-DD format (e.g. 1990-05-15)';
    }

    // Phone Number *
    if (!phoneDigits) {
      next.phone = 'Phone Number is required';
    } else if (phoneDigits.length !== 10) {
      next.phone = 'Phone number must be exactly 10 digits';
    } else if (!/^[6-9]\d{9}$/.test(phoneDigits)) {
      next.phone = 'Must start with 6, 7, 8, or 9';
    }

    // Email Address *
    if (!trimmedEmail) {
      next.email = 'Email Address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      next.email = 'Invalid email format (e.g. name@domain.com)';
    }

    // Address *
    if (!trimmedAddress) {
      next.address = 'Address is required';
    }

    // City *
    if (!trimmedCity) {
      next.city = 'City is required';
    }

    // State *
    if (!form.state) {
      next.state = 'State is required';
    }

    // Country *
    if (!form.country) {
      next.country = 'Country is required';
    }

    // Pincode *
    if (!pincodeDigits) {
      next.pincode = 'Pincode is required';
    } else if (pincodeDigits.length !== 6) {
      next.pincode = 'Pincode must be exactly 6 digits';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (submitting || !validate()) {
      Alert.alert('Incomplete Form', 'Please fill in all required fields marked with * before submitting.');
      return;
    }
    setSubmitting(true);

    try {
      const basePayload: CreateCustomerPayload = {
        customer_name: form.customer_name.trim(),
        customer_type: form.customer_type || 'Individual',
        custom_date_of_birth: form.custom_date_of_birth.trim(),
        custom_is_chronic_patient: form.custom_is_chronic_patient,
        contact_person: form.contact_person.trim() || form.customer_name.trim(),
        phone: form.phone.replace(/\D/g, ''),
        email: form.email.trim(),
        credit_limit: form.credit_limit.trim() ? Number(form.credit_limit) : 0,
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state || 'Telangana',
        country: form.country || 'India',
        pincode: form.pincode.replace(/\D/g, ''),
      };

      let message = '';
      if (mode === 'edit' && customerId) {
        message = await customerService.updateCustomer({
          ...basePayload,
          customer_id: customerId,
          status: form.status as 'Active' | 'Inactive',
        });
      } else {
        message = await customerService.createCustomer(basePayload);
      }

      onSuccess({
        customerId: customerId || basePayload.customer_name,
        customerName: basePayload.customer_name,
        phone: basePayload.phone,
        message: message || (mode === 'edit' ? 'Customer updated successfully.' : 'Customer created successfully.'),
      });
    } catch (error) {
      Alert.alert(
        mode === 'edit' ? 'Unable to update customer' : 'Unable to create customer',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (
    label: string,
    field: keyof FormState,
    placeholder: string,
    options?: {
      keyboardType?: React.ComponentProps<typeof TextInput>['keyboardType'];
      autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
      multiline?: boolean;
      numberOfLines?: number;
      maxLength?: number;
      required?: boolean;
      showCounter?: boolean;
    },
  ) => {
    const valueStr = String(form[field] ?? '');
    const currentLength = valueStr.length;
    const maxLength = options?.maxLength;
    const isRequired = options?.required !== false;

    return (
      <View style={styles.formGroup}>
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: theme.colors.text }]}>
            {label} {isRequired ? <Text style={styles.required}>*</Text> : null}
          </Text>
          {options?.showCounter && maxLength ? (
            <Text style={[styles.counterText, { color: theme.colors.mutedText }]}>
              {currentLength}/{maxLength}
            </Text>
          ) : null}
        </View>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.background,
              borderColor: errors[field] ? theme.colors.danger : theme.colors.border,
              color: theme.colors.text,
            },
            options?.multiline && styles.multilineInput,
          ]}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.mutedText}
          value={valueStr}
          onChangeText={text => setField(field, text as FormState[typeof field])}
          keyboardType={options?.keyboardType}
          autoCapitalize={options?.autoCapitalize ?? 'sentences'}
          multiline={options?.multiline}
          numberOfLines={options?.numberOfLines}
          maxLength={options?.maxLength}
        />
        {errors[field] ? (
          <Text style={[styles.errorText, { color: theme.colors.danger }]}>{errors[field]}</Text>
        ) : null}
      </View>
    );
  };

  const renderDobPickerOverlay = () => {
    if (activePicker !== 'dob') return null;

    const currentYear = new Date().getFullYear();
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const pickerYear = dobPickerDate.getFullYear();
    const pickerMonth = dobPickerDate.getMonth();

    const daysInMonth = new Date(pickerYear, pickerMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(pickerYear, pickerMonth, 1).getDay();

    const selectedDOB = form.custom_date_of_birth;

    // Generate years from currentYear down to 1920
    const years: number[] = [];
    for (let y = currentYear; y >= 1920; y--) {
      years.push(y);
    }

    const handleSelectDay = (day: number) => {
      const selected = new Date(pickerYear, pickerMonth, day);
      if (selected > today) {
        Alert.alert('Invalid Date', 'Date of birth cannot be in the future.');
        return;
      }
      const val = `${pickerYear}-${String(pickerMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      setField('custom_date_of_birth', val);
      if (errors.custom_date_of_birth) {
        setErrors(prev => ({ ...prev, custom_date_of_birth: undefined }));
      }
      setActivePicker(null);
      setDobViewMode('day');
    };

    return (
      <View style={[styles.pickerOverlay, { backgroundColor: theme.colors.card }]}>
        <View style={[styles.pickerHeader, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.pickerTitle, { color: theme.colors.text }]}>
            Select Date of Birth
          </Text>
          <Pressable
            onPress={() => {
              setActivePicker(null);
              setDobViewMode('day');
            }}
            hitSlop={8}
          >
            <X size={20} color={theme.colors.text} strokeWidth={2.5} />
          </Pressable>
        </View>

        {/* Selected Date Summary */}
        <View
          style={[
            styles.dobSummaryBox,
            theme.dark ? styles.dobSummaryBoxDark : styles.dobSummaryBoxLight,
            { borderColor: theme.colors.border },
          ]}
        >
          <Text style={[styles.dobSummaryLabel, { color: theme.colors.mutedText }]}>
            Selected Date:
          </Text>
          <Text style={[styles.dobSummaryValue, { color: theme.colors.primary }]}>
            {selectedDOB ? `${formatDisplayDOB(selectedDOB)} (${selectedDOB})` : 'None selected'}
          </Text>
        </View>

        {/* View Mode Switcher Header */}
        <View style={[styles.dobNavHeader, { borderBottomColor: theme.colors.border }]}>
          <Pressable
            style={styles.navArrowButton}
            onPress={() => {
              if (dobViewMode === 'day') {
                setDobPickerDate(new Date(pickerYear, pickerMonth - 1, 1));
              } else if (dobViewMode === 'month') {
                setDobPickerDate(new Date(pickerYear - 1, pickerMonth, 1));
              }
            }}
          >
            <ChevronLeft size={20} color={theme.colors.text} strokeWidth={2.5} />
          </Pressable>

          <View style={styles.dobModeButtonsRow}>
            <Pressable
              style={[
                styles.dobModeButton,
                dobViewMode === 'month' && { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => setDobViewMode(curr => (curr === 'month' ? 'day' : 'month'))}
            >
              <Text
                style={[
                  styles.dobModeButtonText,
                  dobViewMode === 'month' ? styles.dobModeButtonTextActive : { color: theme.colors.text },
                ]}
              >
                {MONTH_NAMES[pickerMonth]} ▾
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.dobModeButton,
                dobViewMode === 'year' && { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => setDobViewMode(curr => (curr === 'year' ? 'day' : 'year'))}
            >
              <Text
                style={[
                  styles.dobModeButtonText,
                  dobViewMode === 'year' ? styles.dobModeButtonTextActive : { color: theme.colors.text },
                ]}
              >
                {pickerYear} ▾
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={[
              styles.navArrowButton,
              pickerYear >= currentYear && pickerMonth >= new Date().getMonth() && styles.disabledArrow,
            ]}
            disabled={Boolean(pickerYear >= currentYear && pickerMonth >= new Date().getMonth())}
            onPress={() => {
              if (dobViewMode === 'day') {
                setDobPickerDate(new Date(pickerYear, pickerMonth + 1, 1));
              } else if (dobViewMode === 'month') {
                setDobPickerDate(new Date(pickerYear + 1, pickerMonth, 1));
              }
            }}
          >
            <ChevronRight size={20} color={theme.colors.text} strokeWidth={2.5} />
          </Pressable>
        </View>

        {/* Day Grid View */}
        {dobViewMode === 'day' ? (
          <View style={styles.dobDayGridContainer}>
            {/* Weekday Row */}
            <View style={styles.dobWeekdayRow}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                <Text key={idx} style={[styles.dobWeekdayText, { color: theme.colors.mutedText }]}>
                  {day}
                </Text>
              ))}
            </View>

            {/* Days Grid */}
            <ScrollView style={styles.dobGridScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.dobGrid}>
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <View key={`empty-${i}`} style={styles.dobDayCell} />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateObj = new Date(pickerYear, pickerMonth, day);
                  const isFuture = dateObj > today;
                  const dateStr = `${pickerYear}-${String(pickerMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isSelected = selectedDOB === dateStr;

                  return (
                    <Pressable
                      key={`day-${day}`}
                      style={[
                        styles.dobDayCell,
                        isSelected && { backgroundColor: theme.colors.primary },
                        isFuture && styles.disabledDay,
                      ]}
                      disabled={Boolean(isFuture)}
                      onPress={() => handleSelectDay(day)}
                    >
                      <Text
                        style={[
                          styles.dobDayText,
                          isSelected
                            ? styles.dobDayTextSelected
                            : isFuture
                            ? [styles.dobDayTextFuture, { color: theme.colors.mutedText }]
                            : { color: theme.colors.text },
                        ]}
                      >
                        {day}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        ) : null}

        {/* Month Picker View */}
        {dobViewMode === 'month' ? (
          <ScrollView style={styles.dobPickerList} showsVerticalScrollIndicator={false}>
            <View style={styles.dobMonthGrid}>
              {MONTH_NAMES.map((name, index) => {
                const isSelected = pickerMonth === index;
                return (
                  <Pressable
                    key={name}
                    style={[
                      styles.dobMonthCell,
                      { borderColor: isSelected ? theme.colors.primary : theme.colors.border },
                      isSelected
                        ? theme.dark
                          ? styles.darkSelectedBg
                          : styles.lightSelectedBg
                        : { backgroundColor: theme.colors.card },
                    ]}
                    onPress={() => {
                      setDobPickerDate(new Date(pickerYear, index, 1));
                      setDobViewMode('day');
                    }}
                  >
                    <Text
                      style={[
                        styles.dobMonthText,
                        isSelected
                          ? [styles.dobMonthTextSelected, { color: theme.colors.primary }]
                          : { color: theme.colors.text },
                      ]}
                    >
                      {name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        ) : null}

        {/* Year Picker View */}
        {dobViewMode === 'year' ? (
          <ScrollView style={styles.dobPickerList} showsVerticalScrollIndicator={false}>
            <View style={styles.dobYearGrid}>
              {years.map(y => {
                const isSelected = pickerYear === y;
                return (
                  <Pressable
                    key={y}
                    style={[
                      styles.dobYearCell,
                      { borderColor: isSelected ? theme.colors.primary : theme.colors.border },
                      isSelected
                        ? theme.dark
                          ? styles.darkSelectedBg
                          : styles.lightSelectedBg
                        : { backgroundColor: theme.colors.card },
                    ]}
                    onPress={() => {
                      setDobPickerDate(new Date(y, pickerMonth, 1));
                      setDobViewMode('day');
                    }}
                  >
                    <Text
                      style={[
                        styles.dobYearText,
                        isSelected
                          ? [styles.dobYearTextSelected, { color: theme.colors.primary }]
                          : { color: theme.colors.text },
                      ]}
                    >
                      {y}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        ) : null}
      </View>
    );
  };

  const renderPickerOverlay = () => {
    if (!activePicker) return null;
    if (activePicker === 'dob') return renderDobPickerOverlay();

    const isState = activePicker === 'state';
    const list = isState ? STATE_OPTIONS : COUNTRY_OPTIONS;
    const title = isState ? 'Select State' : 'Select Country';
    const currentValue = isState ? form.state : form.country;

    const filtered = list.filter(item =>
      item.toLowerCase().includes(pickerSearch.trim().toLowerCase()),
    );

    return (
      <View style={[styles.pickerOverlay, { backgroundColor: theme.colors.card }]}>
        <View style={[styles.pickerHeader, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.pickerTitle, { color: theme.colors.text }]}>{title}</Text>
          <Pressable
            onPress={() => {
              setActivePicker(null);
              setPickerSearch('');
            }}
            hitSlop={8}
          >
            <X size={20} color={theme.colors.text} strokeWidth={2.5} />
          </Pressable>
        </View>

        <View
          style={[
            styles.pickerSearchBox,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Search size={16} color={theme.colors.mutedText} strokeWidth={2} />
          <TextInput
            style={[styles.pickerSearchInput, { color: theme.colors.text }]}
            placeholder={`Search ${isState ? 'state' : 'country'}...`}
            placeholderTextColor={theme.colors.mutedText}
            value={pickerSearch}
            onChangeText={setPickerSearch}
            autoFocus
          />
        </View>

        <ScrollView style={styles.pickerList} keyboardShouldPersistTaps="handled">
          {filtered.map(item => {
            const isSelected = currentValue === item;
            return (
              <Pressable
                key={item}
                style={[
                  styles.pickerItem,
                  { borderColor: theme.colors.border },
                  isSelected
                    ? theme.dark
                      ? styles.darkSelectedBg
                      : styles.lightSelectedBg
                    : { backgroundColor: theme.colors.card },
                ]}
                onPress={() => {
                  if (isState) setField('state', item);
                  else setField('country', item);
                  setActivePicker(null);
                  setPickerSearch('');
                }}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    isSelected
                      ? [styles.pickerItemTextSelected, { color: theme.colors.primary }]
                      : { color: theme.colors.text },
                  ]}
                >
                  {item}
                </Text>
                {isSelected ? <Check size={18} color={theme.colors.primary} strokeWidth={2.5} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        if (activePicker) {
          setActivePicker(null);
        } else {
          onClose();
        }
      }}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoid}
        >
          <View style={[styles.sheet, { backgroundColor: theme.colors.card }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                {mode === 'edit' ? 'Edit Customer' : 'Add New Customer'}
              </Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <X size={22} color={theme.colors.text} strokeWidth={2.5} />
              </Pressable>
            </View>

            {/* Form Body */}
            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Customer Name */}
              {renderField('Customer Name', 'customer_name', 'Enter customer/company name', {
                maxLength: 50,
                showCounter: true,
                autoCapitalize: 'words',
                required: true,
              })}

              {/* Customer Type Segmented Pills */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  Customer Type <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.pillRow}>
                  {CUSTOMER_TYPE_OPTIONS.map(type => {
                    const isSelected = form.customer_type === type;
                    return (
                      <Pressable
                        key={type}
                        style={[
                          styles.pillButton,
                          { borderColor: isSelected ? theme.colors.primary : theme.colors.border },
                          isSelected
                            ? theme.dark
                              ? styles.darkSelectedBg
                              : styles.lightSelectedBg
                            : { backgroundColor: theme.colors.background },
                        ]}
                        onPress={() => setField('customer_type', type)}
                      >
                        <Text
                          style={[
                            styles.pillButtonText,
                            isSelected
                              ? [styles.pillButtonTextSelected, { color: theme.colors.primary }]
                              : { color: theme.colors.text },
                          ]}
                        >
                          {type}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {errors.customer_type ? (
                  <Text style={[styles.errorText, { color: theme.colors.danger }]}>
                    {errors.customer_type}
                  </Text>
                ) : null}
              </View>

              {/* Date of Birth Interactive Calendar Field */}
              <View style={styles.formGroup}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Date of Birth <Text style={styles.required}>*</Text>
                  </Text>
                </View>
                <Pressable
                  style={[
                    styles.selectorInput,
                    {
                      backgroundColor: theme.colors.background,
                      borderColor: errors.custom_date_of_birth
                        ? theme.colors.danger
                        : theme.colors.border,
                    },
                  ]}
                  onPress={() => {
                    let initialPickerDate = new Date(2000, 0, 1);
                    if (form.custom_date_of_birth) {
                      const parts = form.custom_date_of_birth.split('-');
                      if (parts.length === 3) {
                        const y = parseInt(parts[0], 10);
                        const m = parseInt(parts[1], 10) - 1;
                        const d = parseInt(parts[2], 10);
                        const parsed = new Date(y, m, d);
                        if (!Number.isNaN(parsed.getTime())) {
                          initialPickerDate = parsed;
                        }
                      }
                    }
                    setDobPickerDate(initialPickerDate);
                    setDobViewMode('day');
                    setActivePicker('dob');
                  }}
                >
                  <View style={styles.dobTriggerRow}>
                    <Calendar
                      size={18}
                      color={theme.colors.primary}
                      strokeWidth={2}
                      style={styles.dobTriggerIcon}
                    />
                    <Text
                      style={[
                        styles.selectorText,
                        form.custom_date_of_birth
                          ? [styles.selectorTextSelected, { color: theme.colors.text }]
                          : { color: theme.colors.mutedText },
                      ]}
                    >
                      {form.custom_date_of_birth
                        ? `${formatDisplayDOB(form.custom_date_of_birth)} (${form.custom_date_of_birth})`
                        : 'Select date of birth'}
                    </Text>
                  </View>
                  <ChevronDown size={18} color={theme.colors.mutedText} strokeWidth={2} />
                </Pressable>
                {errors.custom_date_of_birth ? (
                  <Text style={[styles.errorText, { color: theme.colors.danger }]}>
                    {errors.custom_date_of_birth}
                  </Text>
                ) : null}
              </View>

              {/* Chronic Patient Toggle */}
              <View style={styles.switchRow}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Is Chronic Patient?</Text>
                <Switch
                  value={form.custom_is_chronic_patient}
                  onValueChange={value => setField('custom_is_chronic_patient', value)}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* Contact Person */}
              {renderField('Contact Person', 'contact_person', 'Enter contact person name', {
                required: false,
                autoCapitalize: 'words',
              })}

              {/* Phone Number */}
              {renderField('Phone Number', 'phone', '10-digit mobile number', {
                keyboardType: 'phone-pad',
                maxLength: 10,
                showCounter: true,
                required: true,
              })}

              {/* Email Address */}
              {renderField('Email Address', 'email', 'customer@example.com', {
                keyboardType: 'email-address',
                autoCapitalize: 'none',
                maxLength: 80,
                required: true,
                showCounter: true,
              })}

              {/* Credit Limit */}
              {renderField('Credit Limit (Rs)', 'credit_limit', 'Enter credit limit', {
                keyboardType: 'numeric',
                required: false,
              })}

              {/* Address */}
              {renderField('Address', 'address', 'Enter complete address', {
                multiline: true,
                numberOfLines: 3,
                maxLength: 200,
                required: true,
                showCounter: true,
              })}

              {/* City & Pincode in 2 columns */}
              <View style={styles.rowTwoColumns}>
                <View style={styles.flexOne}>
                  {renderField('City', 'city', 'Enter city', {
                    maxLength: 50,
                    required: true,
                    showCounter: true,
                    autoCapitalize: 'words',
                  })}
                </View>
                <View style={styles.flexOne}>
                  {renderField('Pincode', 'pincode', 'Enter pincode', {
                    keyboardType: 'number-pad',
                    maxLength: 6,
                    required: true,
                    showCounter: true,
                  })}
                </View>
              </View>

              {/* State Inline Selector */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  State <Text style={styles.required}>*</Text>
                </Text>
                <Pressable
                  style={[
                    styles.selectorInput,
                    {
                      backgroundColor: theme.colors.background,
                      borderColor: errors.state ? theme.colors.danger : theme.colors.border,
                    },
                  ]}
                  onPress={() => {
                    setPickerSearch('');
                    setActivePicker('state');
                  }}
                >
                  <Text
                    style={[
                      styles.selectorText,
                      { color: form.state ? theme.colors.text : theme.colors.mutedText },
                    ]}
                  >
                    {form.state || 'Select state'}
                  </Text>
                  <ChevronDown size={18} color={theme.colors.mutedText} strokeWidth={2} />
                </Pressable>
                {errors.state ? (
                  <Text style={[styles.errorText, { color: theme.colors.danger }]}>{errors.state}</Text>
                ) : null}
              </View>

              {/* Country Inline Selector */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  Country <Text style={styles.required}>*</Text>
                </Text>
                <Pressable
                  style={[
                    styles.selectorInput,
                    {
                      backgroundColor: theme.colors.background,
                      borderColor: errors.country ? theme.colors.danger : theme.colors.border,
                    },
                  ]}
                  onPress={() => {
                    setPickerSearch('');
                    setActivePicker('country');
                  }}
                >
                  <Text
                    style={[
                      styles.selectorText,
                      { color: form.country ? theme.colors.text : theme.colors.mutedText },
                    ]}
                  >
                    {form.country || 'Select country'}
                  </Text>
                  <ChevronDown size={18} color={theme.colors.mutedText} strokeWidth={2} />
                </Pressable>
                {errors.country ? (
                  <Text style={[styles.errorText, { color: theme.colors.danger }]}>{errors.country}</Text>
                ) : null}
              </View>

              {/* Status in Edit mode */}
              {mode === 'edit' ? (
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Status <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.pillRow}>
                    {STATUS_OPTIONS.map(statusVal => {
                      const isSelected = form.status === statusVal;
                      return (
                        <Pressable
                          key={statusVal}
                          style={[
                            styles.pillButton,
                            { borderColor: isSelected ? theme.colors.primary : theme.colors.border },
                            isSelected
                              ? theme.dark
                                ? styles.darkSelectedBg
                                : styles.lightSelectedBg
                              : { backgroundColor: theme.colors.background },
                          ]}
                          onPress={() => setField('status', statusVal)}
                        >
                          <Text
                            style={[
                              styles.pillButtonText,
                              isSelected
                                ? [styles.pillButtonTextSelected, { color: theme.colors.primary }]
                                : { color: theme.colors.text },
                            ]}
                          >
                            {statusVal}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ) : null}
            </ScrollView>

            {/* Footer Buttons */}
            <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
              <Pressable
                style={[styles.cancelButton, { borderColor: theme.colors.border }]}
                onPress={onClose}
                disabled={Boolean(submitting)}
              >
                <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.submitButton,
                  { backgroundColor: theme.colors.primary },
                  submitting && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={Boolean(submitting)}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {mode === 'edit' ? 'Save Changes' : 'Add Customer'}
                  </Text>
                )}
              </Pressable>
            </View>

            {/* Inline Overlay Picker (Zero Nested Native Modals) */}
            {renderPickerOverlay()}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  keyboardAvoid: {
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '92%',
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
  },
  body: {
    maxHeight: 480,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  formGroup: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  counterText: {
    fontSize: 11,
    fontWeight: '500',
  },
  required: {
    color: '#E74C3C',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  multilineInput: {
    minHeight: 68,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 11.5,
    marginTop: 4,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingVertical: 4,
  },
  rowTwoColumns: {
    flexDirection: 'row',
    gap: 12,
  },
  flexOne: {
    flex: 1,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pillButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillButtonText: {
    fontSize: 12.5,
  },
  selectorInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorText: {
    fontSize: 13.5,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  submitButton: {
    flex: 2,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  pickerOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  pickerSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
    marginBottom: 10,
  },
  pickerSearchInput: {
    flex: 1,
    fontSize: 13.5,
    padding: 0,
  },
  pickerList: {
    flex: 1,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 6,
  },
  pickerItemText: {
    fontSize: 13.5,
  },
  dobTriggerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dobTriggerIcon: {
    marginRight: 8,
  },
  dobSummaryBox: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 10,
    marginBottom: 8,
  },
  dobSummaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  dobSummaryValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  dobNavHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  navArrowButton: {
    padding: 6,
    borderRadius: 8,
  },
  dobModeButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dobModeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dobModeButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  dobDayGridContainer: {
    flex: 1,
  },
  dobWeekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  dobWeekdayText: {
    width: '14.285%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
  },
  dobGridScroll: {
    flex: 1,
  },
  dobGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingBottom: 10,
  },
  dobDayCell: {
    width: '14.285%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  darkSelectedBg: {
    backgroundColor: '#163330',
  },
  lightSelectedBg: {
    backgroundColor: '#ECF8F6',
  },
  dobSummaryBoxDark: {
    backgroundColor: '#163330',
  },
  dobSummaryBoxLight: {
    backgroundColor: '#ECF8F6',
  },
  dobModeButtonTextActive: {
    color: '#FFFFFF',
  },
  disabledArrow: {
    opacity: 0.3,
  },
  disabledDay: {
    opacity: 0.25,
  },
  dobDayText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dobDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dobDayTextFuture: {
    fontWeight: '600',
  },
  dobMonthText: {
    fontSize: 13,
    fontWeight: '500',
  },
  dobMonthTextSelected: {
    fontWeight: '700',
  },
  dobYearText: {
    fontSize: 13,
    fontWeight: '500',
  },
  dobYearTextSelected: {
    fontWeight: '700',
  },
  dobPickerList: {
    flex: 1,
  },
  dobMonthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 8,
  },
  dobMonthCell: {
    width: '30%',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  dobYearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 8,
  },
  dobYearCell: {
    width: '22%',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  pillButtonTextSelected: {
    fontWeight: '700',
  },
  selectorTextSelected: {
    fontWeight: '600',
  },
  pickerItemTextSelected: {
    fontWeight: '700',
  },
});

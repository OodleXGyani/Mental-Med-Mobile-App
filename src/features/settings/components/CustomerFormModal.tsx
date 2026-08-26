import React, { useEffect, useState } from 'react';
import {
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
import { X } from 'lucide-react-native';
import { useAppTheme } from '../../../shared/theme';
import { SearchableDropdown, DropdownOption } from '../../../shared/components/SearchableDropdown';
import { customerService } from '../services/customerService';
import { CustomerDetails } from '../types';

// Same field set and required/optional split as the web Customer Master
// form (sections/user/customerMaster/components/AddCustomerModal.jsx) --
// this modal is shared between "Add Customer" and "Edit Customer" the same
// way that web component is, via `mode` + `initialData`, so the two flows
// can't drift apart the way the mobile Add form and the (previously
// nonexistent) Edit form would have if built separately.

const CUSTOMER_TYPE_OPTIONS: DropdownOption[] = [
  { value: 'Company', description: 'Company' },
  { value: 'Individual', description: 'Individual' },
  { value: 'Partnership', description: 'Partnership' },
];

const COUNTRY_OPTIONS: DropdownOption[] = [
  { value: 'India', description: 'India' },
  { value: 'United States', description: 'United States' },
  { value: 'United Arab Emirates', description: 'United Arab Emirates' },
  { value: 'United Kingdom', description: 'United Kingdom' },
  { value: 'Nepal', description: 'Nepal' },
  { value: 'Bangladesh', description: 'Bangladesh' },
];

const STATE_OPTIONS: DropdownOption[] = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam',
  'Bihar', 'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
  'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha',
  'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
].map(name => ({ value: name, description: name }));

const STATUS_OPTIONS: DropdownOption[] = [
  { value: 'Active', description: 'Active' },
  { value: 'Inactive', description: 'Inactive' },
];

type FormState = {
  customer_name: string;
  customer_type: string;
  contact_person: string;
  phone: string;
  email: string;
  credit_limit: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  custom_date_of_birth: string;
  custom_is_chronic_patient: boolean;
  status: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const emptyForm: FormState = {
  customer_name: '',
  customer_type: '',
  contact_person: '',
  phone: '',
  email: '',
  credit_limit: '',
  address: '',
  city: '',
  state: '',
  country: '',
  pincode: '',
  custom_date_of_birth: '',
  custom_is_chronic_patient: false,
  status: 'Active',
};

const toFormState = (details: CustomerDetails): FormState => ({
  customer_name: details.customer_name || '',
  customer_type: details.customer_type || '',
  contact_person: details.contact_person || '',
  phone: details.phone || '',
  email: details.email || '',
  credit_limit:
    details.credit_limit !== null && details.credit_limit !== undefined
      ? String(details.credit_limit)
      : '',
  address: details.address || '',
  city: details.city || '',
  state: details.state || '',
  country: details.country || '',
  pincode: details.pincode || '',
  custom_date_of_birth: details.custom_date_of_birth || '',
  custom_is_chronic_patient: Boolean(details.custom_is_chronic_patient),
  status: details.status || 'Active',
});

type Props = {
  visible: boolean;
  mode: 'create' | 'edit';
  customerId?: string;
  initialData?: CustomerDetails | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
};

export const CustomerFormModal = ({
  visible,
  mode,
  customerId,
  initialData,
  onClose,
  onSuccess,
}: Props) => {
  const theme = useAppTheme();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setErrors({});
    if (mode === 'edit' && initialData) {
      setForm(toFormState(initialData));
    } else {
      setForm(emptyForm);
    }
  }, [visible, mode, initialData]);

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const next: FormErrors = {};

    if (!form.customer_name.trim()) next.customer_name = 'Customer name is required';
    if (!form.customer_type) next.customer_type = 'Please select customer type';

    const phoneDigits = form.phone.replace(/\D/g, '');
    if (!phoneDigits) next.phone = 'Phone number is required';
    else if (phoneDigits.length !== 10) next.phone = 'Phone number must be exactly 10 digits';

    if (!form.email.trim()) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      next.email = 'Invalid email address';

    if (!form.address.trim()) next.address = 'Address is required';
    if (!form.city.trim()) next.city = 'City is required';
    if (!form.state) next.state = 'State is required';
    if (!form.country) next.country = 'Country is required';

    const pincodeDigits = form.pincode.replace(/\D/g, '');
    if (!pincodeDigits) next.pincode = 'Pincode is required';
    else if (pincodeDigits.length !== 6) next.pincode = 'Pincode must be 6 digits';

    if (!form.custom_date_of_birth.trim()) {
      next.custom_date_of_birth = 'Date of Birth is required';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.custom_date_of_birth.trim())) {
      next.custom_date_of_birth = 'Use YYYY-MM-DD format';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (submitting || !validate()) return;
    setSubmitting(true);

    try {
      const basePayload = {
        customer_name: form.customer_name.trim(),
        customer_type: form.customer_type,
        contact_person: form.contact_person.trim() || undefined,
        phone: form.phone.replace(/\D/g, ''),
        email: form.email.trim(),
        credit_limit: form.credit_limit.trim() ? Number(form.credit_limit) : undefined,
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state,
        country: form.country,
        pincode: form.pincode.replace(/\D/g, ''),
        custom_date_of_birth: form.custom_date_of_birth.trim(),
        custom_is_chronic_patient: form.custom_is_chronic_patient,
      };

      const message =
        mode === 'edit' && customerId
          ? await customerService.updateCustomer({
              ...basePayload,
              customer_id: customerId,
              status: form.status as 'Active' | 'Inactive',
            })
          : await customerService.createCustomer(basePayload);

      onSuccess(message);
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
    },
  ) => (
    <View style={styles.formGroup}>
      <Text style={[styles.label, { color: theme.colors.text }]}>
        {label} {options?.required !== false ? <Text style={styles.required}>*</Text> : null}
      </Text>
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
        value={String(form[field] ?? '')}
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

  const renderDropdown = (
    label: string,
    field: keyof FormState,
    options: DropdownOption[],
    placeholder: string,
  ) => (
    <View style={styles.formGroup}>
      <SearchableDropdown
        label={`${label} *`}
        value={form[field] as string}
        placeholder={placeholder}
        options={options}
        loading={false}
        error={errors[field]}
        onSelect={opt => setField(field, opt.value as FormState[typeof field])}
        onClearError={() => setErrors(prev => ({ ...prev, [field]: undefined }))}
        borderColor={errors[field] ? theme.colors.danger : theme.colors.border}
        backgroundColor={theme.colors.background}
        textColor={theme.colors.text}
      />
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <View style={[styles.sheet, { backgroundColor: theme.colors.card }]}>
            <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                {mode === 'edit' ? 'Edit Customer' : 'Add New Customer'}
              </Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <X size={22} color={theme.colors.text} strokeWidth={2.5} />
              </Pressable>
            </View>

            <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
              {renderField('Customer Name', 'customer_name', 'Enter customer/company name')}
              {renderDropdown('Customer Type', 'customer_type', CUSTOMER_TYPE_OPTIONS, 'Select type')}
              {renderField('Date of Birth', 'custom_date_of_birth', 'YYYY-MM-DD', { maxLength: 10 })}

              <View style={styles.switchRow}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Is Chronic Patient?</Text>
                <Switch
                  value={form.custom_is_chronic_patient}
                  onValueChange={value => setField('custom_is_chronic_patient', value)}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {renderField('Contact Person', 'contact_person', 'Enter contact person name', {
                required: false,
              })}
              {renderField('Phone Number', 'phone', '9876543210', {
                keyboardType: 'phone-pad',
                maxLength: 10,
              })}
              {renderField('Email Address', 'email', 'customer@example.com', {
                keyboardType: 'email-address',
                autoCapitalize: 'none',
              })}
              {renderField('Credit Limit (Rs)', 'credit_limit', 'Enter credit limit', {
                keyboardType: 'numeric',
                required: false,
              })}
              {renderField('Address', 'address', 'Enter complete address', {
                multiline: true,
                numberOfLines: 3,
              })}
              {renderField('City', 'city', 'Enter city')}
              {renderDropdown('State', 'state', STATE_OPTIONS, 'Select state')}
              {renderDropdown('Country', 'country', COUNTRY_OPTIONS, 'Select country')}
              {renderField('Pincode', 'pincode', 'Enter pincode', {
                keyboardType: 'number-pad',
                maxLength: 6,
              })}
              {mode === 'edit'
                ? renderDropdown('Status', 'status', STATUS_OPTIONS, 'Select status')
                : null}
            </ScrollView>

            <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
              <Pressable
                style={[styles.cancelButton, { borderColor: theme.colors.border }]}
                onPress={onClose}
                disabled={submitting}
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
                disabled={submitting}
              >
                <Text style={styles.submitButtonText}>
                  {submitting
                    ? 'Saving...'
                    : mode === 'edit'
                    ? 'Update Customer'
                    : 'Add Customer'}
                </Text>
              </Pressable>
            </View>
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
    maxHeight: '90%',
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
    maxHeight: '82%',
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
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
    minHeight: 72,
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
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

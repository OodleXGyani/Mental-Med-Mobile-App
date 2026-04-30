import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

interface Customer {
  id: string;
  name: string;
  phone: string;
  amount: string;
  orders?: number;
}

const initialCustomers: Customer[] = [
  {
    id: '1',
    name: 'Ramesh Kumar',
    phone: '9876543210',
    amount: 'Rs 4580',
    orders: 12,
  },
  {
    id: '2',
    name: 'Priya Sharma',
    phone: '9876543211',
    amount: 'Rs 2340',
    orders: 8,
  },
  {
    id: '3',
    name: 'Suresh Patel',
    phone: '9876543212',
    amount: 'Rs 1250',
    orders: 5,
  },
  {
    id: '4',
    name: 'Anita Gupta',
    phone: '9876543213',
    amount: 'Rs 890',
    orders: 3,
  },
];

export const CustomersScreen = () => {
  const insets = useSafeAreaInsets();
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [searchText, setSearchText] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [errors, setErrors] = useState({ name: '', phone: '' });

  const filteredCustomers = useMemo(() => {
    return customers.filter(
      customer =>
        customer.name.toLowerCase().includes(searchText.toLowerCase()) ||
        customer.phone.includes(searchText),
    );
  }, [customers, searchText]);

  const validateForm = () => {
    const newErrors = { name: '', phone: '' };
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
      isValid = false;
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone must be 10 digits';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleAddCustomer = () => {
    if (validateForm()) {
      const newCustomer: Customer = {
        id: String(customers.length + 1),
        name: formData.name,
        phone: formData.phone,
        amount: 'Rs 0',
        orders: 0,
      };
      setCustomers([...customers, newCustomer]);
      setFormData({ name: '', phone: '', email: '' });
      setShowAddModal(false);
      setErrors({ name: '', phone: '' });
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setFormData({ name: '', phone: '', email: '' });
    setErrors({ name: '', phone: '' });
  };

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
          <Text style={styles.title}>Customers</Text>
          <Pressable
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </Pressable>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or phone..."
            placeholderTextColor="#B59D90"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {filteredCustomers.length > 0 ? (
          filteredCustomers.map(customer => (
            <View style={styles.customerRow} key={customer.id}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {customer.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{customer.name}</Text>
                <Text style={styles.customerMeta}>
                  {customer.phone} • {customer.orders || 0} orders
                </Text>
              </View>
              <Text style={styles.amountText}>{customer.amount}</Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No customers found</Text>
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
              >
                <View style={styles.formGroup}>
                  <Text style={styles.label}>
                    Name <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={[styles.input, errors.name && styles.inputError]}
                    placeholder="Enter customer name"
                    placeholderTextColor="#B59D90"
                    value={formData.name}
                    onChangeText={text => {
                      setFormData({ ...formData, name: text });
                      if (errors.name) setErrors({ ...errors, name: '' });
                    }}
                  />
                  {errors.name ? (
                    <Text style={styles.errorText}>{errors.name}</Text>
                  ) : null}
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>
                    Phone <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={[styles.input, errors.phone && styles.inputError]}
                    placeholder="Enter 10-digit phone number"
                    placeholderTextColor="#B59D90"
                    value={formData.phone}
                    onChangeText={text => {
                      setFormData({ ...formData, phone: text });
                      if (errors.phone) setErrors({ ...errors, phone: '' });
                    }}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                  {errors.phone ? (
                    <Text style={styles.errorText}>{errors.phone}</Text>
                  ) : null}
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Email (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter email address"
                    placeholderTextColor="#B59D90"
                    value={formData.email}
                    onChangeText={text =>
                      setFormData({ ...formData, email: text })
                    }
                    keyboardType="email-address"
                  />
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <Pressable
                  style={styles.addCustomerButton}
                  onPress={handleAddCustomer}
                >
                  <Text style={styles.addCustomerButtonText}>Add Customer</Text>
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
    padding: 16,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#2A2A2A',
  },
  addButton: {
    backgroundColor: '#1CA39A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E3DE',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#2A2A2A',
    fontSize: 14,
  },
  customerRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E3DE',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    marginLeft: 12,
  },
  customerName: {
    color: '#312F2E',
    fontSize: 15,
    fontWeight: '700',
  },
  customerMeta: {
    color: '#A98F81',
    fontSize: 12,
    marginTop: 3,
  },
  amountText: {
    color: '#1CA39A',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#A68F82',
    fontSize: 14,
    fontWeight: '500',
  },
  // Modal Styles
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
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
    fontWeight: '700',
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
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
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
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#2A2A2A',
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
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addCustomerButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});

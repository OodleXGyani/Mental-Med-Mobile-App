import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { User, X } from 'lucide-react-native';
import { Customer } from '../types';

type Props = {
  visible: boolean;
  searchValue: string;
  onSearchChange: (value: string) => void;
  customers: Customer[];
  onSelectCustomer: (customer: Customer) => void;
  onClose: () => void;
};

export const POSCustomerPickerModal = ({
  visible,
  searchValue,
  onSearchChange,
  customers,
  onSelectCustomer,
  onClose,
}: Props) => {
  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={styles.modalBackdropBottom}>
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Select Customer</Text>
            <Pressable onPress={onClose}>
              <X size={16} color="#6E635C" />
            </Pressable>
          </View>

          <TextInput
            style={styles.customerSearchInput}
            placeholder="Search by name or phone..."
            placeholderTextColor="#AA9A8F"
            value={searchValue}
            onChangeText={onSearchChange}
          />

          <ScrollView style={styles.customerList}>
            {customers.map(customer => (
              <Pressable key={customer.id} style={styles.customerListItem} onPress={() => onSelectCustomer(customer)}>
                <View style={styles.customerListLeft}>
                  <View style={styles.customerAvatar}>
                    <User size={12} color="#3BAE9D" />
                  </View>
                  <View>
                    <Text style={styles.customerListName}>{customer.name}</Text>
                    <Text style={styles.customerListPhone}>{customer.phone}</Text>
                  </View>
                </View>
                <View style={styles.selectDot} />
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
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
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    padding: 14,
    maxHeight: '74%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sheetTitle: {
    color: '#403631',
    fontWeight: '800',
    fontSize: 20,
  },
  customerSearchInput: {
    borderWidth: 1,
    borderColor: '#2CA798',
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 9,
    color: '#5B4E47',
    marginBottom: 10,
    fontSize: 12,
  },
  customerList: {
    maxHeight: 280,
  },
  customerListItem: {
    borderWidth: 1,
    borderColor: '#E5DFDA',
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 7,
  },
  customerListLeft: {
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
  },
  customerAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ECF8F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerListName: {
    color: '#4A3E37',
    fontSize: 12,
    fontWeight: '700',
  },
  customerListPhone: {
    color: '#AA9A8F',
    fontSize: 9.5,
    marginTop: 1,
  },
  selectDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D8B5A0',
  },
});

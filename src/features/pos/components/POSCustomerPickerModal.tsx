import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { User, X, History } from 'lucide-react-native';
import { Customer } from '../types';
import { useAppTheme } from '../../../shared/theme';

type Props = {
  visible: boolean;
  searchValue: string;
  onSearchChange: (value: string) => void;
  customers: Customer[];
  onSelectCustomer: (customer: Customer) => void;
  onViewPastOrders?: (customer: Customer) => void;
  onClose: () => void;
};

export const POSCustomerPickerModal = ({
  visible,
  searchValue,
  onSearchChange,
  customers,
  onSelectCustomer,
  onViewPastOrders,
  onClose,
}: Props) => {
  const theme = useAppTheme();

  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={styles.modalBackdropBottom}>
        <View
          style={[styles.bottomSheet, { backgroundColor: theme.colors.card }]}
        >
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>
              Select Customer
            </Text>
            <Pressable onPress={onClose}>
              <X size={16} color={theme.colors.mutedText} />
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
            placeholder="Search by name or phone..."
            placeholderTextColor={theme.colors.mutedText}
            value={searchValue}
            onChangeText={onSearchChange}
          />

          <ScrollView style={styles.customerList}>
            {customers.map((customer, index) => (
              <View
                key={`${customer.id || 'customer'}-${index}`}
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
                        { backgroundColor: theme.dark ? '#163330' : '#ECF8F6' },
                      ]}
                    >
                      <User size={12} color={theme.colors.primary} />
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
                        {customer.phone}
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
  customerListContent: {
    flex: 1,
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
  pastOrdersButton: {
    padding: 8,
    borderRadius: 6,
  },
});

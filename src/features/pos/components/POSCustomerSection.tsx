import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { User, X } from 'lucide-react-native';
import { Customer } from '../types';
import { useAppTheme } from '../../../shared/theme';

type Props = {
  selectedCustomer: Customer | null;
  onPressAddCustomer: () => void;
  onPressViewOrders: () => void;
  onPressRemoveCustomer: () => void;
};

export const POSCustomerSection = ({
  selectedCustomer,
  onPressAddCustomer,
  onPressViewOrders,
  onPressRemoveCustomer,
}: Props) => {
  const theme = useAppTheme();

  return (
    <>
      <Pressable
        style={[
          styles.customerRow,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
        onPress={onPressAddCustomer}
      >
        <User size={13} color={theme.colors.mutedText} />
        <Text style={[styles.customerText, { color: theme.colors.mutedText }]}>
          Add Customer
        </Text>
      </Pressable>

      {selectedCustomer ? (
        <View
          style={[
            styles.selectedCustomerCard,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.selectedCustomerLeft}>
            <User size={13} color={theme.colors.primary} />
            <View>
              <Text
                style={[
                  styles.selectedCustomerName,
                  { color: theme.colors.text },
                ]}
              >
                {selectedCustomer.name}
              </Text>
              <Text
                style={[
                  styles.selectedCustomerPhone,
                  { color: theme.colors.mutedText },
                ]}
              >
                {selectedCustomer.phone}
              </Text>
            </View>
          </View>
          <View style={styles.selectedCustomerActions}>
            <Pressable onPress={onPressViewOrders}>
              <Text
                style={[styles.viewOrdersText, { color: theme.colors.success }]}
              >
                View Orders
              </Text>
            </Pressable>
            <Pressable onPress={onPressRemoveCustomer}>
              <X size={14} color={theme.colors.mutedText} />
            </Pressable>
          </View>
        </View>
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  customerRow: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E3DE',
    borderWidth: 1,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 11,
  },
  customerText: {
    color: '#7A6860',
    fontWeight: '600',
    fontSize: 12,
  },
  selectedCustomerCard: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E1DD',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedCustomerLeft: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  selectedCustomerName: {
    color: '#4A3E37',
    fontSize: 12,
    fontWeight: '700',
  },
  selectedCustomerPhone: {
    color: '#A79286',
    fontSize: 9,
    marginTop: 1,
  },
  selectedCustomerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewOrdersText: {
    color: '#2BAF81',
    fontSize: 11,
    fontWeight: '700',
  },
});

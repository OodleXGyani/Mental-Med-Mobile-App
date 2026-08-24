import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Star, User, X } from 'lucide-react-native';
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

  if (!selectedCustomer) {
    return null;
  }

  return (
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
        <View
          style={[
            styles.userIconWrap,
            { backgroundColor: `${theme.colors.primary}18` },
          ]}
        >
          <User size={16} color={theme.colors.primary} />
        </View>
        <View style={styles.customerInfo}>
          <View style={styles.customerNameRow}>
            <Text
              style={[styles.selectedCustomerName, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {selectedCustomer.name}
            </Text>
            {selectedCustomer.loyalty_points !== undefined &&
            selectedCustomer.loyalty_points > 0 ? (
              <View style={styles.loyaltyPill}>
                <Star size={10} color="#D97706" fill="#D97706" />
                <Text style={styles.loyaltyText}>
                  {selectedCustomer.loyalty_points} pts (₹
                  {(selectedCustomer.loyalty_redemption_value || 0).toFixed(2)})
                </Text>
              </View>
            ) : null}
          </View>
          <Text
            style={[
              styles.selectedCustomerPhone,
              { color: theme.colors.mutedText },
            ]}
          >
            {selectedCustomer.phone && selectedCustomer.phone !== 'N/A'
              ? `Phone: ${selectedCustomer.phone}`
              : 'Counter Walk-in Sale'}
          </Text>
        </View>
      </View>

      <View style={styles.selectedCustomerActions}>
        <Pressable
          onPress={onPressAddCustomer}
          style={[styles.actionBtn, { borderColor: theme.colors.border }]}
        >
          <Text style={[styles.actionBtnText, { color: theme.colors.text }]}>
            Change
          </Text>
        </Pressable>
        {selectedCustomer.id !== 'Walk-in' && (
          <Pressable
            onPress={onPressViewOrders}
            style={[
              styles.actionBtn,
              {
                borderColor: theme.colors.primary,
                backgroundColor: `${theme.colors.primary}12`,
              },
            ]}
          >
            <Text
              style={[styles.actionBtnText, { color: theme.colors.primary }]}
            >
              History
            </Text>
          </Pressable>
        )}
        <Pressable onPress={onPressRemoveCustomer} hitSlop={8}>
          <X size={16} color={theme.colors.mutedText} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  selectedCustomerCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedCustomerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  userIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerInfo: {
    flex: 1,
  },
  customerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  selectedCustomerName: {
    fontSize: 14,
    fontWeight: '700',
  },
  selectedCustomerPhone: {
    fontSize: 11,
    marginTop: 2,
  },
  loyaltyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  loyaltyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  selectedCustomerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

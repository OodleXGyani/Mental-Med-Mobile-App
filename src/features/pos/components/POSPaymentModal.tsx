import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { X } from 'lucide-react-native';
import { Customer, PaymentMethod } from '../types';
import { formatAmount } from '../utils';
import { useAppTheme } from '../../../shared/theme';

type Props = {
  visible: boolean;
  total: number;
  selectedCustomer: Customer | null;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  subtotal: number;
  gstAmount: number;
  onClose: () => void;
  onCompleteSale: () => void;
};

export const POSPaymentModal = ({
  visible,
  total,
  selectedCustomer,
  paymentMethod,
  setPaymentMethod,
  subtotal,
  gstAmount,
  onClose,
  onCompleteSale,
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
              {`Payment - ${formatAmount(total)}`}
            </Text>
            <Pressable onPress={onClose}>
              <X size={16} color={theme.colors.mutedText} />
            </Pressable>
          </View>
          <Text style={[styles.fieldLabel, { color: theme.colors.mutedText }]}>
            Customer
          </Text>
          <View style={styles.paymentCustomerRow}>
            <TextInput
              style={[
                styles.paymentInput,
                {
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                  backgroundColor: theme.colors.background,
                },
              ]}
              placeholder="Name"
              value={selectedCustomer?.name || ''}
              placeholderTextColor={theme.colors.mutedText}
              editable={false}
            />
            <TextInput
              style={[
                styles.paymentInput,
                {
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                  backgroundColor: theme.colors.background,
                },
              ]}
              placeholder="Phone"
              value={selectedCustomer?.phone || ''}
              placeholderTextColor={theme.colors.mutedText}
              editable={false}
            />
          </View>

          <Text style={[styles.fieldLabel, { color: theme.colors.mutedText }]}>
            Payment Method
          </Text>
          <View style={styles.methodRow}>
            {(['Cash', 'UPI', 'Card'] as const).map(method => (
              <Pressable
                key={method}
                style={[
                  styles.methodPill,
                  { borderColor: theme.colors.border },
                  paymentMethod === method && {
                    backgroundColor: theme.colors.primary,
                    borderColor: theme.colors.primary,
                  },
                ]}
                onPress={() => setPaymentMethod(method)}
              >
                <Text
                  style={[
                    styles.methodText,
                    { color: theme.colors.mutedText },
                    paymentMethod === method && styles.methodTextActive,
                  ]}
                >
                  {method}
                </Text>
              </Pressable>
            ))}
          </View>

          <View
            style={[styles.breakdownBox, { borderColor: theme.colors.border }]}
          >
            <View style={styles.summaryRow}>
              <Text
                style={[styles.summaryLabel, { color: theme.colors.mutedText }]}
              >
                Subtotal
              </Text>
              <Text
                style={[
                  styles.summaryValueNeutral,
                  { color: theme.colors.text },
                ]}
              >
                {formatAmount(subtotal)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text
                style={[styles.summaryLabel, { color: theme.colors.mutedText }]}
              >
                GST
              </Text>
              <Text
                style={[
                  styles.summaryValueNeutral,
                  { color: theme.colors.text },
                ]}
              >
                {formatAmount(gstAmount)}
              </Text>
            </View>
            <View
              style={[
                styles.summaryRow,
                styles.totalRow,
                { borderTopColor: theme.colors.border },
              ]}
            >
              <Text style={[styles.totalLabel, { color: theme.colors.text }]}>
                Total
              </Text>
              <Text
                style={[styles.totalValue, { color: theme.colors.primary }]}
              >
                {formatAmount(total)}
              </Text>
            </View>
          </View>

          <Pressable
            style={[
              styles.completeBtn,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={onCompleteSale}
          >
            <Text style={styles.completeBtnText}>Complete Sale</Text>
          </Pressable>
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
  fieldLabel: {
    color: '#5B4E47',
    fontWeight: '700',
    fontSize: 12,
    marginBottom: 6,
  },
  paymentCustomerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  paymentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E3DDD7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    color: '#4A3E37',
    fontSize: 12,
  },
  methodRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  methodPill: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0DAD4',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 8,
  },
  methodPillActive: {
    backgroundColor: '#2CA798',
    borderColor: '#2CA798',
  },
  methodText: {
    color: '#6D5F57',
    fontWeight: '700',
    fontSize: 12,
  },
  methodTextActive: {
    color: '#FFFFFF',
  },
  breakdownBox: {
    borderWidth: 1,
    borderColor: '#ECE6E1',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    color: '#8E7A6F',
    fontWeight: '600',
    fontSize: 12,
  },
  summaryValueNeutral: {
    color: '#5B4E47',
    fontWeight: '700',
    fontSize: 12,
  },
  totalRow: {
    borderTopColor: '#ECE7E2',
    borderTopWidth: 1,
    paddingTop: 6,
    marginTop: 2,
  },
  totalLabel: {
    color: '#3F3430',
    fontWeight: '800',
    fontSize: 16,
  },
  totalValue: {
    color: '#1CA39A',
    fontWeight: '800',
    fontSize: 18,
  },
  completeBtn: {
    backgroundColor: '#2CA798',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
  },
  completeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});

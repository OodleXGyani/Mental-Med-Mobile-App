import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { formatAmount } from '../utils';
import { useAppTheme } from '../../../shared/theme';

type Props = {
  subtotal: number;
  gstAmount: number;
  discountPercent: string;
  onDiscountChange: (value: string) => void;
  total: number;
  canProceed: boolean;
  onPressProceed: () => void;
};

export const POSSummaryCard = ({
  subtotal,
  gstAmount,
  discountPercent,
  onDiscountChange,
  total,
  canProceed,
  onPressProceed,
}: Props) => {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.summaryCard,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.summaryRow}>
        <Text style={[styles.summaryLabel, { color: theme.colors.mutedText }]}>
          Subtotal
        </Text>
        <Text
          style={[styles.summaryValueNeutral, { color: theme.colors.text }]}
        >
          {formatAmount(subtotal)}
        </Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={[styles.summaryLabel, { color: theme.colors.mutedText }]}>
          GST
        </Text>
        <Text
          style={[styles.summaryValueNeutral, { color: theme.colors.text }]}
        >
          {formatAmount(gstAmount)}
        </Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={[styles.summaryLabel, { color: theme.colors.mutedText }]}>
          Bill Discount
        </Text>
        <View style={styles.discountInputWrap}>
          <TextInput
            value={discountPercent}
            onChangeText={onDiscountChange}
            keyboardType="number-pad"
            style={[
              styles.discountInput,
              {
                borderColor: theme.colors.border,
                color: theme.colors.text,
                backgroundColor: theme.colors.background,
              },
            ]}
          />
          <Text
            style={[styles.discountSuffix, { color: theme.colors.mutedText }]}
          >
            %
          </Text>
        </View>
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
        <Text style={[styles.totalValue, { color: theme.colors.primary }]}>
          {formatAmount(total)}
        </Text>
      </View>
      <Pressable
        style={[
          styles.proceedBtn,
          { backgroundColor: theme.colors.primary },
          !canProceed && styles.proceedBtnDisabled,
        ]}
        onPress={onPressProceed}
        disabled={!canProceed}
      >
        <Text style={styles.proceedText}>Proceed to Payment</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  summaryCard: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E8E3DE',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 12,
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
  discountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  discountInput: {
    width: 46,
    height: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DED8D2',
    textAlign: 'center',
    color: '#61554D',
    fontWeight: '600',
    fontSize: 12,
    paddingVertical: 2,
  },
  discountSuffix: {
    color: '#8E7A6F',
    fontSize: 12,
    fontWeight: '600',
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
  proceedBtn: {
    marginTop: 6,
    borderRadius: 8,
    backgroundColor: '#2BA497',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  proceedBtnDisabled: {
    backgroundColor: '#AFC9C4',
  },
  proceedText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});

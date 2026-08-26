import React from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Star, Tag, Percent } from 'lucide-react-native';
import { formatAmount } from '../utils';
import { useAppTheme } from '../../../shared/theme';

type Props = {
  subtotal: number;
  gstAmount: number;
  discountType: 'Percentage' | 'Amount';
  onDiscountTypeChange: (type: 'Percentage' | 'Amount') => void;
  discountValue: string;
  onDiscountValueChange: (value: string) => void;
  total: number;
  loyaltyPoints?: number;
  loyaltyRedemptionValue?: number;
  redeemLoyalty?: boolean;
  onToggleRedeemLoyalty?: (value: boolean) => void;
  canProceed: boolean;
  onPressProceed: () => void;
};

export const POSSummaryCard = ({
  subtotal,
  gstAmount,
  discountType,
  onDiscountTypeChange,
  discountValue,
  onDiscountValueChange,
  total,
  loyaltyPoints = 0,
  loyaltyRedemptionValue = 0,
  redeemLoyalty = false,
  onToggleRedeemLoyalty,
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
          GST Tax
        </Text>
        <Text
          style={[styles.summaryValueNeutral, { color: theme.colors.text }]}
        >
          {formatAmount(gstAmount)}
        </Text>
      </View>

      {/* Bill Discount Section (Matching Web POS: Discount Type + Discount Value) */}
      <View style={[styles.discountContainer, { borderColor: theme.colors.border }]}>
        <View style={styles.discountHeaderRow}>
          <Text style={[styles.summaryLabel, { color: theme.colors.mutedText }]}>
            Bill Discount
          </Text>
          {/* Segmented Type Toggle */}
          <View
            style={[
              styles.discountTypeTabs,
              theme.dark ? styles.discountTypeTabsDark : styles.discountTypeTabsLight,
            ]}
          >
            <Pressable
              style={[
                styles.typeTab,
                discountType === 'Percentage' && [
                  styles.typeTabActive,
                  { backgroundColor: theme.colors.card },
                ],
              ]}
              onPress={() => onDiscountTypeChange('Percentage')}
            >
              <Percent
                size={11}
                color={
                  discountType === 'Percentage'
                    ? theme.colors.primary
                    : theme.colors.mutedText
                }
              />
              <Text
                style={[
                  styles.typeTabText,
                  {
                    color:
                      discountType === 'Percentage'
                        ? theme.colors.primary
                        : theme.colors.mutedText,
                  },
                  discountType === 'Percentage' ? styles.textBold700 : styles.textWeight500,
                ]}
              >
                Percent (%)
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.typeTab,
                discountType === 'Amount' && [
                  styles.typeTabActive,
                  { backgroundColor: theme.colors.card },
                ],
              ]}
              onPress={() => onDiscountTypeChange('Amount')}
            >
              <Tag
                size={11}
                color={
                  discountType === 'Amount'
                    ? theme.colors.primary
                    : theme.colors.mutedText
                }
              />
              <Text
                style={[
                  styles.typeTabText,
                  {
                    color:
                      discountType === 'Amount'
                        ? theme.colors.primary
                        : theme.colors.mutedText,
                  },
                  discountType === 'Amount' ? styles.textBold700 : styles.textWeight500,
                ]}
              >
                Amount (₹)
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.discountInputRow}>
          <Text style={[styles.discountInputPrefix, { color: theme.colors.mutedText }]}>
            {discountType === 'Percentage' ? 'Discount %' : 'Discount ₹'}
          </Text>
          <View style={styles.discountInputWrap}>
            <TextInput
              value={discountValue}
              onChangeText={onDiscountValueChange}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={theme.colors.mutedText}
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
              {discountType === 'Percentage' ? '%' : '₹'}
            </Text>
          </View>
        </View>
      </View>

      {/* Loyalty Points Redemption Toggle */}
      {loyaltyPoints > 0 && loyaltyRedemptionValue > 0 ? (
        <View style={[styles.loyaltyRow, { borderColor: theme.colors.border }]}>
          <View style={styles.loyaltyLeft}>
            <Star size={14} color="#F59E0B" fill="#F59E0B" />
            <View>
              <Text style={[styles.loyaltyTitle, { color: theme.colors.text }]}>
                Redeem {loyaltyPoints} Points
              </Text>
              <Text style={[styles.loyaltySub, { color: theme.colors.mutedText }]}>
                Save {formatAmount(loyaltyRedemptionValue)}
              </Text>
            </View>
          </View>
          <Switch
            value={redeemLoyalty}
            onValueChange={onToggleRedeemLoyalty}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      ) : null}

      <View
        style={[
          styles.summaryRow,
          styles.totalRow,
          { borderTopColor: theme.colors.border },
        ]}
      >
        <Text style={[styles.totalLabel, { color: theme.colors.text }]}>
          Grand Total
        </Text>
        <Text style={[styles.totalValue, { color: theme.colors.primary }]}>
          {formatAmount(total)}
        </Text>
      </View>

      <Pressable
        style={[
          styles.proceedButton,
          { backgroundColor: theme.colors.primary },
          !canProceed && styles.proceedButtonDisabled,
        ]}
        onPress={onPressProceed}
        disabled={!canProceed}
      >
        <Text style={styles.proceedButtonText}>
          Proceed to Payment ({formatAmount(total)})
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  summaryCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  summaryValueNeutral: {
    fontSize: 13,
    fontWeight: '700',
  },
  discountContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginVertical: 6,
    gap: 8,
  },
  discountHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  discountTypeTabs: {
    flexDirection: 'row',
    padding: 2,
    borderRadius: 8,
    gap: 2,
  },
  typeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeTabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typeTabText: {
    fontSize: 11,
  },
  discountInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  discountInputPrefix: {
    fontSize: 12,
  },
  discountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  discountInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    width: 80,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '700',
  },
  discountSuffix: {
    fontSize: 13,
    fontWeight: '700',
  },
  loyaltyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginVertical: 4,
  },
  loyaltyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loyaltyTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  loyaltySub: {
    fontSize: 11,
    marginTop: 1,
  },
  totalRow: {
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 4,
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  totalValue: {
    fontSize: 17,
    fontWeight: '800',
  },
  proceedButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proceedButtonDisabled: {
    opacity: 0.6,
  },
  proceedButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  discountTypeTabsDark: {
    backgroundColor: '#1E293B',
  },
  discountTypeTabsLight: {
    backgroundColor: '#F1F5F9',
  },
  textWeight500: {
    fontWeight: '500',
  },
  textBold700: {
    fontWeight: '700',
  },
});

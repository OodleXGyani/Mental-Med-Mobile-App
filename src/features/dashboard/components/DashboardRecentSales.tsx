import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { DashboardRecentSale } from '../services/dashboardService';
import { useAppTheme } from '../../../shared/theme';

const formatAmount = (amount: number) =>
  `₹${new Intl.NumberFormat('en-IN').format(amount)}`;
const formatDate = (dateValue: string) => {
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
};

type Props = {
  sales: DashboardRecentSale[];
  onPressViewAll: () => void;
  onPressSale: (sale: DashboardRecentSale) => void;
};

export const DashboardRecentSales = ({
  sales,
  onPressViewAll,
  onPressSale,
}: Props) => {
  const theme = useAppTheme();

  return (
    <>
      <View style={styles.recentHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Recent Sales
        </Text>
        <Pressable onPress={onPressViewAll}>
          <Text style={[styles.viewAll, { color: theme.colors.primary }]}>
            View All ›
          </Text>
        </Pressable>
      </View>
      {sales.map(sale => (
        <Pressable
          key={sale.invoice_id}
          style={[
            styles.saleCard,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
          onPress={() => onPressSale(sale)}
        >
          <View>
            <Text style={[styles.saleName, { color: theme.colors.text }]}>
              {sale.invoice_id}
            </Text>
            <Text
              style={[styles.saleMeta, { color: theme.colors.mutedText }]}
              numberOfLines={1}
            >{`${sale.items[0] ?? sale.company} · ${formatDate(
              sale.posting_date,
            )}`}</Text>
          </View>
          <Text style={[styles.saleAmount, { color: theme.colors.success }]}>
            {formatAmount(sale.amount)}
          </Text>
        </Pressable>
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  viewAll: {
    fontSize: 12,
    fontWeight: '600',
  },
  saleCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  saleName: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  saleMeta: {
    fontSize: 10,
  },
  saleAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
});

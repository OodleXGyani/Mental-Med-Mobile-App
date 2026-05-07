import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { DashboardRecentSale } from '../services/dashboardService';

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
  return (
    <>
      <View style={styles.recentHeader}>
        <Text style={styles.sectionTitle}>Recent Sales</Text>
        <Pressable onPress={onPressViewAll}>
          <Text style={styles.viewAll}>View All ›</Text>
        </Pressable>
      </View>
      {sales.map(sale => (
        <Pressable
          key={sale.invoice_id}
          style={styles.saleCard}
          onPress={() => onPressSale(sale)}
        >
          <View>
            <Text style={styles.saleName}>{sale.invoice_id}</Text>
            <Text style={styles.saleMeta} numberOfLines={1}>{`${
              sale.items[0] ?? sale.company
            } · ${formatDate(sale.posting_date)}`}</Text>
          </View>
          <Text style={styles.saleAmount}>{formatAmount(sale.amount)}</Text>
        </Pressable>
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    color: '#2D3035',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 10,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  viewAll: {
    color: '#3AA7A0',
    fontSize: 11,
    fontWeight: '700',
  },
  saleCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EAEAEA',
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  saleName: {
    color: '#34373D',
    fontSize: 11.5,
    fontWeight: '700',
  },
  saleMeta: {
    color: '#A69E98',
    fontSize: 9.5,
    marginTop: 2,
  },
  saleAmount: {
    color: '#2BAF81',
    fontSize: 12,
    fontWeight: '700',
  },
});

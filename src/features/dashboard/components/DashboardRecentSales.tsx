import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Sale = {
  id: string;
  name: string;
  invoice: string;
  time: string;
  amount: string;
};

type Props = {
  sales: Sale[];
  onPressViewAll: () => void;
  onPressSale: () => void;
};

export const DashboardRecentSales = ({ sales, onPressViewAll, onPressSale }: Props) => {
  return (
    <>
      <View style={styles.recentHeader}>
        <Text style={styles.sectionTitle}>Recent Sales</Text>
        <Pressable onPress={onPressViewAll}>
          <Text style={styles.viewAll}>View All ›</Text>
        </Pressable>
      </View>
      {sales.map(sale => (
        <Pressable key={sale.id} style={styles.saleCard} onPress={onPressSale}>
          <View>
            <Text style={styles.saleName}>{sale.name}</Text>
            <Text style={styles.saleMeta}>{`${sale.invoice} · ${sale.time}`}</Text>
          </View>
          <Text style={styles.saleAmount}>{sale.amount}</Text>
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

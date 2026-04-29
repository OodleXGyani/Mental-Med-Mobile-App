import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, Search } from 'lucide-react-native';

export const OrdersScreen = () => {
  const insets = useSafeAreaInsets();

  const orders = [
    {
      id: 'INV-2025-001',
      status: 'completed',
      customer: 'Ramesh Kumar',
      details: '2 items · 10/4/2026',
      amount: 'Rs 123.20',
      tone: 'success' as const,
    },
    {
      id: 'INV-2025-002',
      status: 'completed',
      customer: 'Priya Sharma',
      details: '1 items · 10/4/2026',
      amount: 'Rs 180.40',
      tone: 'success' as const,
    },
    {
      id: 'INV-2025-003',
      status: 'completed',
      customer: 'Walk-in',
      details: '2 items · 9/4/2026',
      amount: 'Rs 159.60',
      tone: 'success' as const,
    },
    {
      id: 'INV-2025-004',
      status: 'returned',
      customer: 'Suresh Patel',
      details: '1 items · 9/4/2026',
      amount: 'Rs 135.00',
      tone: 'danger' as const,
    },
  ];

  const statusStyle = {
    success: styles.statusCompleted,
    danger: styles.statusReturned,
  };

  const statusTextStyle = {
    success: styles.statusCompletedText,
    danger: styles.statusReturnedText,
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: Math.max(insets.top, 10) + 8,
          paddingBottom: Math.max(insets.bottom, 14) + 18,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Order History</Text>

      <View style={styles.searchBox}>
        <Search size={14} color="#B49F93" strokeWidth={2.4} />
        <Text style={styles.searchText}>Search by invoice or customer...</Text>
      </View>

      {orders.map(order => (
        <View key={order.id} style={styles.orderCard}>
          <View style={styles.orderLeft}>
            <View style={styles.idRow}>
              <Text style={styles.orderId}>{order.id}</Text>
              <View style={[styles.statusPill, statusStyle[order.tone]]}>
                <Text style={[styles.statusPillText, statusTextStyle[order.tone]]}>{order.status}</Text>
              </View>
            </View>
            <Text style={styles.orderMeta}>{`${order.customer} · ${order.details}`}</Text>
          </View>
          <View style={styles.amountWrap}>
            <Text style={styles.amount}>{order.amount}</Text>
            <ChevronRight size={14} color="#B7A59A" strokeWidth={2.4} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  content: {
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#252628',
    marginBottom: 12,
  },
  searchBox: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E7E8E9',
    borderWidth: 1,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  searchText: {
    color: '#B29F94',
    fontSize: 12.5,
    fontWeight: '500',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 7,
  },
  orderLeft: {
    flex: 1,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderId: {
    color: '#332E2C',
    fontSize: 12.5,
    fontWeight: '800',
  },
  statusPill: {
    borderRadius: 9,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusCompleted: {
    backgroundColor: '#EEF1F2',
  },
  statusReturned: {
    backgroundColor: '#FFE9E8',
  },
  statusPillText: {
    fontSize: 8.5,
    fontWeight: '700',
    textTransform: 'lowercase',
  },
  statusCompletedText: {
    color: '#6D7C86',
  },
  statusReturnedText: {
    color: '#D53A33',
  },
  orderMeta: {
    color: '#A7958A',
    fontSize: 10,
    marginTop: 2,
  },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  amount: {
    color: '#3F342D',
    fontWeight: '700',
    fontSize: 12,
  },
});

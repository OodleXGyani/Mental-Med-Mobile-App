import React, { useState, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';

interface OrderItem {
  id: string;
  status: 'completed' | 'cancelled';
  customer: string;
  phone: string;
  items: number;
  time: string;
  amount: number;
}

const ordersData: OrderItem[] = [
  {
    id: 'INV-2025-001',
    status: 'completed',
    customer: 'Ramesh Kumar',
    phone: '9876543210',
    items: 3,
    time: '10/4/2026',
    amount: 123.2,
  },
  {
    id: 'INV-2025-002',
    status: 'completed',
    customer: 'Priya Sharma',
    phone: '9876543211',
    items: 1,
    time: '10/4/2026',
    amount: 180.4,
  },
  {
    id: 'INV-2025-003',
    status: 'completed',
    customer: 'Suresh Patel',
    phone: '9876543212',
    items: 2,
    time: '9/4/2026',
    amount: 159.6,
  },
  {
    id: 'INV-2025-004',
    status: 'cancelled',
    customer: 'Suresh Patel',
    phone: '9876543212',
    items: 1,
    time: '9/4/2026',
    amount: 135,
  },
];

export const OrderHistoryScreen = () => {
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState('');

  const filteredOrders = useMemo(() => {
    return ordersData.filter(
      order =>
        order.id.toLowerCase().includes(searchText.toLowerCase()) ||
        order.customer.toLowerCase().includes(searchText.toLowerCase()) ||
        order.phone.includes(searchText),
    );
  }, [searchText]);

  const getStatusColor = (status: string) => {
    return status === 'completed' ? '#1CA39A' : '#E03131';
  };

  const getStatusLabel = (status: string) => {
    return status === 'completed' ? 'Completed' : 'Cancelled';
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

      <View style={styles.searchContainer}>
        <Text style={styles.searchPlaceholder}>
          🔍 Search by invoice or customer...
        </Text>
      </View>

      {filteredOrders.length > 0 ? (
        filteredOrders.map(order => (
          <Pressable key={order.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <View style={styles.orderMeta}>
                <Text style={styles.orderId}>{order.id}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(order.status) },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {getStatusLabel(order.status)}
                  </Text>
                </View>
              </View>
              <Text style={styles.orderAmount}>₹{order.amount.toFixed(2)}</Text>
            </View>

            <View style={styles.orderDetails}>
              <Text style={styles.customerName}>{order.customer}</Text>
              <Text style={styles.customerPhone}>
                {order.phone} • {order.items} items
              </Text>
              <Text style={styles.orderTime}>{order.time}</Text>
            </View>

            <View style={styles.orderFooter}>
              <Pressable style={styles.viewButton}>
                <Text style={styles.viewButtonText}>View Details</Text>
                <ChevronRight size={16} color="#1CA39A" strokeWidth={2.5} />
              </Pressable>
            </View>
          </Pressable>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No orders found</Text>
        </View>
      )}
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
  searchContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E3DE',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  searchPlaceholder: {
    color: '#B59D90',
    fontSize: 14,
    fontWeight: '500',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E3DE',
    padding: 12,
    marginBottom: 10,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderId: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2A2A2A',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1CA39A',
  },
  orderDetails: {
    marginBottom: 10,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#312F2E',
    marginBottom: 2,
  },
  customerPhone: {
    fontSize: 12,
    fontWeight: '500',
    color: '#A98F81',
    marginBottom: 4,
  },
  orderTime: {
    fontSize: 11,
    fontWeight: '500',
    color: '#B59D90',
  },
  orderFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 10,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1CA39A',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#A68F82',
    fontSize: 14,
    fontWeight: '500',
  },
});

import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OrderCard, Order, OrderStatus } from '../components/OrderCard';
import { OrdersTabs, TabType } from '../components/OrdersTabs';
import { OrderDetailModal } from '../components/OrderDetailModal';
import { OrderSummaryModal } from '../components/OrderSummaryModal';

const sampleOrders: Order[] = [
  {
    id: 'ORD-2025-001',
    status: 'new',
    customer: 'Ramesh Kumar',
    phone: '9876543210',
    source: 'online',
    items: [
      { name: 'Paracetamol 500mg', qty: 3 },
      { name: 'Cetirizine 10mg', qty: 1 },
    ],
    time: '10 min ago',
    amount: 110,
  },
  {
    id: 'ORD-2025-002',
    status: 'accepted',
    customer: 'Priya Sharma',
    phone: '9870012345',
    source: 'online',
    items: [{ name: 'Vitamin C 500mg', qty: 1 }],
    time: '25 min ago',
    amount: 170,
  },
  {
    id: 'ORD-2025-003',
    status: 'ready',
    customer: 'Walk-in',
    phone: 'n/a',
    source: 'walk-in',
    items: [
      { name: 'Cough Syrup 100ml', qty: 1 },
      { name: 'Band Aid', qty: 1 },
    ],
    time: '1 hr ago',
    amount: 152,
  },
  {
    id: 'ORD-2025-004',
    status: 'dispatched',
    customer: 'Suresh Patel',
    phone: '9812345678',
    source: 'online',
    items: [{ name: 'Antacid', qty: 1 }],
    time: '2 hrs ago',
    amount: 125,
  },
];

export const OrdersScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<Order[]>(sampleOrders);
  const [activeTab, setActiveTab] = useState<TabType>('New');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showSummary, setShowSummary] = useState<Order | null>(null);

  const counts = useMemo(() => {
    const cNew = orders.filter(o => o.status === 'new').length;
    const cActive = orders.filter(
      o => o.status === 'accepted' || o.status === 'processing',
    ).length;
    const cReady = orders.filter(o => o.status === 'ready').length;
    const cDone = orders.filter(
      o => o.status === 'dispatched' || o.status === 'delivered',
    ).length;
    return { cNew, cActive, cReady, cDone };
  }, [orders]);

  const changeStatus = (id: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => (o.id === id ? { ...o, status } : o)));
  };

  const openOrder = (order: Order) => setSelectedOrder(order);
  const closeOrder = () => setSelectedOrder(null);

  const onAction = (order: Order) => {
    // determine next action based on status
    if (order.status === 'new') {
      changeStatus(order.id, 'accepted');
      closeOrder();
      setActiveTab('Active');
      return;
    }
    if (order.status === 'accepted') {
      // start processing
      changeStatus(order.id, 'processing');
      closeOrder();
      setActiveTab('Active');
      return;
    }
    if (order.status === 'processing') {
      changeStatus(order.id, 'ready');
      closeOrder();
      setActiveTab('Ready');
      return;
    }
    if (order.status === 'ready') {
      changeStatus(order.id, 'dispatched');
      closeOrder();
      setActiveTab('Done');
      return;
    }
    if (order.status === 'dispatched') {
      changeStatus(order.id, 'delivered');
      closeOrder();
      // after delivered show summary
      const delivered = orders.find(o => o.id === order.id) || order;
      setShowSummary({ ...delivered, status: 'delivered' });
      setActiveTab('Done');
      return;
    }
  };

  const onReject = (order: Order) => {
    // Remove the order from the list
    setOrders(prev => prev.filter(o => o.id !== order.id));
    closeOrder();
  };

  const sectionOrders = (tab: TabType) => {
    if (tab === 'New') return orders.filter(o => o.status === 'new');
    if (tab === 'Active')
      return orders.filter(
        o => o.status === 'accepted' || o.status === 'processing',
      );
    if (tab === 'Ready') return orders.filter(o => o.status === 'ready');
    return orders.filter(
      o => o.status === 'dispatched' || o.status === 'delivered',
    );
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
      <Text style={styles.title}>Orders</Text>

      <OrdersTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={counts}
      />

      {sectionOrders(activeTab).map(order => (
        <OrderCard key={order.id} order={order} onPress={openOrder} />
      ))}

      <OrderDetailModal
        order={selectedOrder}
        visible={!!selectedOrder}
        onClose={closeOrder}
        onAccept={onAction}
        onReject={onReject}
      />

      <OrderSummaryModal
        order={showSummary}
        visible={!!showSummary}
        onClose={() => setShowSummary(null)}
      />
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
});

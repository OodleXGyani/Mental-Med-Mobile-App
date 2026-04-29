import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, X } from 'lucide-react-native';

type OrderStatus =
  | 'new'
  | 'accepted'
  | 'processing'
  | 'ready'
  | 'dispatched'
  | 'delivered';

type Order = {
  id: string;
  status: OrderStatus;
  customer: string;
  phone?: string;
  source?: string;
  items: { name: string; qty: number }[];
  time: string;
  amount: number;
};

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
  const [activeTab, setActiveTab] = useState<
    'New' | 'Active' | 'Ready' | 'Done'
  >('New');
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

  const sectionOrders = (tab: typeof activeTab) => {
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

  const statusPill = (status: OrderStatus) => {
    switch (status) {
      case 'new':
        return { text: 'pending', bg: '#F7E9C6', color: '#8A6B2A' };
      case 'accepted':
        return { text: 'accepted', bg: '#E8F1FF', color: '#3571C1' };
      case 'processing':
        return { text: 'processing', bg: '#F0E7FF', color: '#6B46C1' };
      case 'ready':
        return { text: 'ready', bg: '#E9F7F0', color: '#2D8F6B' };
      case 'dispatched':
      case 'delivered':
        return {
          text: status === 'dispatched' ? 'dispatched' : 'delivered',
          bg: '#E7F6F0',
          color: '#1E8066',
        };
      default:
        return { text: status, bg: '#EEE', color: '#333' };
    }
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

      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'New' && styles.tabActive]}
          onPress={() => setActiveTab('New')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'New' && styles.tabTextActive,
            ]}
          >
            New ({counts.cNew})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Active' && styles.tabActive]}
          onPress={() => setActiveTab('Active')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'Active' && styles.tabTextActive,
            ]}
          >
            Active ({counts.cActive})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Ready' && styles.tabActive]}
          onPress={() => setActiveTab('Ready')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'Ready' && styles.tabTextActive,
            ]}
          >
            Ready ({counts.cReady})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Done' && styles.tabActive]}
          onPress={() => setActiveTab('Done')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'Done' && styles.tabTextActive,
            ]}
          >
            Done ({counts.cDone})
          </Text>
        </TouchableOpacity>
      </View>

      {sectionOrders(activeTab).map(order => {
        const pill = statusPill(order.status);
        return (
          <TouchableOpacity
            key={order.id}
            style={styles.orderCard}
            onPress={() => openOrder(order)}
          >
            <View style={styles.orderLeft}>
              <View style={styles.idRow}>
                <Text style={styles.orderId}>{order.id}</Text>
                <View style={[styles.statusPill, { backgroundColor: pill.bg }]}>
                  <Text style={[styles.statusPillText, { color: pill.color }]}>
                    {pill.text}
                  </Text>
                </View>
              </View>
              <Text
                style={styles.orderMeta}
              >{`${order.customer} · ${order.items.length} items · ${order.time}`}</Text>
            </View>
            <View style={styles.amountWrap}>
              <Text style={styles.amount}>₹{order.amount}</Text>
              <ChevronRight size={14} color="#B7A59A" strokeWidth={2.4} />
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Order detail modal */}
      <Modal visible={!!selectedOrder} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedOrder?.id}</Text>
              <Pressable onPress={closeOrder} hitSlop={8}>
                <X size={18} color="#3B2E2B" strokeWidth={2.2} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>
                <Text style={{ fontWeight: '800' }}>Customer:</Text>{' '}
                {selectedOrder?.customer}
              </Text>
              {selectedOrder?.phone ? (
                <Text style={styles.modalLabel}>
                  <Text style={{ fontWeight: '800' }}>Phone:</Text>{' '}
                  {selectedOrder?.phone}
                </Text>
              ) : null}
              {selectedOrder?.source ? (
                <Text style={styles.modalLabel}>
                  <Text style={{ fontWeight: '800' }}>Source:</Text>{' '}
                  {selectedOrder?.source}
                </Text>
              ) : null}

              <Text style={[styles.modalSectionTitle, { marginTop: 10 }]}>
                Items:
              </Text>
              {selectedOrder?.items.map((it, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Text style={styles.itemText}>{it.name}</Text>
                  <Text style={styles.itemQty}>×{it.qty}</Text>
                </View>
              ))}

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>₹{selectedOrder?.amount}</Text>
              </View>

              {/* action button depending on status */}
              {selectedOrder && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => selectedOrder && onAction(selectedOrder)}
                >
                  <Text style={styles.actionButtonText}>
                    {selectedOrder.status === 'new' && 'Accept'}
                    {selectedOrder.status === 'accepted' && 'Start Processing'}
                    {selectedOrder.status === 'processing' && 'Mark Ready'}
                    {selectedOrder.status === 'ready' && 'Dispatch'}
                    {selectedOrder.status === 'dispatched' && 'Mark Delivered'}
                    {selectedOrder.status === 'delivered' && 'Ok'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* final summary modal shown after marking delivered */}
      <Modal visible={!!showSummary} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{showSummary?.id}</Text>
              <Pressable onPress={() => setShowSummary(null)} hitSlop={8}>
                <X size={18} color="#3B2E2B" strokeWidth={2.2} />
              </Pressable>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>
                <Text style={{ fontWeight: '800' }}>Customer:</Text>{' '}
                {showSummary?.customer}
              </Text>
              <Text style={styles.modalSectionTitle}>Order Summary</Text>
              {showSummary?.items.map((it, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Text style={styles.itemText}>{it.name}</Text>
                  <Text style={styles.itemQty}>×{it.qty}</Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>₹{showSummary?.amount}</Text>
              </View>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowSummary(null)}
              >
                <Text style={styles.actionButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 4,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#1E8066',
  },
  tabText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#A7958A',
  },
  tabTextActive: {
    color: '#1E8066',
    fontWeight: '700',
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
  statusPillText: {
    fontSize: 8.5,
    fontWeight: '700',
    textTransform: 'lowercase',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#252628',
  },
  modalBody: {
    gap: 8,
  },
  modalLabel: {
    fontSize: 12,
    color: '#3B2E2B',
    lineHeight: 16,
  },
  modalSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#252628',
    marginTop: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingVertical: 4,
  },
  itemText: {
    fontSize: 11,
    color: '#3B2E2B',
    flex: 1,
  },
  itemQty: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8A7A6F',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#252628',
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E8066',
  },
  actionButton: {
    backgroundColor: '#1E8066',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 14,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { OrderCard, Order } from '../components/OrderCard';
import { OrdersTabs, TabType } from '../components/OrdersTabs';
import { OrderDetailModal } from '../components/OrderDetailModal';
import { OrderSummaryModal } from '../components/OrderSummaryModal';
import { ordersService } from '../services/ordersService';
import { orderActionFlow, statusMap } from '../types';
import { SCREEN_BOTTOM_PADDING } from '../../../shared/constants/layout';
import { useAppTheme } from '../../../shared/theme';
import { requestCurrentCoordinates } from '../../../shared/utils/location';

import { useCrudEventListener } from '../../../shared/hooks/useCrudEventListener';

export const OrdersScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('New');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showSummary, setShowSummary] = useState<Order | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const fetchedOrders = await ordersService.fetchOrders();
      setOrders(fetchedOrders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders]),
  );

  // Real-time auto-refresh when an order is created, modified or status changes in backend
  useCrudEventListener(
    [
      'erp_pharmacy.api.order_flow.get_orders',
      'erp_pharmacy.api.orders.get_orders_list',
      'erp_pharmacy.api.sales.sales_invoice.get_sales_invoice_list',
    ],
    useCallback(() => {
      loadOrders();
    }, [loadOrders]),
  );

  const openOrder = (order: Order) => setSelectedOrder(order);
  const closeOrder = () => setSelectedOrder(null);

  const onAction = async (order: Order) => {
    // Get the next action based on current status
    const nextActions = orderActionFlow[order.status] || [];
    if (nextActions.length === 0) return;

    const primaryAction = nextActions[0];

    if (!primaryAction) return;

    setUpdatingOrderId(order.id);

    try {
      const { latitude, longitude } = await requestCurrentCoordinates();

      const result = await ordersService.performAction(
        order.id,
        primaryAction.actionInput,
        latitude,
        longitude,
      );

      // Map the returned workflow_state to internal status
      const newStatus = statusMap[result.workflow_state] || order.status;

      // Update the order in the list
      setOrders(prev =>
        prev.map(o =>
          o.id === order.id
            ? {
                ...o,
                status: newStatus,
              }
            : o,
        ),
      );

      closeOrder();

      // Update active tab based on new status
      if (newStatus === 'new') setActiveTab('New');
      else if (newStatus === 'accepted' || (newStatus as any) === 'processing')
        setActiveTab('Active');
      else if (newStatus === 'ready') setActiveTab('Ready');
      else if (newStatus === 'dispatched' || newStatus === 'delivered')
        setActiveTab('Done');

      // Show summary modal after delivered
      if (newStatus === 'delivered') {
        setShowSummary({ ...order, status: newStatus });
      }
    } catch (err) {
      console.error('Failed to update order status:', err);
      Alert.alert(
        'Unable to update order',
        err instanceof Error ? err.message : 'Unknown error',
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const onReject = async (order: Order) => {
    setUpdatingOrderId(order.id);

    try {
      const { latitude, longitude } = await requestCurrentCoordinates();

      await ordersService.performAction(
        order.id,
        'Reject',
        latitude,
        longitude,
      );

      // Remove the rejected order from the list
      setOrders(prev => prev.filter(o => o.id !== order.id));

      closeOrder();

      // Show alert confirming rejection
      Alert.alert('Order Rejected', `Order ${order.id} has been rejected.`);
    } catch (err) {
      console.error('Failed to reject order:', err);
      Alert.alert(
        'Unable to reject order',
        err instanceof Error ? err.message : 'Unknown error',
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const counts = useMemo(() => {
    const cNew = orders.filter(o => o.status === 'new').length;
    const cActive = orders.filter(
      o => o.status === 'accepted' || o.status === 'processing',
    ).length;
    const cReady = orders.filter(o => o.status === 'ready').length;
    // Rejected is a terminal state, same as delivered -- fold it into
    // "Done" so it stays visible somewhere instead of vanishing from
    // every tab (it used to silently fall back into "New" as if still
    // pending, which let staff re-tap Accept/Reject on an already-closed
    // order).
    const cDone = orders.filter(
      o =>
        o.status === 'dispatched' ||
        o.status === 'delivered' ||
        o.status === 'rejected',
    ).length;
    return { cNew, cActive, cReady, cDone };
  }, [orders]);

  const sectionOrders = (tab: TabType) => {
    if (tab === 'New') return orders.filter(o => o.status === 'new');
    if (tab === 'Active')
      return orders.filter(
        o => o.status === 'accepted' || o.status === 'processing',
      );
    if (tab === 'Ready') return orders.filter(o => o.status === 'ready');
    return orders.filter(
      o =>
        o.status === 'dispatched' ||
        o.status === 'delivered' ||
        o.status === 'rejected',
    );
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: Math.max(insets.top, 10) + 8,
          paddingBottom: Math.max(insets.bottom, 10) + SCREEN_BOTTOM_PADDING,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: theme.colors.text }]}>Orders</Text>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.centerText, { color: theme.colors.mutedText }]}>
            Loading orders...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={[styles.centerTitle, { color: theme.colors.text }]}>
            Error
          </Text>
          <Text style={[styles.centerText, { color: theme.colors.danger }]}>
            {error}
          </Text>
        </View>
      ) : (
        <>
          <OrdersTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            counts={counts}
          />

          {sectionOrders(activeTab).length === 0 ? (
            <View style={styles.centerBox}>
              <Text
                style={[styles.centerText, { color: theme.colors.mutedText }]}
              >
                No orders in this category
              </Text>
            </View>
          ) : (
            sectionOrders(activeTab).map(order => (
              <OrderCard key={order.id} order={order} onPress={openOrder} />
            ))
          )}
        </>
      )}

      <OrderDetailModal
        order={selectedOrder}
        visible={!!selectedOrder}
        onClose={closeOrder}
        onAccept={onAction}
        onReject={order => onReject(order)}
        isLoading={updatingOrderId === selectedOrder?.id}
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
  centerBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
  },
  centerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
});

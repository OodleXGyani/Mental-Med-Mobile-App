import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
  ScrollView,
  StyleSheet,
  Text,
  Platform,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { OrderCard, Order, OrderStatus } from '../components/OrderCard';
import { OrdersTabs, TabType } from '../components/OrdersTabs';
import { OrderDetailModal } from '../components/OrderDetailModal';
import { OrderSummaryModal } from '../components/OrderSummaryModal';
import { ordersService } from '../services/ordersService';
import { orderActionFlow, statusMap } from '../types';
import { SCREEN_BOTTOM_PADDING } from '../../../shared/constants/layout';
import { useAppTheme } from '../../../shared/theme';

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
      void loadOrders();
    }, [loadOrders]),
  );

  const openOrder = (order: Order) => setSelectedOrder(order);
  const closeOrder = () => setSelectedOrder(null);

  const requestCurrentCoordinates = useCallback(async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message:
            'We need your location to update the order status with real coordinates.',
          buttonPositive: 'Allow',
          buttonNegative: 'Cancel',
        },
      );

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        throw new Error('Location permission denied.');
      }
    }

    // Fallback coordinates for simulator / dev environment
    const fallbackCoords = { latitude: 28.6139, longitude: 77.209 };

    return await new Promise<{ latitude: number; longitude: number }>(
      resolve => {
        const navigator = globalThis as any;
        const geolocation = navigator?.geolocation;

        if (!geolocation?.getCurrentPosition) {
          console.log(
            'Geolocation unavailable (simulator?). Using fallback coordinates:',
            fallbackCoords,
          );
          resolve(fallbackCoords);
          return;
        }

        // Try to get real location with a timeout
        const timeoutId = setTimeout(() => {
          console.log(
            'Location request timed out. Using fallback coordinates:',
            fallbackCoords,
          );
          resolve(fallbackCoords);
        }, 10000);

        geolocation.getCurrentPosition(
          (position: any) => {
            clearTimeout(timeoutId);
            const realCoords = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            console.log('Got real coordinates:', realCoords);
            resolve(realCoords);
          },
          (error: any) => {
            clearTimeout(timeoutId);
            console.log(
              'Location request failed:',
              error.message,
              '. Using fallback coordinates:',
              fallbackCoords,
            );
            resolve(fallbackCoords);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 10000,
          },
        );
      },
    );
  }, []);

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

      const result = await ordersService.performAction(
        order.id,
        'Reject',
        latitude,
        longitude,
      );

      // Map the returned workflow_state to internal status
      const newStatus = statusMap[result.workflow_state] || order.status;

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
    const cDone = orders.filter(
      o => o.status === 'dispatched' || o.status === 'delivered',
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
      o => o.status === 'dispatched' || o.status === 'delivered',
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

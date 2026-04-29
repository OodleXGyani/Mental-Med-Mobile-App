import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boxes,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  IndianRupee,
  ScanLine,
  ShoppingCart,
  TrendingUp,
  TriangleAlert,
  Users,
} from 'lucide-react-native';
import { useDashboard } from '../hooks/useDashboard';
import { STACK_ROUTES, TAB_ROUTES } from '../../../shared/constants/routes';
import { DashboardHeader } from '../components/DashboardHeader';
import { DashboardStatsGrid } from '../components/DashboardStatsGrid';
import { DashboardQuickActions } from '../components/DashboardQuickActions';
import { DashboardRecentSales } from '../components/DashboardRecentSales';

const formatCurrency = (amount: number) => `Rs ${new Intl.NumberFormat('en-IN').format(amount)}`;

const recentSales = [
  { id: '1', name: 'Ramesh Kumar', invoice: 'INV-001', time: '10:30 AM', amount: 'Rs 1250' },
  { id: '2', name: 'Priya Sharma', invoice: 'INV-002', time: '11:10 AM', amount: 'Rs 840' },
];

export const DashboardScreen = () => {
  const { totalSales, pendingOrders, lowStockItems, loading } = useDashboard();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const stats = [
    {
      label: "Today's Sales",
      value: formatCurrency(totalSales || 12450),
      Icon: IndianRupee,
      iconColor: '#2EA07F',
      iconBackground: '#E9F8F3',
    },
    {
      label: 'Transactions',
      value: '24',
      Icon: TrendingUp,
      iconColor: '#39B77C',
      iconBackground: '#EBF9F0',
    },
    {
      label: 'Pending Orders',
      value: String(pendingOrders || 5),
      Icon: Clock3,
      iconColor: '#5B8EF0',
      iconBackground: '#EAF1FF',
    },
    {
      label: 'Low Stock',
      value: String(lowStockItems || 8),
      Icon: TriangleAlert,
      iconColor: '#E86D68',
      iconBackground: '#FDEEEE',
    },
    {
      label: 'Staff Present',
      value: '4/6',
      Icon: Users,
      iconColor: '#54B974',
      iconBackground: '#E9F8EC',
    },
    {
      label: 'Pending Approvals',
      value: '2',
      Icon: ClipboardCheck,
      iconColor: '#E0A848',
      iconBackground: '#FFF4E5',
    },
  ];

  const actions = [
    { label: 'Scan', Icon: ScanLine, color: '#2CB3A6', tab: TAB_ROUTES.POS },
    { label: 'New Sale', Icon: ShoppingCart, color: '#22B273', tab: TAB_ROUTES.POS },
    { label: 'Orders', Icon: ClipboardList, color: '#3A8EF5', tab: TAB_ROUTES.ORDERS },
    { label: 'Inventory', Icon: Boxes, color: '#F18A2D', tab: TAB_ROUTES.INVENTORY },
  ];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: Math.max(insets.top, 10) + 6,
          paddingBottom: Math.max(insets.bottom, 14) + 18,
          flexGrow: 1,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <DashboardHeader onPressNotification={() => navigation.navigate(STACK_ROUTES.NOTIFICATIONS_HOME)} />

      {loading ? <ActivityIndicator style={styles.loader} /> : null}
      <DashboardStatsGrid stats={stats} />
      <DashboardQuickActions
        actions={actions}
        onPressAction={(tab: string) => navigation.navigate(tab)}
      />
      <DashboardRecentSales
        sales={recentSales}
        onPressViewAll={() => navigation.navigate(TAB_ROUTES.ORDERS)}
        onPressSale={() => navigation.navigate(TAB_ROUTES.ORDERS)}
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
  loader: {
    marginBottom: 10,
  },
});

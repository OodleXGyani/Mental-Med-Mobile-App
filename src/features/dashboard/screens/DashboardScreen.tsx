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
import { SCREEN_BOTTOM_PADDING } from '../../../shared/constants/layout';
import { DashboardHeader } from '../components/DashboardHeader';
import { DashboardStatsGrid } from '../components/DashboardStatsGrid';
import { DashboardQuickActions } from '../components/DashboardQuickActions';
import { DashboardRecentSales } from '../components/DashboardRecentSales';
import { useAppSelector } from '../../../app/hooks';
import { useAppTheme } from '../../../shared/theme';

export const DashboardScreen = () => {
  const { summary, recentSales, loading } = useDashboard();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const session = useAppSelector(state => state.auth.session);
  const theme = useAppTheme();
  const stats = [
    {
      label: "Today's Sales",
      value: `₹${new Intl.NumberFormat('en-IN').format(summary.todaySales)}`,
      Icon: IndianRupee,
      iconColor: '#2EA07F',
      iconBackground: '#E9F8F3',
    },
    {
      label: 'Transactions',
      value: String(summary.transactions),
      Icon: TrendingUp,
      iconColor: '#39B77C',
      iconBackground: '#EBF9F0',
    },
    {
      label: 'Pending Orders',
      value: String(summary.pendingOrders),
      Icon: Clock3,
      iconColor: '#5B8EF0',
      iconBackground: '#EAF1FF',
    },
    {
      label: 'Low Stock',
      value: String(summary.lowStock),
      Icon: TriangleAlert,
      iconColor: '#E86D68',
      iconBackground: '#FDEEEE',
    },
    {
      label: 'Staff Present',
      value: summary.staffPresent.display,
      Icon: Users,
      iconColor: '#54B974',
      iconBackground: '#E9F8EC',
    },
    {
      label: 'Pending Approvals',
      value: String(summary.pendingApprovals),
      Icon: ClipboardCheck,
      iconColor: '#E0A848',
      iconBackground: '#FFF4E5',
    },
  ];

  const actions = [
    { label: 'Scan', Icon: ScanLine, color: '#2CB3A6', tab: TAB_ROUTES.POS },
    {
      label: 'New Sale',
      Icon: ShoppingCart,
      color: '#22B273',
      tab: TAB_ROUTES.POS,
    },
    {
      label: 'Orders',
      Icon: ClipboardList,
      color: '#3A8EF5',
      tab: TAB_ROUTES.ORDERS,
    },
    {
      label: 'Inventory',
      Icon: Boxes,
      color: '#F18A2D',
      tab: TAB_ROUTES.INVENTORY,
    },
  ];

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: Math.max(insets.top, 10) + 6,
          paddingBottom: Math.max(insets.bottom, 10) + SCREEN_BOTTOM_PADDING,
          flexGrow: 1,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <DashboardHeader
        username={session?.username ?? session?.fullName ?? ''}
        onPressNotification={() =>
          navigation.navigate(STACK_ROUTES.NOTIFICATIONS_HOME)
        }
      />

      {loading ? (
        <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
      ) : null}
      <DashboardStatsGrid stats={stats} />
      <DashboardQuickActions
        actions={actions}
        onPressAction={(tab: string) => navigation.navigate(tab)}
      />
      <DashboardRecentSales
        sales={recentSales}
        onPressViewAll={() =>
          navigation.navigate(TAB_ROUTES.SETTINGS, {
            screen: STACK_ROUTES.ORDERS_HISTORY,
          })
        }
        onPressSale={() =>
          navigation.navigate(TAB_ROUTES.SETTINGS, {
            screen: STACK_ROUTES.ORDERS_HISTORY,
          })
        }
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

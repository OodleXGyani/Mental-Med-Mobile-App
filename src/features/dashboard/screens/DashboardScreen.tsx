import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
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
import { dashboardService } from '../services/dashboardService';

export const DashboardScreen = () => {
  const { summary, recentSales, loading } = useDashboard();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const session = useAppSelector(state => state.auth.session);
  const theme = useAppTheme();
  const [notificationCount, setNotificationCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      dashboardService
        .fetchNotifications()
        .then(items => {
          if (!cancelled) setNotificationCount(items.length);
        })
        .catch(() => {
          /* non-fatal -- badge just stays hidden */
        });
      return () => {
        cancelled = true;
      };
    }, []),
  );
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
    {
      label: 'Scan',
      Icon: ScanLine,
      color: '#2CB3A6',
      tab: TAB_ROUTES.POS,
      screen: STACK_ROUTES.POS_HOME,
      params: { autoOpenScan: true },
    },
    {
      label: 'New Sale',
      Icon: ShoppingCart,
      color: '#22B273',
      tab: TAB_ROUTES.POS,
    },
    {
      label: 'Orders',
      Icon: ClipboardList,
      color: '#845EC2',
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
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <View
        style={[
          styles.headerWrap,
          {
            paddingTop: Math.max(insets.top, 15) + 16,
          },
        ]}
      >
        <DashboardHeader
          username={session?.username ?? session?.fullName ?? ''}
          notificationCount={notificationCount}
          onPressNotification={() =>
            navigation.navigate(STACK_ROUTES.NOTIFICATIONS_HOME)
          }
        />
      </View>

      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Math.max(insets.bottom, 10) + SCREEN_BOTTOM_PADDING,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
        ) : null}
        <DashboardStatsGrid stats={stats} />
        <DashboardQuickActions
          actions={actions}
          onPressAction={action =>
            action.screen
              ? navigation.navigate(action.tab, {
                  screen: action.screen,
                  params: action.params,
                })
              : navigation.navigate(action.tab)
          }
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
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  headerWrap: {
    paddingHorizontal: 25,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
    flexGrow: 1,
  },
  loader: {
    marginBottom: 10,
  },
});

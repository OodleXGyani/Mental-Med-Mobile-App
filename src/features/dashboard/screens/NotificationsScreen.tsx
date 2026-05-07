import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  Check,
  CircleAlert,
  Package,
  ShoppingCart,
} from 'lucide-react-native';
import { useAppTheme } from '../../../shared/theme';

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  variant: 'order' | 'stock' | 'expiry' | 'dispatch' | 'update';
  unread?: boolean;
};

const notifications: NotificationItem[] = [
  {
    id: '1',
    title: 'New order received',
    message: 'ORD-2025-005 from Ramesh Kumar - 3 items, Rs 450',
    time: '5 min ago',
    variant: 'order',
    unread: true,
  },
  {
    id: '2',
    title: 'Low stock alert',
    message: 'Amoxicillin 250mg - Only 8 units remaining',
    time: '30 min ago',
    variant: 'stock',
    unread: true,
  },
  {
    id: '3',
    title: 'Expiry alert',
    message: 'Cetirizine 10mg batch B2025-102 expires in 30 days',
    time: '1 hr ago',
    variant: 'expiry',
  },
  {
    id: '4',
    title: 'Order dispatched',
    message: 'ORD-2025-003 marked as dispatched',
    time: '2 hrs ago',
    variant: 'dispatch',
  },
  {
    id: '5',
    title: 'Stock updated',
    message: 'Paracetamol 500mg restocked - 150 units added',
    time: '3 hrs ago',
    variant: 'update',
  },
];

export const NotificationsScreen = () => {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();

  const getItemIcon = (variant: NotificationItem['variant']) => {
    switch (variant) {
      case 'order':
        return (
          <ShoppingCart
            size={14}
            color={theme.colors.primary}
            strokeWidth={2.4}
          />
        );
      case 'stock':
        return (
          <Bell size={14} color={theme.colors.primary} strokeWidth={2.4} />
        );
      case 'expiry':
        return (
          <CircleAlert
            size={14}
            color={theme.colors.warning}
            strokeWidth={2.4}
          />
        );
      case 'dispatch':
        return (
          <ShoppingCart
            size={14}
            color={theme.colors.warning}
            strokeWidth={2.4}
          />
        );
      default:
        return (
          <Package size={14} color={theme.colors.warning} strokeWidth={2.4} />
        );
    }
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: Math.max(insets.top, 10) + 8,
          paddingBottom: Math.max(insets.bottom, 14) + 18,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Notifications
          </Text>
          <View
            style={[styles.pill, { backgroundColor: theme.colors.primary }]}
          >
            <Text style={styles.pillText}>2 new</Text>
          </View>
        </View>
        <View style={styles.markWrap}>
          <Check size={13} color={theme.colors.mutedText} strokeWidth={2.6} />
          <Text style={[styles.markText, { color: theme.colors.mutedText }]}>
            Mark all read
          </Text>
        </View>
      </View>

      {notifications.map(item => (
        <View
          key={item.id}
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
            item.unread
              ? {
                  backgroundColor: theme.dark ? '#1E2C2A' : '#F2FBF8',
                  borderColor: theme.dark ? '#2C3A37' : '#CFE9E3',
                }
              : null,
          ]}
        >
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: theme.dark ? '#1A2624' : '#EAF7F4' },
            ]}
          >
            {getItemIcon(item.variant)}
          </View>
          <View style={styles.textWrap}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
              {item.title}
            </Text>
            <Text
              style={[styles.cardMessage, { color: theme.colors.mutedText }]}
            >
              {item.message}
            </Text>
            <Text style={[styles.cardTime, { color: theme.colors.mutedText }]}>
              {item.time}
            </Text>
          </View>
          {item.unread ? (
            <View
              style={[styles.dot, { backgroundColor: theme.colors.primary }]}
            />
          ) : null}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1F2126',
  },
  pill: {
    backgroundColor: '#2FAF9A',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 2,
  },
  pillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  markWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  markText: {
    color: '#5A4A42',
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E8E9',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardUnread: {
    backgroundColor: '#F2FBF8',
    borderColor: '#CFE9E3',
  },
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EAF7F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    marginRight: 8,
  },
  textWrap: {
    flex: 1,
  },
  cardTitle: {
    color: '#312E2D',
    fontSize: 12.5,
    fontWeight: '700',
  },
  cardMessage: {
    color: '#9E8E83',
    fontSize: 10.5,
    marginTop: 1,
    lineHeight: 14,
  },
  cardTime: {
    color: '#B8ACA4',
    fontSize: 9.5,
    marginTop: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2FAF9A',
    marginLeft: 6,
    marginTop: 4,
  },
});

import React, { useCallback, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, ChevronLeft, CircleAlert } from 'lucide-react-native';
import { useAppTheme } from '../../../shared/theme';
import { dashboardService, NotificationLog } from '../services/dashboardService';
import { formatTimeAgo } from '../../../shared/utils/format';

export const NotificationsScreen = () => {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const navigation = useNavigation<any>();

  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await dashboardService.fetchNotifications();
      setNotifications(data);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to load notifications.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadNotifications();
    }, [loadNotifications]),
  );

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
          {navigation.canGoBack() ? (
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={8}
              style={styles.backButton}
            >
              <ChevronLeft
                size={22}
                color={theme.colors.text}
                strokeWidth={2}
              />
            </Pressable>
          ) : null}
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Notifications
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : errorMessage ? (
        <View style={styles.stateBox}>
          <CircleAlert size={20} color={theme.colors.warning} strokeWidth={2} />
          <Text style={[styles.stateText, { color: theme.colors.mutedText }]}>
            {errorMessage}
          </Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.stateBox}>
          <Bell size={20} color={theme.colors.mutedText} strokeWidth={2} />
          <Text style={[styles.stateText, { color: theme.colors.mutedText }]}>
            No notifications yet.
          </Text>
        </View>
      ) : (
        notifications.map((item, index) => (
          <View
            key={`${item.sent_at}-${index}`}
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: theme.dark ? '#1A2624' : '#EAF7F4' },
              ]}
            >
              <Bell size={14} color={theme.colors.primary} strokeWidth={2.4} />
            </View>
            <View style={styles.textWrap}>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                {item.title}
              </Text>
              <Text
                style={[styles.cardMessage, { color: theme.colors.mutedText }]}
              >
                {item.body}
              </Text>
              <Text style={[styles.cardTime, { color: theme.colors.mutedText }]}>
                {formatTimeAgo(item.sent_at)}
              </Text>
            </View>
          </View>
        ))
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
  backButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1F2126',
  },
  stateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 40,
  },
  stateText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
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
});

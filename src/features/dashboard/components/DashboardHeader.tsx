import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Bell } from 'lucide-react-native';
import { toPascalCase } from '../../../shared/utils/format';
import { useAppTheme } from '../../../shared/theme';

type Props = {
  onPressNotification: () => void;
  username: string;
};

export const DashboardHeader = ({ onPressNotification, username }: Props) => {
  const theme = useAppTheme();
  const displayName = toPascalCase(username || 'User');

  return (
    <View style={styles.headerRow}>
      <View>
        <Text style={[styles.greeting, { color: theme.colors.text }]}>
          Hi, {displayName} 👋
        </Text>
        <Text style={[styles.subGreeting, { color: theme.colors.mutedText }]}>
          Manager · Pharmacy Overview
        </Text>
      </View>
      <Pressable style={styles.notificationWrap} onPress={onPressNotification}>
        <Bell size={22} color={theme.colors.text} strokeWidth={2} />
        <View style={[styles.badge, { backgroundColor: theme.colors.primary, borderColor: theme.colors.background }]}>
          <Text style={styles.badgeText}>3</Text>
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subGreeting: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '500',
  },
  notificationWrap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 6,
    right: 8,
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#F8F8F8', // Assuming background color
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
});

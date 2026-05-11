import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../authentication/hooks/useAuth';
import { STACK_ROUTES } from '../../../shared/constants/routes';
import { SettingsStackParamList } from '../../../navigation/types';
import { useAppTheme } from '../../../shared/theme';
import { SCREEN_BOTTOM_PADDING } from '../../../shared/constants/layout';

type Props = NativeStackScreenProps<
  SettingsStackParamList,
  typeof STACK_ROUTES.SETTINGS_HOME
>;

const menuItems = [
  { label: 'Order History', route: STACK_ROUTES.ORDERS_HISTORY },
  { label: 'Customers', route: STACK_ROUTES.CUSTOMERS_HOME },
  { label: 'Reports', route: STACK_ROUTES.REPORTS_HOME },
  { label: 'Attendance', route: STACK_ROUTES.ATTENDANCE_HOME },
  { label: 'Profile', route: STACK_ROUTES.PROFILE_HOME },
  { label: 'Notifications', route: STACK_ROUTES.NOTIFICATIONS_HOME },
  { label: 'Settings', route: STACK_ROUTES.SETTINGS_DETAILS },
  { label: 'About', route: STACK_ROUTES.ABOUT_HOME },
] as const;

export const SettingsScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const theme = useAppTheme();

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
      <Text style={[styles.title, { color: theme.colors.text }]}>More</Text>
      {menuItems.map(item => (
        <Pressable
          key={item.label}
          style={[
            styles.menuRow,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
          onPress={() => {
            if (item.route) {
              navigation.navigate(item.route);
            }
          }}
        >
          <Text style={[styles.menuLabel, { color: theme.colors.text }]}>
            {item.label}
          </Text>
          <Text style={[styles.menuArrow, { color: theme.colors.mutedText }]}>
            ›
          </Text>
        </Pressable>
      ))}

      <View style={styles.signOutWrap}>
        <Pressable
          style={[
            styles.signOutButton,
            { backgroundColor: theme.colors.primary },
          ]}
          onPress={signOut}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F5F6',
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#2A2A2A',
    marginBottom: 14,
  },
  menuRow: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E3DE',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuLabel: {
    color: '#3B3735',
    fontSize: 15,
    fontWeight: '600',
  },
  menuArrow: {
    color: '#AF9488',
    fontSize: 20,
    lineHeight: 20,
  },
  signOutWrap: {
    marginTop: 14,
  },
  signOutButton: {
    backgroundColor: '#1CA39A',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  signOutText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});

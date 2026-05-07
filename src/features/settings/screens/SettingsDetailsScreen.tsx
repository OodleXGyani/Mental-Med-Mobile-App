import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, Lock } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { setThemeMode } from '../store/settingsSlice';
import { useAppTheme } from '../../../shared/theme';

export const SettingsDetailsScreen = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const theme = useAppTheme();
  const themeMode = useAppSelector(state => state.settings.themeMode);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [autoPrint, setAutoPrint] = useState(false);
  const isDarkMode = themeMode === 'dark';

  const handleThemeToggle = (value: boolean) => {
    dispatch(setThemeMode(value ? 'dark' : 'light'));
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
      <Text style={[styles.title, { color: theme.colors.text }]}>Settings</Text>

      {/* Notifications Section */}
      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.colors.text,
              backgroundColor: theme.colors.background,
            },
          ]}
        >
          Notifications
        </Text>

        <View style={styles.settingRow}>
          <View style={styles.settingContent}>
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
              Push Notifications
            </Text>
            <Text
              style={[
                styles.settingDescription,
                { color: theme.colors.mutedText },
              ]}
            >
              Get alerts for orders & stock
            </Text>
          </View>
          <Switch
            value={pushNotifications}
            onValueChange={setPushNotifications}
            trackColor={{ false: theme.colors.border, true: '#2A6F68' }}
            thumbColor={pushNotifications ? theme.colors.primary : '#F0F0F0'}
          />
        </View>
      </View>

      {/* Display Section */}
      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.colors.text,
              backgroundColor: theme.colors.background,
            },
          ]}
        >
          Display
        </Text>

        <View style={styles.settingRow}>
          <View style={styles.settingContent}>
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
              Dark Mode
            </Text>
            <Text
              style={[
                styles.settingDescription,
                { color: theme.colors.mutedText },
              ]}
            >
              Switch to dark theme
            </Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={handleThemeToggle}
            trackColor={{ false: theme.colors.border, true: '#2A6F68' }}
            thumbColor={isDarkMode ? theme.colors.primary : '#F0F0F0'}
          />
        </View>
      </View>

      {/* Sync & Storage */}
      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.colors.text,
              backgroundColor: theme.colors.background,
            },
          ]}
        >
          Sync & Storage
        </Text>

        <View style={styles.settingRow}>
          <View style={styles.settingContent}>
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
              Offline Mode
            </Text>
            <Text
              style={[
                styles.settingDescription,
                { color: theme.colors.mutedText },
              ]}
            >
              Enable offline data sync
            </Text>
          </View>
          <Switch
            value={offlineMode}
            onValueChange={setOfflineMode}
            trackColor={{ false: theme.colors.border, true: '#2A6F68' }}
            thumbColor={offlineMode ? theme.colors.primary : '#F0F0F0'}
          />
        </View>
      </View>

      {/* Printing */}
      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.colors.text,
              backgroundColor: theme.colors.background,
            },
          ]}
        >
          Printing
        </Text>

        <View style={styles.settingRow}>
          <View style={styles.settingContent}>
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
              Auto Print Invoice
            </Text>
            <Text
              style={[
                styles.settingDescription,
                { color: theme.colors.mutedText },
              ]}
            >
              Print after each sale
            </Text>
          </View>
          <Switch
            value={autoPrint}
            onValueChange={setAutoPrint}
            trackColor={{ false: theme.colors.border, true: '#2A6F68' }}
            thumbColor={autoPrint ? theme.colors.primary : '#F0F0F0'}
          />
        </View>
      </View>

      {/* Account Section */}
      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.colors.text,
              backgroundColor: theme.colors.background,
            },
          ]}
        >
          Account
        </Text>

        <Pressable style={styles.optionRow}>
          <Text style={[styles.optionLabel, { color: theme.colors.text }]}>
            Change Password
          </Text>
          <ChevronRight
            size={20}
            color={theme.colors.mutedText}
            strokeWidth={2}
          />
        </Pressable>
      </View>

      {/* Security Section */}
      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.colors.text,
              backgroundColor: theme.colors.background,
            },
          ]}
        >
          Security
        </Text>

        <View
          style={[
            styles.securityBox,
            { backgroundColor: theme.dark ? '#163330' : '#E5F4F3' },
          ]}
        >
          <Lock size={24} color={theme.colors.primary} strokeWidth={2} />
          <View style={styles.securityContent}>
            <Text style={[styles.securityTitle, { color: theme.colors.text }]}>
              Your data is secure
            </Text>
            <Text
              style={[
                styles.securityDescription,
                { color: theme.colors.mutedText },
              ]}
            >
              All transactions are encrypted end-to-end
            </Text>
          </View>
        </View>
      </View>

      {/* App Info */}
      <View
        style={[
          styles.appInfoBox,
          { backgroundColor: theme.dark ? '#1C1A18' : '#F4F2EF' },
        ]}
      >
        <Text style={[styles.appVersion, { color: theme.colors.text }]}>
          Meds15 Pharmacy Management
        </Text>
        <Text
          style={[styles.appVersionNumber, { color: theme.colors.mutedText }]}
        >
          Version 1.0.0
        </Text>
        <Text style={[styles.copyright, { color: theme.colors.mutedText }]}>
          © 2024 Meds15. All rights reserved.
        </Text>
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
    marginBottom: 16,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E3DE',
    paddingVertical: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2A2A2A',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B3735',
  },
  settingDescription: {
    fontSize: 12,
    fontWeight: '500',
    color: '#A68F82',
    marginTop: 3,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B3735',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 16,
  },
  securityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#E5F4F3',
    borderRadius: 8,
    marginHorizontal: 16,
    gap: 12,
  },
  securityContent: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1CA39A',
  },
  securityDescription: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2B9A92',
    marginTop: 2,
  },
  appInfoBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E3DE',
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  appVersion: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2A2A2A',
  },
  appVersionNumber: {
    fontSize: 12,
    fontWeight: '500',
    color: '#A68F82',
    marginTop: 4,
  },
  copyright: {
    fontSize: 11,
    fontWeight: '500',
    color: '#B59D90',
    marginTop: 8,
  },
});

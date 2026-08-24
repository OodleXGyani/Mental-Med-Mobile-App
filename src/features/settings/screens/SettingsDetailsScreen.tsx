import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getApp } from '@react-native-firebase/app';
import { getMessaging, getToken } from '@react-native-firebase/messaging';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { setThemeMode } from '../store/settingsSlice';
import { useSettings } from '../hooks/useSettings';
import { useAppTheme } from '../../../shared/theme';
import { authService } from '../../authentication/services/authService';

export const SettingsDetailsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const theme = useAppTheme();
  const themeMode = useAppSelector(state => state.settings.themeMode);
  const session = useAppSelector(state => state.auth.session);
  const {
    pushNotificationsEnabled,
    autoPrintEnabled,
    updatePushNotificationsEnabled,
    updateAutoPrintEnabled,
  } = useSettings();
  const [notificationBusy, setNotificationBusy] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const isDarkMode = themeMode === 'dark';

  const handleThemeToggle = (value: boolean) => {
    dispatch(setThemeMode(value ? 'dark' : 'light'));
  };

  const handlePushNotificationsToggle = async (value: boolean) => {
    setNotificationBusy(true);
    try {
      const token = await getToken(getMessaging(getApp()));
      if (token) {
        if (value) {
          await authService.uploadFCMToken(
            session?.email || '',
            token,
            'android',
          );
        } else {
          await authService.deleteFCMToken(token);
        }
      }
      updatePushNotificationsEnabled(value);
    } catch {
      Alert.alert(
        'Unable to update',
        'Could not change your notification setting. Please try again.',
      );
    } finally {
      setNotificationBusy(false);
    }
  };

  const handleChangePassword = async () => {
    if (!session?.email) {
      Alert.alert('Unable to send reset link', 'No account email on file.');
      return;
    }
    setChangingPassword(true);
    try {
      await authService.forgotPassword(session.email);
      Alert.alert(
        'Check your email',
        `A password reset link has been sent to ${session.email}.`,
      );
    } catch (error) {
      Alert.alert(
        'Unable to send reset link',
        error instanceof Error ? error.message : 'Please try again later.',
      );
    } finally {
      setChangingPassword(false);
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
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color={theme.colors.text} strokeWidth={2} />
        </Pressable>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Settings
        </Text>
        <View style={styles.backButton} />
      </View>

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
          {notificationBusy ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : (
            <Switch
              value={pushNotificationsEnabled}
              onValueChange={handlePushNotificationsToggle}
              trackColor={{ false: theme.colors.border, true: '#2A6F68' }}
              thumbColor={
                pushNotificationsEnabled ? theme.colors.primary : '#F0F0F0'
              }
            />
          )}
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
            value={autoPrintEnabled}
            onValueChange={updateAutoPrintEnabled}
            trackColor={{ false: theme.colors.border, true: '#2A6F68' }}
            thumbColor={autoPrintEnabled ? theme.colors.primary : '#F0F0F0'}
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

        <Pressable
          style={styles.optionRow}
          onPress={handleChangePassword}
          disabled={changingPassword}
        >
          <Text style={[styles.optionLabel, { color: theme.colors.text }]}>
            Change Password
          </Text>
          {changingPassword ? (
            <ActivityIndicator size="small" color={theme.colors.mutedText} />
          ) : (
            <ChevronRight
              size={20}
              color={theme.colors.mutedText}
              strokeWidth={2}
            />
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#2A2A2A',
    marginBottom: 0,
    flex: 1,
    textAlign: 'center',
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

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

export const SettingsDetailsScreen = () => {
  const insets = useSafeAreaInsets();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [autoPrint, setAutoPrint] = useState(false);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: Math.max(insets.top, 10) + 8,
          paddingBottom: Math.max(insets.bottom, 14) + 18,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Settings</Text>

      {/* Notifications Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Notifications</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <Text style={styles.settingDescription}>
              Get alerts for orders & stock
            </Text>
          </View>
          <Switch
            value={pushNotifications}
            onValueChange={setPushNotifications}
            trackColor={{ false: '#E8E3DE', true: '#B5E8E4' }}
            thumbColor={pushNotifications ? '#1CA39A' : '#F0F0F0'}
          />
        </View>
      </View>

      {/* Display Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Display</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Text style={styles.settingDescription}>Switch to dark theme</Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: '#E8E3DE', true: '#B5E8E4' }}
            thumbColor={darkMode ? '#1CA39A' : '#F0F0F0'}
          />
        </View>
      </View>

      {/* Sync & Storage */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Sync & Storage</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Offline Mode</Text>
            <Text style={styles.settingDescription}>
              Enable offline data sync
            </Text>
          </View>
          <Switch
            value={offlineMode}
            onValueChange={setOfflineMode}
            trackColor={{ false: '#E8E3DE', true: '#B5E8E4' }}
            thumbColor={offlineMode ? '#1CA39A' : '#F0F0F0'}
          />
        </View>
      </View>

      {/* Printing */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Printing</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Auto Print Invoice</Text>
            <Text style={styles.settingDescription}>Print after each sale</Text>
          </View>
          <Switch
            value={autoPrint}
            onValueChange={setAutoPrint}
            trackColor={{ false: '#E8E3DE', true: '#B5E8E4' }}
            thumbColor={autoPrint ? '#1CA39A' : '#F0F0F0'}
          />
        </View>
      </View>

      {/* Account Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Account</Text>

        <Pressable style={styles.optionRow}>
          <Text style={styles.optionLabel}>Change Password</Text>
          <ChevronRight size={20} color="#AF9488" strokeWidth={2} />
        </Pressable>

        <View style={styles.divider} />

        <Pressable style={styles.optionRow}>
          <Text style={styles.optionLabel}>Data & Privacy</Text>
          <ChevronRight size={20} color="#AF9488" strokeWidth={2} />
        </Pressable>

        <View style={styles.divider} />

        <Pressable style={styles.optionRow}>
          <Text style={styles.optionLabel}>Help & Support</Text>
          <ChevronRight size={20} color="#AF9488" strokeWidth={2} />
        </Pressable>

        <View style={styles.divider} />

        <Pressable style={styles.optionRow}>
          <Text style={styles.optionLabel}>Legal</Text>
          <ChevronRight size={20} color="#AF9488" strokeWidth={2} />
        </Pressable>
      </View>

      {/* Security Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Security</Text>

        <View style={styles.securityBox}>
          <Lock size={24} color="#1CA39A" strokeWidth={2} />
          <View style={styles.securityContent}>
            <Text style={styles.securityTitle}>Your data is secure</Text>
            <Text style={styles.securityDescription}>
              All transactions are encrypted end-to-end
            </Text>
          </View>
        </View>
      </View>

      {/* App Info */}
      <View style={styles.appInfoBox}>
        <Text style={styles.appVersion}>Meds15 Pharmacy Management</Text>
        <Text style={styles.appVersionNumber}>Version 1.0.0</Text>
        <Text style={styles.copyright}>
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
    backgroundColor: '#F9F7F5',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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

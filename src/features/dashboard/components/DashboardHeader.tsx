import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Bell } from 'lucide-react-native';

type Props = {
  onPressNotification: () => void;
};

export const DashboardHeader = ({ onPressNotification }: Props) => {
  return (
    <View style={styles.headerRow}>
      <View>
        <Text style={styles.greeting}>Hi, Rajesh 👋</Text>
        <Text style={styles.subGreeting}>Manager · Pharmacy Overview</Text>
      </View>
      <Pressable style={styles.notificationWrap} onPress={onPressNotification}>
        <Bell size={19} color="#7B7F86" strokeWidth={2.3} />
        <View style={styles.badge}>
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
    marginBottom: 13,
  },
  greeting: {
    fontSize: 29,
    fontWeight: '800',
    color: '#202224',
  },
  subGreeting: {
    color: '#A89D96',
    marginTop: 3,
    fontSize: 12,
    fontWeight: '500',
  },
  notificationWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#1CA39A',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: -2,
    right: -2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
});

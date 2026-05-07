import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../../shared/theme';

type Action = {
  label: string;
  Icon: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
  color: string;
  tab: string;
};

type Props = {
  actions: Action[];
  onPressAction: (tab: string) => void;
};

export const DashboardQuickActions = ({ actions, onPressAction }: Props) => {
  const theme = useAppTheme();

  return (
    <>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Quick Actions
      </Text>
      <View style={styles.actionsRow}>
        {actions.map(action => (
          <Pressable
            style={styles.actionItem}
            key={action.label}
            onPress={() => onPressAction(action.tab)}
          >
            <View
              style={[styles.actionIcon, { backgroundColor: action.color }]}
            >
              <action.Icon size={16} color="#FFFFFF" strokeWidth={2.6} />
            </View>
            <Text
              style={[styles.actionLabel, { color: theme.colors.mutedText }]}
            >
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    color: '#2D3035',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 9,
  },
  actionItem: {
    alignItems: 'center',
    width: '22.5%',
  },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionLabel: {
    color: '#5F6670',
    fontSize: 10.5,
    fontWeight: '600',
  },
});

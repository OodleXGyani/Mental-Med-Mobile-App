import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../../shared/theme';

export type Action = {
  label: string;
  Icon: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
  color: string;
  tab: string;
  // Optional deep-link into a specific screen (+ params) inside that tab's
  // stack -- without this, every action that targets the same tab (e.g.
  // "Scan" and "New Sale" both target POS) is indistinguishable once
  // navigated, since a bare tab navigate always just lands on that stack's
  // default screen.
  screen?: string;
  params?: Record<string, unknown>;
};

type Props = {
  actions: Action[];
  onPressAction: (action: Action) => void;
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
            onPress={() => onPressAction(action)}
          >
            <View
              style={[styles.actionIcon, { backgroundColor: action.color }]}
            >
              <action.Icon size={18} color="#FFFFFF" strokeWidth={2.4} />
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
    fontSize: 15,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  actionItem: {
    alignItems: 'center',
    width: '22.5%',
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});

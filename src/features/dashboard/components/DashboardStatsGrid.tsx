import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../../shared/theme';

type Stat = {
  label: string;
  value: string;
  Icon: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
  iconColor: string;
  iconBackground: string;
};

type Props = {
  stats: Stat[];
};

export const DashboardStatsGrid = ({ stats }: Props) => {
  const theme = useAppTheme();

  return (
    <View style={styles.statsGrid}>
      {stats.map(item => (
        <View
          key={item.label}
          style={[
            styles.statCard,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.statIcon,
              {
                backgroundColor: theme.dark ? '#253634' : item.iconBackground,
              },
            ]}
          >
            <item.Icon size={15} color={item.iconColor} strokeWidth={2.3} />
          </View>
          <View style={styles.statTextBlock}>
            <Text style={[styles.statLabel, { color: theme.colors.mutedText }]}>
              {item.label}
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {item.value}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statCard: {
    width: '48.6%',
    minHeight: 95,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 1,
    flexShrink: 0,
  },
  statTextBlock: {
    flex: 1,
    paddingTop: 1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
    lineHeight: 22,
  },
});

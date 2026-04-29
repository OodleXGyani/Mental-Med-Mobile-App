import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { AppCard } from '../../../shared/components';
import { useAppSelector } from '../../../app/hooks';
import { resolveTheme } from '../../../shared/theme';

type Props = {
  presentCount: number;
};

export const AttendanceSummaryCard = ({ presentCount }: Props) => {
  const mode = useAppSelector(state => state.settings.themeMode);
  const systemScheme = useAppSelector(state => state.settings.systemScheme);
  const theme = resolveTheme(mode, systemScheme);

  return (
    <AppCard>
      <Text style={[styles.title, { color: theme.colors.text }]}>Present Staff</Text>
      <Text style={[styles.count, { color: theme.colors.success }]}>{presentCount}</Text>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  title: {
    fontWeight: '700',
    fontSize: 14,
  },
  count: {
    marginTop: 8,
    fontWeight: '800',
    fontSize: 28,
  },
});

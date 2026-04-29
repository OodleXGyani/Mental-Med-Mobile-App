import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { AppCard } from '../../../shared/components';
import { useAppSelector } from '../../../app/hooks';
import { resolveTheme } from '../../../shared/theme';

type Props = {
  pendingOrders: number;
};

export const OrdersSummaryCard = ({ pendingOrders }: Props) => {
  const mode = useAppSelector(state => state.settings.themeMode);
  const systemScheme = useAppSelector(state => state.settings.systemScheme);
  const theme = resolveTheme(mode, systemScheme);

  return (
    <AppCard>
      <Text style={[styles.title, { color: theme.colors.text }]}>Pending Orders</Text>
      <Text style={[styles.count, { color: theme.colors.warning }]}>{pendingOrders}</Text>
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

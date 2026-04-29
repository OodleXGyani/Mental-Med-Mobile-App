import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { AppCard } from '../../../shared/components';
import { useAppSelector } from '../../../app/hooks';
import { resolveTheme } from '../../../shared/theme';

type Props = {
  lowStockCount: number;
};

export const InventorySummaryCard = ({ lowStockCount }: Props) => {
  const mode = useAppSelector(state => state.settings.themeMode);
  const systemScheme = useAppSelector(state => state.settings.systemScheme);
  const theme = resolveTheme(mode, systemScheme);

  return (
    <AppCard>
      <Text style={[styles.title, { color: theme.colors.text }]}>Low Stock Alerts</Text>
      <Text style={[styles.count, { color: theme.colors.danger }]}>{lowStockCount}</Text>
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

import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { AppCard } from '../../../shared/components';
import { formatCurrency } from '../../../shared/utils/format';
import { useAppSelector } from '../../../app/hooks';
import { resolveTheme } from '../../../shared/theme';

type Props = {
  total: number;
};

export const BillingSummaryCard = ({ total }: Props) => {
  const mode = useAppSelector(state => state.settings.themeMode);
  const systemScheme = useAppSelector(state => state.settings.systemScheme);
  const theme = resolveTheme(mode, systemScheme);

  return (
    <AppCard>
      <Text style={[styles.title, { color: theme.colors.text }]}>Current Bill</Text>
      <Text style={[styles.total, { color: theme.colors.primary }]}>{formatCurrency(total)}</Text>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  total: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 8,
  },
});

import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { AppCard } from '../../../shared/components';
import { useAppSelector } from '../../../app/hooks';
import { resolveTheme } from '../../../shared/theme';

type Props = {
  label: string;
  value: string;
};

export const KpiCard = ({ label, value }: Props) => {
  const mode = useAppSelector(state => state.settings.themeMode);
  const systemScheme = useAppSelector(state => state.settings.systemScheme);
  const theme = resolveTheme(mode, systemScheme);

  return (
    <AppCard>
      <Text style={[styles.value, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[styles.label, { color: theme.colors.mutedText }]}>{label}</Text>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  value: {
    fontSize: 26,
    fontWeight: '800',
  },
  label: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
  },
});

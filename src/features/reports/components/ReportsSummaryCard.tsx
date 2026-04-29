import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { AppCard } from '../../../shared/components';
import { useAppSelector } from '../../../app/hooks';
import { resolveTheme } from '../../../shared/theme';

type Props = {
  lastGeneratedAt: string | null;
};

export const ReportsSummaryCard = ({ lastGeneratedAt }: Props) => {
  const mode = useAppSelector(state => state.settings.themeMode);
  const systemScheme = useAppSelector(state => state.settings.systemScheme);
  const theme = resolveTheme(mode, systemScheme);

  return (
    <AppCard>
      <Text style={[styles.title, { color: theme.colors.text }]}>Latest Report</Text>
      <Text style={[styles.value, { color: theme.colors.mutedText }]}>
        {lastGeneratedAt ?? 'No report generated yet'}
      </Text>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  title: {
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 8,
  },
  value: {
    fontSize: 13,
    lineHeight: 20,
  },
});

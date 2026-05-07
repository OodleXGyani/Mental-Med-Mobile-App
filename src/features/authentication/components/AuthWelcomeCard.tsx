import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { AppCard } from '../../../shared/components';
import { useAppTheme } from '../../../shared/theme';

export const AuthWelcomeCard = () => {
  const theme = useAppTheme();

  return (
    <AppCard>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Meds Retail Suite
      </Text>
      <Text style={[styles.subtext, { color: theme.colors.mutedText }]}>
        Sign in to continue to operations dashboard.
      </Text>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtext: {
    fontSize: 14,
    lineHeight: 20,
  },
});

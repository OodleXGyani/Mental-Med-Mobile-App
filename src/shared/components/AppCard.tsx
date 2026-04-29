import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useAppSelector } from '../../app/hooks';
import { resolveTheme } from '../theme';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export const AppCard = ({ children, style }: Props) => {
  const mode = useAppSelector(state => state.settings.themeMode);
  const systemScheme = useAppSelector(state => state.settings.systemScheme);
  const theme = resolveTheme(mode, systemScheme);

  return <View style={[styles.card, { backgroundColor: theme.colors.card }, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
});

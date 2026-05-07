import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton, AppCard } from '../../../shared/components';
import { ThemeMode } from '../../../shared/theme';
import { useAppTheme } from '../../../shared/theme';

type Props = {
  mode: ThemeMode;
  onChange: (mode: ThemeMode) => void;
};

export const ThemeSelectorCard = ({ mode, onChange }: Props) => {
  const theme = useAppTheme();

  return (
    <AppCard>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Theme Mode
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.mutedText }]}>
        Current: {mode}
      </Text>
      <View style={styles.row}>
        <AppButton
          title="System"
          onPress={() => onChange('system')}
          style={styles.button}
        />
        <AppButton
          title="Light"
          onPress={() => onChange('light')}
          style={styles.button}
        />
        <AppButton
          title="Dark"
          onPress={() => onChange('dark')}
          style={styles.button}
        />
      </View>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  title: {
    fontWeight: '700',
    fontSize: 14,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
  },
  row: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
});

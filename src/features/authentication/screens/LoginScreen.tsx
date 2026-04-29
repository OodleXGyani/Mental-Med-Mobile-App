import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import {
  AppButton,
  AppInput,
  ScreenLayout,
} from '../../../shared/components';
import { useAppSelector } from '../../../app/hooks';
import { resolveTheme } from '../../../shared/theme';
import { AuthWelcomeCard } from '../components/AuthWelcomeCard';
import { useAuth } from '../hooks/useAuth';

export const LoginScreen = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('1234');
  const { login, loading, error } = useAuth();

  const mode = useAppSelector(state => state.settings.themeMode);
  const systemScheme = useAppSelector(state => state.settings.systemScheme);
  const theme = resolveTheme(mode, systemScheme);

  return (
    <ScreenLayout title="Authentication" subtitle="Secure access for staff and store owners.">
      <AuthWelcomeCard />
      <AppInput
        label="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <AppInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <AppButton
        title={loading ? 'Signing In...' : 'Sign In'}
        onPress={() => login(username, password)}
        disabled={loading}
      />
      {loading ? <ActivityIndicator style={styles.loader} /> : null}
      {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}
      <View style={styles.hintContainer}>
        <Text style={[styles.hint, { color: theme.colors.mutedText }]}>This is a starter auth flow with mock API integration.</Text>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  loader: {
    marginTop: 12,
  },
  error: {
    marginTop: 10,
    fontWeight: '600',
  },
  hintContainer: {
    marginTop: 16,
  },
  hint: {
    fontSize: 13,
  },
});

import React, { useEffect } from 'react';
import { ActivityIndicator, StatusBar, View } from 'react-native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from './src/app/hooks';
import { store } from './src/app/store';
import { bootstrapAuth } from './src/features/authentication/store/authSlice';
import { RootNavigator } from './src/navigation/RootNavigator';
import { resolveTheme } from './src/shared/theme';

const AuthBootstrapGate = () => {
  const dispatch = useAppDispatch();
  const hydrated = useAppSelector(state => state.auth.hydrated);
  const mode = useAppSelector(state => state.settings.themeMode);
  const systemScheme = useAppSelector(state => state.settings.systemScheme);
  const theme = resolveTheme(mode, systemScheme);

  useEffect(() => {
    dispatch(bootstrapAuth());
  }, [dispatch]);

  if (!hydrated) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.background,
        }}
      >
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return <RootNavigator />;
};

const AppShell = () => {
  const mode = useAppSelector(state => state.settings.themeMode);
  const systemScheme = useAppSelector(state => state.settings.systemScheme);
  const theme = resolveTheme(mode, systemScheme);

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      <AuthBootstrapGate />
    </SafeAreaProvider>
  );
};

function App() {
  return (
    <Provider store={store}>
      <AppShell />
    </Provider>
  );
}

export default App;

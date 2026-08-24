import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from './src/app/hooks';
import { store } from './src/app/store';
import { bootstrapAuth } from './src/features/authentication/store/authSlice';
import { bootstrapSettings } from './src/features/settings/store/settingsSlice';
import { RootNavigator } from './src/navigation/RootNavigator';
import { resolveTheme } from './src/shared/theme';
import { useFCM } from './src/shared/hooks/useFCM';
import { SplashScreen } from './src/features/authentication/screens/SplashScreen';

const AuthBootstrapGate = () => {
  const dispatch = useAppDispatch();
  const hydrated = useAppSelector(state => state.auth.hydrated);
  const settingsHydrated = useAppSelector(state => state.settings.hydrated);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    dispatch(bootstrapAuth());
    dispatch(bootstrapSettings());
  }, [dispatch]);

  // Show splash until animation finishes AND auth + settings are hydrated
  // (theme mode and the notification/auto-print preferences all live in
  // AsyncStorage now, not just in-memory Redux state).
  if (!splashDone || !hydrated || !settingsHydrated) {
    return (
      <SplashScreen
        onFinish={() => setSplashDone(true)}
      />
    );
  }

  return <RootNavigator />;
};

const AppShell = () => {
  const mode = useAppSelector(state => state.settings.themeMode);
  const systemScheme = useAppSelector(state => state.settings.systemScheme);
  const theme = resolveTheme(mode, systemScheme);

  // Initialize Firebase Cloud Messaging (FCM) hook
  useFCM();

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

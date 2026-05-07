import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  StatusBar,
  View,
  useColorScheme,
} from 'react-native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from './src/app/hooks';
import { store } from './src/app/store';
import { bootstrapAuth } from './src/features/authentication/store/authSlice';
import { RootNavigator } from './src/navigation/RootNavigator';

const AuthBootstrapGate = () => {
  const dispatch = useAppDispatch();
  const hydrated = useAppSelector(state => state.auth.hydrated);

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
          backgroundColor: '#F8F8F8',
        }}
      >
        <ActivityIndicator color="#1CA39A" />
      </View>
    );
  }

  return <RootNavigator />;
};

function App() {
  const scheme = useColorScheme();
  const isDarkMode = scheme === 'dark';

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <AuthBootstrapGate />
      </SafeAreaProvider>
    </Provider>
  );
}

export default App;

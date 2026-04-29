import React, { useEffect } from 'react';
import { NavigationContainer, Theme } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { setSystemScheme } from '../features/settings/store/settingsSlice';
import { resolveTheme } from '../shared/theme';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';

export const RootNavigator = () => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
  const mode = useAppSelector(state => state.settings.themeMode);
  const systemScheme = useColorScheme();
  const normalizedScheme =
    systemScheme === 'light' || systemScheme === 'dark' ? systemScheme : null;

  useEffect(() => {
    dispatch(setSystemScheme(normalizedScheme));
  }, [dispatch, normalizedScheme]);

  const appTheme = resolveTheme(mode, normalizedScheme);

  const navigationTheme: Theme = {
    dark: appTheme.dark,
    colors: {
      primary: appTheme.colors.primary,
      background: appTheme.colors.background,
      card: appTheme.colors.card,
      text: appTheme.colors.text,
      border: appTheme.colors.border,
      notification: appTheme.colors.warning,
    },
    fonts: {
      regular: {
        fontFamily: 'System',
        fontWeight: '400',
      },
      medium: {
        fontFamily: 'System',
        fontWeight: '500',
      },
      bold: {
        fontFamily: 'System',
        fontWeight: '700',
      },
      heavy: {
        fontFamily: 'System',
        fontWeight: '800',
      },
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      {isAuthenticated ? <MainTabNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

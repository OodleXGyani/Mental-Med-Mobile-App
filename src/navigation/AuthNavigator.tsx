import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../features/authentication/screens/LoginScreen';
import { ForgotPasswordScreen } from '../features/authentication/screens/ForgotPasswordScreen';
import { STACK_ROUTES } from '../shared/constants/routes';
import { AuthStackParamList } from './types';
import { useAppSelector } from '../app/hooks';
import { resolveTheme } from '../shared/theme';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator = () => {
  const mode = useAppSelector(state => state.settings.themeMode);
  const systemScheme = useAppSelector(state => state.settings.systemScheme);
  const theme = resolveTheme(mode, systemScheme);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
        cardStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen
        name={STACK_ROUTES.LOGIN}
        component={LoginScreen}
        options={{
          animationEnabled: true,
        }}
      />
      <Stack.Screen
        name={STACK_ROUTES.FORGOT_PASSWORD}
        component={ForgotPasswordScreen}
        options={{
          animationEnabled: true,
          gestureEnabled: true,
        }}
      />
    </Stack.Navigator>
  );
};

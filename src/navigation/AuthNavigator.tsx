import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../features/authentication/screens/LoginScreen';
import { ForgotPasswordScreen } from '../features/authentication/screens/ForgotPasswordScreen';
import { STACK_ROUTES } from '../shared/constants/routes';
import { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
        cardStyle: { backgroundColor: '#F5F5F6' },
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

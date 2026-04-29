import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardScreen } from '../features/dashboard/screens/DashboardScreen';
import { NotificationsScreen } from '../features/dashboard/screens/NotificationsScreen';
import { STACK_ROUTES } from '../shared/constants/routes';
import { DashboardStackParamList } from './types';

const Stack = createNativeStackNavigator<DashboardStackParamList>();

export const DashboardStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={STACK_ROUTES.DASHBOARD_HOME} component={DashboardScreen} options={{ title: 'Dashboard' }} />
      <Stack.Screen
        name={STACK_ROUTES.NOTIFICATIONS_HOME}
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
    </Stack.Navigator>
  );
};

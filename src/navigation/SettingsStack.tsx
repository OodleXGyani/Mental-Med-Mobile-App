import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsScreen } from '../features/settings/screens/SettingsScreen';
import { CustomersScreen } from '../features/settings/screens/CustomersScreen';
import { CustomerDetailsScreen } from '../features/settings/screens/CustomerDetailsScreen';
import { ProfileScreen } from '../features/settings/screens/ProfileScreen';
import { SettingsDetailsScreen } from '../features/settings/screens/SettingsDetailsScreen';
import { AboutScreen } from '../features/settings/screens/AboutScreen';
import { ReportsScreen } from '../features/reports/screens/ReportsScreen';
import { AttendanceScreen } from '../features/attendance/screens/AttendanceScreen';
import { OrderHistoryScreen } from '../features/settings/screens/OrderHistoryScreen';
import { NotificationsScreen } from '../features/dashboard/screens/NotificationsScreen';
import { STACK_ROUTES } from '../shared/constants/routes';
import { SettingsStackParamList } from './types';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export const SettingsStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name={STACK_ROUTES.SETTINGS_HOME}
        component={SettingsScreen}
        options={{ title: 'More' }}
      />
      <Stack.Screen
        name={STACK_ROUTES.CUSTOMERS_HOME}
        component={CustomersScreen}
        options={{ title: 'Customers' }}
      />
      <Stack.Screen
        name={STACK_ROUTES.CUSTOMER_DETAILS}
        component={CustomerDetailsScreen}
        options={{ title: 'Customer Details' }}
      />
      <Stack.Screen
        name={STACK_ROUTES.REPORTS_HOME}
        component={ReportsScreen}
        options={{ title: 'Reports' }}
      />
      <Stack.Screen
        name={STACK_ROUTES.ATTENDANCE_HOME}
        component={AttendanceScreen}
        options={{ title: 'Attendance' }}
      />
      <Stack.Screen
        name={STACK_ROUTES.ORDERS_HISTORY}
        component={OrderHistoryScreen}
        options={{ title: 'Order History' }}
      />
      <Stack.Screen
        name={STACK_ROUTES.PROFILE_HOME}
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen
        name={STACK_ROUTES.NOTIFICATIONS_HOME}
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
      <Stack.Screen
        name={STACK_ROUTES.SETTINGS_DETAILS}
        component={SettingsDetailsScreen}
        options={{ title: 'Settings' }}
      />
      <Stack.Screen
        name={STACK_ROUTES.ABOUT_HOME}
        component={AboutScreen}
        options={{ title: 'About' }}
      />
    </Stack.Navigator>
  );
};

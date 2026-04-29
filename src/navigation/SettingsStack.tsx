import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsScreen } from '../features/settings/screens/SettingsScreen';
import { CustomersScreen } from '../features/settings/screens/CustomersScreen';
import { ReportsScreen } from '../features/reports/screens/ReportsScreen';
import { AttendanceScreen } from '../features/attendance/screens/AttendanceScreen';
import { STACK_ROUTES } from '../shared/constants/routes';
import { SettingsStackParamList } from './types';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export const SettingsStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={STACK_ROUTES.SETTINGS_HOME} component={SettingsScreen} options={{ title: 'More' }} />
      <Stack.Screen name={STACK_ROUTES.CUSTOMERS_HOME} component={CustomersScreen} options={{ title: 'Customers' }} />
      <Stack.Screen name={STACK_ROUTES.REPORTS_HOME} component={ReportsScreen} options={{ title: 'Reports' }} />
      <Stack.Screen name={STACK_ROUTES.ATTENDANCE_HOME} component={AttendanceScreen} options={{ title: 'Attendance' }} />
    </Stack.Navigator>
  );
};

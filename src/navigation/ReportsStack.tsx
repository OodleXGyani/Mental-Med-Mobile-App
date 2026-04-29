import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ReportsScreen } from '../features/reports/screens/ReportsScreen';
import { STACK_ROUTES } from '../shared/constants/routes';
import { ReportsStackParamList } from './types';

const Stack = createNativeStackNavigator<ReportsStackParamList>();

export const ReportsStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name={STACK_ROUTES.REPORTS_HOME} component={ReportsScreen} options={{ title: 'Reports' }} />
    </Stack.Navigator>
  );
};

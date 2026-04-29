import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AttendanceScreen } from '../features/attendance/screens/AttendanceScreen';
import { STACK_ROUTES } from '../shared/constants/routes';
import { AttendanceStackParamList } from './types';

const Stack = createNativeStackNavigator<AttendanceStackParamList>();

export const AttendanceStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name={STACK_ROUTES.ATTENDANCE_HOME} component={AttendanceScreen} options={{ title: 'Attendance' }} />
    </Stack.Navigator>
  );
};

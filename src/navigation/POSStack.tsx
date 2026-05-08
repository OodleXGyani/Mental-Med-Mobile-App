import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { POSScreen } from '../features/pos/screens/POSScreen';
import { MedicineListScreen } from '../features/pos/screens/MedicineListScreen';
import { STACK_ROUTES } from '../shared/constants/routes';
import { POSStackParamList } from './types';

const Stack = createNativeStackNavigator<POSStackParamList>();

export const POSStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name={STACK_ROUTES.POS_HOME}
        component={POSScreen}
        options={{ title: 'POS Billing' }}
      />
      <Stack.Screen
        name={STACK_ROUTES.POS_MEDICINE_LIST}
        component={MedicineListScreen}
        options={{ title: 'Select Medicine' }}
      />
    </Stack.Navigator>
  );
};

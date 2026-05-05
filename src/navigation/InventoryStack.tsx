import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { InventoryDetailsScreen } from '../features/inventory/screens/InventoryDetailsScreen';
import { InventoryScreen } from '../features/inventory/screens/InventoryScreen';
import { STACK_ROUTES } from '../shared/constants/routes';
import { InventoryStackParamList } from './types';

const Stack = createNativeStackNavigator<InventoryStackParamList>();

export const InventoryStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name={STACK_ROUTES.INVENTORY_HOME}
        component={InventoryScreen}
        options={{ title: 'Inventory' }}
      />
      <Stack.Screen
        name={STACK_ROUTES.INVENTORY_DETAILS}
        component={InventoryDetailsScreen}
        options={{ title: 'Inventory Details' }}
      />
    </Stack.Navigator>
  );
};

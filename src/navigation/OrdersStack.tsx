import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OrdersScreen } from '../features/orders/screens/OrdersScreen';
import { STACK_ROUTES } from '../shared/constants/routes';
import { OrdersStackParamList } from './types';

const Stack = createNativeStackNavigator<OrdersStackParamList>();

export const OrdersStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={STACK_ROUTES.ORDERS_HOME} component={OrdersScreen} options={{ title: 'Orders' }} />
    </Stack.Navigator>
  );
};

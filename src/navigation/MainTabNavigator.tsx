import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  Boxes,
  ClipboardList,
  House,
  Menu,
  ShoppingCart,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_ROUTES } from '../shared/constants/routes';
import { MainTabParamList } from './types';
import { DashboardStack } from './DashboardStack';
import { POSStack } from './POSStack';
import { OrdersStack } from './OrdersStack';
import { InventoryStack } from './InventoryStack';
import { SettingsStack } from './SettingsStack';
import { useAppSelector } from '../app/hooks';
import { resolveTheme } from '../shared/theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator = () => {
  const mode = useAppSelector(state => state.settings.themeMode);
  const systemScheme = useAppSelector(state => state.settings.systemScheme);
  const theme = resolveTheme(mode, systemScheme);
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 10);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const iconMap: Record<
            keyof MainTabParamList,
            React.ComponentType<{ color: string; size: number }>
          > = {
            [TAB_ROUTES.DASHBOARD]: House,
            [TAB_ROUTES.POS]: ShoppingCart,
            [TAB_ROUTES.ORDERS]: ClipboardList,
            [TAB_ROUTES.INVENTORY]: Boxes,
            [TAB_ROUTES.SETTINGS]: Menu,
          };

          const Icon = iconMap[route.name];

          return <Icon size={size - 1} color={color} />;
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: -2 },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.mutedText,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          height: 56 + bottomInset,
          paddingTop: 7,
          paddingBottom: bottomInset,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          backgroundColor: theme.colors.card,
        },
      })}
    >
      <Tab.Screen
        name={TAB_ROUTES.DASHBOARD}
        component={DashboardStack}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name={TAB_ROUTES.POS}
        component={POSStack}
        options={{ title: 'POS' }}
      />
      <Tab.Screen
        name={TAB_ROUTES.ORDERS}
        component={OrdersStack}
        options={{ title: 'Orders' }}
      />
      <Tab.Screen
        name={TAB_ROUTES.INVENTORY}
        component={InventoryStack}
        options={{ title: 'Inventory' }}
      />
      <Tab.Screen
        name={TAB_ROUTES.SETTINGS}
        component={SettingsStack}
        options={{ title: 'More' }}
      />
    </Tab.Navigator>
  );
};

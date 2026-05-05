import { NavigatorScreenParams } from '@react-navigation/native';
import { InventoryItem } from '../features/inventory/types';
import { STACK_ROUTES, TAB_ROUTES } from '../shared/constants/routes';

export type AuthStackParamList = {
  [STACK_ROUTES.LOGIN]: undefined;
  [STACK_ROUTES.FORGOT_PASSWORD]: undefined;
};

export type DashboardStackParamList = {
  [STACK_ROUTES.DASHBOARD_HOME]: undefined;
  [STACK_ROUTES.NOTIFICATIONS_HOME]: undefined;
};

export type POSStackParamList = {
  [STACK_ROUTES.POS_HOME]: undefined;
};

export type OrdersStackParamList = {
  [STACK_ROUTES.ORDERS_HOME]: undefined;
};

export type InventoryStackParamList = {
  [STACK_ROUTES.INVENTORY_HOME]: undefined;
  [STACK_ROUTES.INVENTORY_DETAILS]: { item: InventoryItem };
};

export type ReportsStackParamList = {
  [STACK_ROUTES.REPORTS_HOME]: undefined;
};

export type AttendanceStackParamList = {
  [STACK_ROUTES.ATTENDANCE_HOME]: undefined;
};

export type SettingsStackParamList = {
  [STACK_ROUTES.SETTINGS_HOME]: undefined;
  [STACK_ROUTES.CUSTOMERS_HOME]: undefined;
  [STACK_ROUTES.REPORTS_HOME]: undefined;
  [STACK_ROUTES.ATTENDANCE_HOME]: undefined;
  [STACK_ROUTES.ORDERS_HISTORY]: undefined;
  [STACK_ROUTES.PROFILE_HOME]: undefined;
  [STACK_ROUTES.NOTIFICATIONS_HOME]: undefined;
  [STACK_ROUTES.SETTINGS_DETAILS]: undefined;
  [STACK_ROUTES.ABOUT_HOME]: undefined;
};

export type MainTabParamList = {
  [TAB_ROUTES.DASHBOARD]: NavigatorScreenParams<DashboardStackParamList>;
  [TAB_ROUTES.POS]: NavigatorScreenParams<POSStackParamList>;
  [TAB_ROUTES.ORDERS]: NavigatorScreenParams<OrdersStackParamList>;
  [TAB_ROUTES.INVENTORY]: NavigatorScreenParams<InventoryStackParamList>;
  [TAB_ROUTES.SETTINGS]: NavigatorScreenParams<SettingsStackParamList>;
};

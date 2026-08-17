import { configureStore } from '@reduxjs/toolkit';
import { attendanceReducer } from '../features/attendance/store/attendanceSlice';
import { authReducer } from '../features/authentication/store/authSlice';
import { dashboardReducer } from '../features/dashboard/store/dashboardSlice';
import { inventoryReducer } from '../features/inventory/store/inventorySlice';
import { ordersReducer } from '../features/orders/store/ordersSlice';
import { posReducer } from '../features/pos/store/posSlice';
import { reportsReducer } from '../features/reports/store/reportsSlice';
import { settingsReducer } from '../features/settings/store/settingsSlice';

import { socketMiddleware } from './socketMiddleware';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    pos: posReducer,
    orders: ordersReducer,
    inventory: inventoryReducer,
    reports: reportsReducer,
    attendance: attendanceReducer,
    settings: settingsReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat(socketMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from '../features/authentication/store/authSlice';
import { dashboardReducer } from '../features/dashboard/store/dashboardSlice';
import { posReducer } from '../features/pos/store/posSlice';
import { reportsReducer } from '../features/reports/store/reportsSlice';
import { settingsReducer } from '../features/settings/store/settingsSlice';

import { socketMiddleware } from './socketMiddleware';

// orders/inventory/attendance previously had their own Redux slices here
// (ordersSlice/inventorySlice/attendanceSlice) -- all three were dead mock
// scaffolds (hardcoded fake counts like `pendingOrders: 12`) with zero real
// consumers anywhere in the app; their actual screens fetch live data
// through their own services instead. Removed rather than left as a trap
// for a future screen to wire up and silently show fake numbers again.
export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    pos: posReducer,
    reports: reportsReducer,
    settings: settingsReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat(socketMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

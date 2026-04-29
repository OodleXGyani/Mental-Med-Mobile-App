import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { dashboardService } from '../services/dashboardService';

type DashboardState = {
  totalSales: number;
  pendingOrders: number;
  lowStockItems: number;
  loading: boolean;
};

const initialState: DashboardState = {
  totalSales: 0,
  pendingOrders: 0,
  lowStockItems: 0,
  loading: false,
};

export const fetchDashboardStats = createAsyncThunk('dashboard/fetchStats', async () => {
  return dashboardService.fetchStats();
});

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchDashboardStats.pending, state => {
        state.loading = true;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.totalSales = action.payload.totalSales;
        state.pendingOrders = action.payload.pendingOrders;
        state.lowStockItems = action.payload.lowStockItems;
      })
      .addCase(fetchDashboardStats.rejected, state => {
        state.loading = false;
      });
  },
});

export const dashboardReducer = dashboardSlice.reducer;

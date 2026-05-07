import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { dashboardService } from '../services/dashboardService';
import type {
  DashboardRecentSale,
  DashboardStats,
} from '../services/dashboardService';

type DashboardState = {
  summary: DashboardStats;
  recentSales: DashboardRecentSale[];
  pendingOrders: number;
  loading: boolean;
};

const initialState: DashboardState = {
  summary: {
    todaySales: 0,
    transactions: 0,
    pendingOrders: 0,
    lowStock: 0,
    staffPresent: {
      present: 0,
      total: 0,
      display: '0/0',
    },
    pendingApprovals: 0,
  },
  recentSales: [],
  pendingOrders: 0,
  loading: false,
};

export const fetchDashboardData = createAsyncThunk(
  'dashboard/fetchData',
  async () => {
    const [summary, recentSales] = await Promise.all([
      dashboardService.fetchStats(),
      dashboardService.fetchRecentSales(),
    ]);

    return { summary, recentSales };
  },
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchDashboardData.pending, state => {
        state.loading = true;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload.summary;
        state.recentSales = action.payload.recentSales;
        state.pendingOrders = action.payload.summary.pendingOrders;
      })
      .addCase(fetchDashboardData.rejected, state => {
        state.loading = false;
      });
  },
});

export const dashboardReducer = dashboardSlice.reducer;

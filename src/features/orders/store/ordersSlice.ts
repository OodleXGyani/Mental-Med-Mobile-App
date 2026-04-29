import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type OrdersState = {
  pendingOrders: number;
};

const initialState: OrdersState = {
  pendingOrders: 12,
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setPendingOrders: (state, action: PayloadAction<number>) => {
      state.pendingOrders = action.payload;
    },
  },
});

export const { setPendingOrders } = ordersSlice.actions;
export const ordersReducer = ordersSlice.reducer;

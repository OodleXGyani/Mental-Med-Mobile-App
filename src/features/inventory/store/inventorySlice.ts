import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type InventoryState = {
  lowStockCount: number;
};

const initialState: InventoryState = {
  lowStockCount: 7,
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    setLowStockCount: (state, action: PayloadAction<number>) => {
      state.lowStockCount = action.payload;
    },
  },
});

export const { setLowStockCount } = inventorySlice.actions;
export const inventoryReducer = inventorySlice.reducer;

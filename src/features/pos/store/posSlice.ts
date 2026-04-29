import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type POSState = {
  currentBillId: string | null;
  total: number;
};

const initialState: POSState = {
  currentBillId: 'draft-1',
  total: 0,
};

const posSlice = createSlice({
  name: 'pos',
  initialState,
  reducers: {
    setBillTotal: (state, action: PayloadAction<number>) => {
      state.total = action.payload;
    },
  },
});

export const { setBillTotal } = posSlice.actions;
export const posReducer = posSlice.reducer;

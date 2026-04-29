import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type ReportsState = {
  lastGeneratedAt: string | null;
};

const initialState: ReportsState = {
  lastGeneratedAt: null,
};

const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    setLastGeneratedAt: (state, action: PayloadAction<string>) => {
      state.lastGeneratedAt = action.payload;
    },
  },
});

export const { setLastGeneratedAt } = reportsSlice.actions;
export const reportsReducer = reportsSlice.reducer;

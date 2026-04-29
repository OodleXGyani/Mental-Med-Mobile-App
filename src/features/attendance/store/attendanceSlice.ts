import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type AttendanceState = {
  presentCount: number;
};

const initialState: AttendanceState = {
  presentCount: 24,
};

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    setPresentCount: (state, action: PayloadAction<number>) => {
      state.presentCount = action.payload;
    },
  },
});

export const { setPresentCount } = attendanceSlice.actions;
export const attendanceReducer = attendanceSlice.reducer;

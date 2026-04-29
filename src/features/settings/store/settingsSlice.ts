import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ThemeMode } from '../../../shared/theme';

type SettingsState = {
  themeMode: ThemeMode;
  systemScheme: 'light' | 'dark' | null;
};

const initialState: SettingsState = {
  themeMode: 'system',
  systemScheme: 'light',
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      state.themeMode = action.payload;
    },
    setSystemScheme: (state, action: PayloadAction<'light' | 'dark' | null>) => {
      state.systemScheme = action.payload;
    },
  },
});

export const { setThemeMode, setSystemScheme } = settingsSlice.actions;
export const settingsReducer = settingsSlice.reducer;

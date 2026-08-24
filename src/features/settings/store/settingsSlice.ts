import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ThemeMode } from '../../../shared/theme';
import { settingsStorage } from '../services/settingsStorage';

type SettingsState = {
  themeMode: ThemeMode;
  systemScheme: 'light' | 'dark' | null;
  pushNotificationsEnabled: boolean;
  autoPrintEnabled: boolean;
  hydrated: boolean;
};

const initialState: SettingsState = {
  themeMode: 'system',
  systemScheme: 'light',
  pushNotificationsEnabled: true,
  autoPrintEnabled: false,
  hydrated: false,
};

export const bootstrapSettings = createAsyncThunk(
  'settings/bootstrap',
  async () => settingsStorage.load(),
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      state.themeMode = action.payload;
      void settingsStorage.save({
        themeMode: state.themeMode,
        pushNotificationsEnabled: state.pushNotificationsEnabled,
        autoPrintEnabled: state.autoPrintEnabled,
      });
    },
    setSystemScheme: (state, action: PayloadAction<'light' | 'dark' | null>) => {
      state.systemScheme = action.payload;
    },
    setPushNotificationsEnabled: (state, action: PayloadAction<boolean>) => {
      state.pushNotificationsEnabled = action.payload;
      void settingsStorage.save({
        themeMode: state.themeMode,
        pushNotificationsEnabled: state.pushNotificationsEnabled,
        autoPrintEnabled: state.autoPrintEnabled,
      });
    },
    setAutoPrintEnabled: (state, action: PayloadAction<boolean>) => {
      state.autoPrintEnabled = action.payload;
      void settingsStorage.save({
        themeMode: state.themeMode,
        pushNotificationsEnabled: state.pushNotificationsEnabled,
        autoPrintEnabled: state.autoPrintEnabled,
      });
    },
  },
  extraReducers: builder => {
    builder.addCase(bootstrapSettings.fulfilled, (state, action) => {
      state.themeMode = action.payload.themeMode;
      state.pushNotificationsEnabled = action.payload.pushNotificationsEnabled;
      state.autoPrintEnabled = action.payload.autoPrintEnabled;
      state.hydrated = true;
    });
    builder.addCase(bootstrapSettings.rejected, state => {
      state.hydrated = true;
    });
  },
});

export const {
  setThemeMode,
  setSystemScheme,
  setPushNotificationsEnabled,
  setAutoPrintEnabled,
} = settingsSlice.actions;
export const settingsReducer = settingsSlice.reducer;

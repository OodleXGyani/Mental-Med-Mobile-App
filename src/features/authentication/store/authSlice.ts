import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { authService, LoginPayload } from '../services/authService';

type AuthState = {
  isAuthenticated: boolean;
  token: string | null;
  loading: boolean;
  error: string | null;
};

const initialState: AuthState = {
  isAuthenticated: true,
  token: 'demo-session-token',
  loading: false,
  error: null,
};

export const loginThunk = createAsyncThunk(
  'auth/login',
  async (payload: LoginPayload) => {
    const token = await authService.login(payload);
    return token;
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: state => {
      state.isAuthenticated = false;
      state.token = null;
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loginThunk.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Unable to login';
      });
  },
});

export const { logout } = authSlice.actions;
export const authReducer = authSlice.reducer;

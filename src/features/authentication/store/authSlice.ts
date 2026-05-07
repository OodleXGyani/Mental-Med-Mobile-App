import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  authService,
  authStorage,
  LoginPayload,
  LoginSession,
} from '../services/authService';

type AuthState = {
  isAuthenticated: boolean;
  token: string | null;
  session: LoginSession | null;
  loading: boolean;
  error: string | null;
  hydrated: boolean;
};

const initialState: AuthState = {
  isAuthenticated: false,
  token: null,
  session: null,
  loading: false,
  error: null,
  hydrated: false,
};

export const bootstrapAuth = createAsyncThunk<LoginSession | null>(
  'auth/bootstrap',
  async () => {
    return authStorage.loadSession();
  },
);

export const loginThunk = createAsyncThunk<
  LoginSession,
  LoginPayload,
  { rejectValue: string }
>('auth/login', async (payload, { rejectWithValue }) => {
  try {
    return await authService.login(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to login';
    return rejectWithValue(message);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: state => {
      state.isAuthenticated = false;
      state.token = null;
      state.session = null;
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(bootstrapAuth.pending, state => {
        state.loading = true;
      })
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.hydrated = true;

        if (action.payload) {
          state.token = action.payload.sid;
          state.session = action.payload;
          state.isAuthenticated = true;
        }
      })
      .addCase(bootstrapAuth.rejected, state => {
        state.loading = false;
        state.hydrated = true;
      })
      .addCase(loginThunk.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.sid;
        state.session = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload ?? action.error.message ?? 'Unable to login';
      });
  },
});

export const { logout } = authSlice.actions;
export const authReducer = authSlice.reducer;

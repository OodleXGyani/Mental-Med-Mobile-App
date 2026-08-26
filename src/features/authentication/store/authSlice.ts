import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  authService,
  authStorage,
  LoginPayload,
  LoginSession,
  SaasVerificationRequired,
} from '../services/authService';

type AuthState = {
  isAuthenticated: boolean;
  token: string | null;
  session: LoginSession | null;
  loading: boolean;
  error: string | null;
  hydrated: boolean;
  
  // Tenant Auth Flow States
  authStep: 'IDLE' | 'AWAITING_OTP' | 'AUTHENTICATED';
  handshakeData: SaasVerificationRequired | null;
  loginEmail: string | null;
};

const initialState: AuthState = {
  isAuthenticated: false,
  token: null,
  session: null,
  loading: false,
  error: null,
  hydrated: false,
  
  authStep: 'IDLE',
  handshakeData: null,
  loginEmail: null,
};

import { setApiBaseUrl } from '../../../shared/constants/apiConfig';

export const bootstrapAuth = createAsyncThunk<LoginSession | null>(
  'auth/bootstrap',
  async () => {
    const session = await authStorage.loadSession();
    if (session?.tenantUrl) {
      setApiBaseUrl(session.tenantUrl);
    }
    return session;
  }
);

// Step 1: Handshake
export const loginHandshakeThunk = createAsyncThunk<
  any,
  LoginPayload,
  { rejectValue: string }
>('auth/loginHandshake', async (payload, { rejectWithValue }) => {
  try {
    const response = await authService.loginHandshake(payload);
    
    if ('status_val' in response && response.status_val === 'verification_required') {
      return { step: 'AWAITING_OTP', data: response, email: payload.email };
    }
    
    // If no verification needed, proceed directly to tenant login
    if ('tenant_url' in response && response.status === 'success' && response.tenant_url) {
      const session = await authService.tenantLogin(
        response.login_url,
        response.tenant_url,
        response.username,
        response.password
      );
      return { step: 'AUTHENTICATED', session };
    }
    
    return rejectWithValue('Unexpected response from server.');
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Unable to login');
  }
});

// Step 2: Verify OTP
export const verifyOtpThunk = createAsyncThunk<
  any,
  { email: string; otpToken: string; phoneOtp?: string; emailOtp?: string },
  { rejectValue: string }
>('auth/verifyOtp', async (payload, { rejectWithValue }) => {
  try {
    const verifiedResponse = await authService.verifyLoginOtp(
      payload.email,
      payload.otpToken,
      payload.phoneOtp,
      payload.emailOtp
    );
    
    // Once verified, login to tenant
    const session = await authService.tenantLogin(
      verifiedResponse.login_url,
      verifiedResponse.tenant_url,
      verifiedResponse.username,
      verifiedResponse.password
    );
    
    return session;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Invalid OTP');
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
      state.authStep = 'IDLE';
      state.handshakeData = null;
      state.loginEmail = null;
    },
    resetAuthStep: state => {
      state.authStep = 'IDLE';
      state.handshakeData = null;
      state.error = null;
    }
  },
  extraReducers: builder => {
    builder
      // Bootstrap
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
          state.authStep = 'AUTHENTICATED';
        }
      })
      .addCase(bootstrapAuth.rejected, state => {
        state.loading = false;
        state.hydrated = true;
      })
      
      // Handshake
      .addCase(loginHandshakeThunk.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginHandshakeThunk.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.step === 'AWAITING_OTP') {
          state.authStep = 'AWAITING_OTP';
          state.handshakeData = action.payload.data;
          state.loginEmail = action.payload.email;
        } else if (action.payload.step === 'AUTHENTICATED') {
          state.token = action.payload.session.sid;
          state.session = action.payload.session;
          state.isAuthenticated = true;
          state.authStep = 'AUTHENTICATED';
        }
      })
      .addCase(loginHandshakeThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Unable to complete handshake';
      })
      
      // Verify OTP
      .addCase(verifyOtpThunk.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtpThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.sid;
        state.session = action.payload;
        state.isAuthenticated = true;
        state.authStep = 'AUTHENTICATED';
        state.handshakeData = null;
      })
      .addCase(verifyOtpThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Invalid OTP';
      });
  },
});

export const { logout, resetAuthStep } = authSlice.actions;
export const authReducer = authSlice.reducer;

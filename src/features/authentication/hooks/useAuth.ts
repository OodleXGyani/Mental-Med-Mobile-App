import { useCallback } from 'react';
import { authStorage } from '../services/authService';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { loginHandshakeThunk, verifyOtpThunk, logout, resetAuthStep } from '../store/authSlice';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(state => state.auth);

  const loginHandshake = useCallback(
    (email: string, password: string) => {
      return dispatch(loginHandshakeThunk({ email, password }));
    },
    [dispatch],
  );
  
  const verifyOtp = useCallback(
    (email: string, otpToken: string, phoneOtp?: string, emailOtp?: string) => {
      return dispatch(verifyOtpThunk({ email, otpToken, phoneOtp, emailOtp }));
    },
    [dispatch],
  );

  const signOut = useCallback(async () => {
    await authStorage.clearSession();
    dispatch(logout());
  }, [dispatch]);
  
  const resetStep = useCallback(() => {
    dispatch(resetAuthStep());
  }, [dispatch]);

  return {
    ...auth,
    loginHandshake,
    verifyOtp,
    resetStep,
    signOut,
  };
};

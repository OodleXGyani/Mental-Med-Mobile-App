import { useCallback } from 'react';
import { getApp } from '@react-native-firebase/app';
import { getMessaging, getToken } from '@react-native-firebase/messaging';
import { authService, authStorage } from '../services/authService';
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
    // Best-effort server-side cleanup -- must happen BEFORE the local
    // session is cleared: deleteFCMToken relies on the still-valid sid
    // (it scopes by frappe.session.user), and logout() invalidates that
    // sid. Previously this only cleared local storage, so the server-side
    // session and this device's push token both stayed live indefinitely
    // after "signing out".
    try {
      const token = await getToken(getMessaging(getApp()));
      if (token) {
        await authService.deleteFCMToken(token);
      }
    } catch {
      // FCM may be unavailable (simulator, permission denied) -- not fatal.
    }
    await authService.logout();

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

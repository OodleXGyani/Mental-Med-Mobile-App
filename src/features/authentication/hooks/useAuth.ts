import { useCallback } from 'react';
import { authStorage } from '../services/authService';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { loginThunk, logout } from '../store/authSlice';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(state => state.auth);

  const login = useCallback(
    (email: string, password: string) => {
      return dispatch(loginThunk({ email, password }));
    },
    [dispatch],
  );

  const signOut = useCallback(async () => {
    await authStorage.clearSession();
    dispatch(logout());
  }, [dispatch]);

  return {
    ...auth,
    login,
    signOut,
  };
};

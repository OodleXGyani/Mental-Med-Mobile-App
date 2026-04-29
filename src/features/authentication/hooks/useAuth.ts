import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { loginThunk, logout } from '../store/authSlice';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(state => state.auth);

  const login = (username: string, password: string) => {
    return dispatch(loginThunk({ username, password }));
  };

  const signOut = () => {
    dispatch(logout());
  };

  return {
    ...auth,
    login,
    signOut,
  };
};

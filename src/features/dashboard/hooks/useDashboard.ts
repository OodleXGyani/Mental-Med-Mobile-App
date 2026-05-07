import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { useAuth } from '../../authentication/hooks/useAuth';
import { fetchDashboardData } from '../store/dashboardSlice';

export const useDashboard = () => {
  const dispatch = useAppDispatch();
  const dashboard = useAppSelector(state => state.dashboard);
  const { signOut } = useAuth();

  useEffect(() => {
    dispatch(fetchDashboardData())
      .unwrap()
      .catch(async error => {
        const message =
          typeof error === 'object' && error && 'message' in error
            ? String((error as { message?: unknown }).message ?? '')
            : '';

        if (message === 'AUTH_SESSION_EXPIRED') {
          await signOut();
        }
      });
  }, [dispatch, signOut]);

  return dashboard;
};

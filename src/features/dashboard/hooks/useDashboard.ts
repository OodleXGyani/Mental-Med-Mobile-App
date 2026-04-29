import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchDashboardStats } from '../store/dashboardSlice';

export const useDashboard = () => {
  const dispatch = useAppDispatch();
  const dashboard = useAppSelector(state => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  return dashboard;
};

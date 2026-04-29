import { useAppSelector } from '../../../app/hooks';

export const useReports = () => {
  return useAppSelector(state => state.reports);
};

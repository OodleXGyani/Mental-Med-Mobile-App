import { useAppSelector } from '../../../app/hooks';

export const useAttendance = () => {
  return useAppSelector(state => state.attendance);
};

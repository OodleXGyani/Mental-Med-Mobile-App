import { useAppSelector } from '../../../app/hooks';

export const useOrders = () => {
  return useAppSelector(state => state.orders);
};

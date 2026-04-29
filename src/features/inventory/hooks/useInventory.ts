import { useAppSelector } from '../../../app/hooks';

export const useInventory = () => {
  return useAppSelector(state => state.inventory);
};

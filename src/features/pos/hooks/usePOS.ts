import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { setBillTotal } from '../store/posSlice';

export const usePOS = () => {
  const dispatch = useAppDispatch();
  const pos = useAppSelector(state => state.pos);

  return {
    ...pos,
    updateBillTotal: (value: number) => dispatch(setBillTotal(value)),
  };
};

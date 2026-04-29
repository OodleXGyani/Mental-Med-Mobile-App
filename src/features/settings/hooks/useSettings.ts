import { ThemeMode } from '../../../shared/theme';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { setThemeMode } from '../store/settingsSlice';

export const useSettings = () => {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(state => state.settings);

  const updateThemeMode = (mode: ThemeMode) => {
    dispatch(setThemeMode(mode));
  };

  return {
    ...settings,
    updateThemeMode,
  };
};

import { ThemeMode } from '../../../shared/theme';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import {
  setThemeMode,
  setPushNotificationsEnabled,
  setAutoPrintEnabled,
} from '../store/settingsSlice';

export const useSettings = () => {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(state => state.settings);

  const updateThemeMode = (mode: ThemeMode) => {
    dispatch(setThemeMode(mode));
  };

  const updatePushNotificationsEnabled = (enabled: boolean) => {
    dispatch(setPushNotificationsEnabled(enabled));
  };

  const updateAutoPrintEnabled = (enabled: boolean) => {
    dispatch(setAutoPrintEnabled(enabled));
  };

  return {
    ...settings,
    updateThemeMode,
    updatePushNotificationsEnabled,
    updateAutoPrintEnabled,
  };
};

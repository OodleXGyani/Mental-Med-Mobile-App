import { useAppSelector } from '../../app/hooks';
import { resolveTheme } from './index';

export const useAppTheme = () => {
  const mode = useAppSelector(state => state.settings.themeMode);
  const systemScheme = useAppSelector(state => state.settings.systemScheme);

  return resolveTheme(mode, systemScheme);
};

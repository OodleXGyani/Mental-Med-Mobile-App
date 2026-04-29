import { ThemeMode } from '../../../shared/theme';

export const settingsService = {
  saveThemeMode: async (mode: ThemeMode): Promise<ThemeMode> => {
    await new Promise<void>(resolve => setTimeout(() => resolve(), 150));
    return mode;
  },
};

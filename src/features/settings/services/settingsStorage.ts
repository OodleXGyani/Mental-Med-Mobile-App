import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeMode } from '../../../shared/theme';

export type PersistedSettings = {
  themeMode: ThemeMode;
  pushNotificationsEnabled: boolean;
  autoPrintEnabled: boolean;
};

const STORAGE_KEY = '@meds/settings';

const DEFAULTS: PersistedSettings = {
  themeMode: 'system',
  pushNotificationsEnabled: true,
  autoPrintEnabled: false,
};

// Previously nothing here actually persisted -- theme mode lived only in
// Redux memory (reset to "system" on every app restart), and the
// Notifications/Auto-Print toggles on the Settings screen were plain
// useState with no storage and no real effect at all.
export const settingsStorage = {
  load: async (): Promise<PersistedSettings> => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULTS;
      const parsed = JSON.parse(raw);
      return { ...DEFAULTS, ...parsed };
    } catch {
      return DEFAULTS;
    }
  },

  save: async (settings: PersistedSettings): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Best-effort -- the in-memory Redux value still applies for this session.
    }
  },
};

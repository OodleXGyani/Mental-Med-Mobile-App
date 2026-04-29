import { palette } from './colors';

export type ThemeMode = 'system' | 'light' | 'dark';

export type AppTheme = {
  dark: boolean;
  colors: {
    background: string;
    card: string;
    text: string;
    mutedText: string;
    border: string;
    primary: string;
    success: string;
    warning: string;
    danger: string;
  };
};

const lightTheme: AppTheme = {
  dark: false,
  colors: {
    background: '#F7FAFC',
    card: palette.white,
    text: palette.gray900,
    mutedText: palette.gray700,
    border: palette.gray200,
    primary: palette.blue600,
    success: palette.green500,
    warning: palette.orange500,
    danger: palette.red500,
  },
};

const darkTheme: AppTheme = {
  dark: true,
  colors: {
    background: '#101828',
    card: '#1E293B',
    text: '#E2E8F0',
    mutedText: '#CBD5E1',
    border: '#334155',
    primary: '#60A5FA',
    success: '#4ADE80',
    warning: '#FBBF24',
    danger: '#F87171',
  },
};

export const resolveTheme = (
  mode: ThemeMode,
  systemScheme: 'light' | 'dark' | null | undefined,
): AppTheme => {
  if (mode === 'system') {
    return systemScheme === 'dark' ? darkTheme : lightTheme;
  }

  return mode === 'dark' ? darkTheme : lightTheme;
};

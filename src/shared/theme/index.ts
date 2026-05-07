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
    background: '#F5F5F6',
    card: palette.white,
    text: '#2A2A2A',
    mutedText: '#9B8378',
    border: '#E8E3DE',
    primary: '#1CA39A',
    success: '#1CA39A',
    warning: '#F08C00',
    danger: '#E03131',
  },
};

const darkTheme: AppTheme = {
  dark: true,
  colors: {
    background: '#141414',
    card: '#1F1F1F',
    text: '#F3F4F6',
    mutedText: '#B8A99E',
    border: '#2F2B28',
    primary: '#36B5AB',
    success: '#36B5AB',
    warning: '#F2A94B',
    danger: '#F36A6A',
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

export { useAppTheme } from './useAppTheme';

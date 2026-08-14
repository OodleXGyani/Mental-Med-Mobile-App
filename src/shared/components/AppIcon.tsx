import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import * as icons from 'lucide-react-native';
import { useAppTheme } from '../../shared/theme';

export type IconName = keyof typeof icons;

export interface AppIconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  strokeWidth?: number;
}

export const AppIcon: React.FC<AppIconProps> = ({
  name,
  size = 24,
  color,
  style,
  strokeWidth = 2,
}) => {
  const theme = useAppTheme();
  const IconComponent = icons[name] as React.FC<any>;

  if (!IconComponent) {
    console.warn(`Icon "${name}" does not exist in lucide-react-native.`);
    return null;
  }

  const iconColor = color || theme.colors.text;

  return <IconComponent size={size} color={iconColor} strokeWidth={strokeWidth} style={style} />;
};

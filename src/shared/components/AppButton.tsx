import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { useAppTheme } from '../theme';

type Props = {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  disabled?: boolean;
};

export const AppButton = ({
  title,
  onPress,
  style,
  disabled = false,
}: Props) => {
  const theme = useAppTheme();

  return (
    <Pressable
      style={[
        styles.button,
        {
          backgroundColor: disabled
            ? theme.colors.border
            : theme.colors.primary,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

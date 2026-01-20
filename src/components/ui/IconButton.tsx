import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, PressableProps } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

type IconButtonSize = 'small' | 'medium' | 'large';
type IconButtonVariant = 'default' | 'primary' | 'ghost';

interface IconButtonProps extends Omit<PressableProps, 'style'> {
  icon: string;
  size?: IconButtonSize;
  variant?: IconButtonVariant;
  style?: ViewStyle;
}

export function IconButton({
  icon,
  size = 'medium',
  variant = 'default',
  disabled,
  style,
  ...props
}: IconButtonProps) {
  const theme = useTheme();

  const getSize = () => {
    switch (size) {
      case 'small':
        return { buttonSize: 32, iconSize: 16 };
      case 'medium':
        return { buttonSize: 40, iconSize: 20 };
      case 'large':
        return { buttonSize: 48, iconSize: 24 };
      default:
        return { buttonSize: 40, iconSize: 20 };
    }
  };

  const { buttonSize, iconSize } = getSize();

  const getBackgroundColor = () => {
    if (disabled) return theme.colors.borderLight;

    switch (variant) {
      case 'primary':
        return theme.colors.primary;
      case 'ghost':
        return 'transparent';
      default:
        return theme.colors.borderLight;
    }
  };

  const getIconColor = () => {
    if (disabled) return theme.colors.textTertiary;

    switch (variant) {
      case 'primary':
        return theme.colors.textInverse;
      case 'ghost':
        return theme.colors.text;
      default:
        return theme.colors.text;
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        {
          width: buttonSize,
          height: buttonSize,
          borderRadius: buttonSize / 2,
          backgroundColor: getBackgroundColor(),
          opacity: pressed ? 0.7 : 1,
        },
        style,
      ]}
      disabled={disabled}
      {...props}
    >
      <Text style={[styles.icon, { fontSize: iconSize, color: getIconColor() }]}>
        {icon}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {},
});

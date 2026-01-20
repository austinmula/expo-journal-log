import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, Pressable, PressableProps } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export function Card({ children, style, elevated = false, padding = 'medium' }: CardProps) {
  const theme = useTheme();

  const getPadding = (): number => {
    switch (padding) {
      case 'none':
        return 0;
      case 'small':
        return theme.spacing.sm;
      case 'medium':
        return theme.spacing.md;
      case 'large':
        return theme.spacing.lg;
      default:
        return theme.spacing.md;
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: elevated ? theme.colors.surfaceElevated : theme.colors.surface,
          borderColor: theme.colors.borderLight,
          padding: getPadding(),
          shadowColor: theme.colors.shadow,
        },
        elevated && styles.elevated,
        style,
      ]}
    >
      {children}
    </View>
  );
}

interface PressableCardProps extends CardProps, Omit<PressableProps, 'style' | 'children'> {}

export function PressableCard({
  children,
  style,
  elevated = false,
  padding = 'medium',
  ...pressableProps
}: PressableCardProps) {
  const theme = useTheme();

  const getPadding = (): number => {
    switch (padding) {
      case 'none':
        return 0;
      case 'small':
        return theme.spacing.sm;
      case 'medium':
        return theme.spacing.md;
      case 'large':
        return theme.spacing.lg;
      default:
        return theme.spacing.md;
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: elevated ? theme.colors.surfaceElevated : theme.colors.surface,
          borderColor: theme.colors.borderLight,
          padding: getPadding(),
          shadowColor: theme.colors.shadow,
          opacity: pressed ? 0.9 : 1,
          transform: pressed ? [{ scale: 0.98 }] : [{ scale: 1 }],
        },
        elevated && styles.elevated,
        style,
      ]}
      {...pressableProps}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
  },
  elevated: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
});

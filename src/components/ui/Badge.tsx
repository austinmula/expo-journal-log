import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

type BadgeSize = 'small' | 'medium' | 'large';

interface BadgeProps {
  label: string;
  color?: string;
  size?: BadgeSize;
  style?: ViewStyle;
  onPress?: () => void;
  onRemove?: () => void;
}

export function Badge({
  label,
  color,
  size = 'medium',
  style,
  onPress,
  onRemove,
}: BadgeProps) {
  const theme = useTheme();

  const backgroundColor = color
    ? `${color}20` // 12.5% opacity
    : theme.colors.primaryLight;

  const textColor = color || theme.colors.primary;

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 2,
          paddingHorizontal: 6,
          fontSize: 10,
        };
      case 'medium':
        return {
          paddingVertical: 4,
          paddingHorizontal: 8,
          fontSize: 12,
        };
      case 'large':
        return {
          paddingVertical: 6,
          paddingHorizontal: 12,
          fontSize: 14,
        };
      default:
        return {
          paddingVertical: 4,
          paddingHorizontal: 8,
          fontSize: 12,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const content = (
    <View
      style={[
        styles.badge,
        {
          backgroundColor,
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: textColor,
            fontSize: sizeStyles.fontSize,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {onRemove && (
        <Pressable
          onPress={onRemove}
          hitSlop={8}
          style={styles.removeButton}
        >
          <Text
            style={[
              styles.removeText,
              {
                color: textColor,
                fontSize: sizeStyles.fontSize,
              },
            ]}
          >
            x
          </Text>
        </Pressable>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 100,
  },
  label: {
    fontWeight: '500',
  },
  removeButton: {
    marginLeft: 4,
  },
  removeText: {
    fontWeight: '600',
  },
});

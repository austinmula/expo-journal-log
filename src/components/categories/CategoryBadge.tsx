import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Category } from '@/types';

type BadgeSize = 'small' | 'medium' | 'large';

interface CategoryBadgeProps {
  category: Category;
  size?: BadgeSize;
  selected?: boolean;
  showIcon?: boolean;
  style?: ViewStyle;
  onPress?: () => void;
}

export function CategoryBadge({
  category,
  size = 'medium',
  selected = false,
  showIcon = true,
  style,
  onPress,
}: CategoryBadgeProps) {
  const theme = useTheme();

  const backgroundColor = selected
    ? `${category.color}30` // 19% opacity when selected
    : `${category.color}15`; // 8% opacity normally

  const borderColor = selected ? category.color : 'transparent';

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 3,
          paddingHorizontal: 8,
          fontSize: 11,
          iconSize: 12,
          gap: 3,
        };
      case 'medium':
        return {
          paddingVertical: 5,
          paddingHorizontal: 10,
          fontSize: 13,
          iconSize: 14,
          gap: 4,
        };
      case 'large':
        return {
          paddingVertical: 7,
          paddingHorizontal: 14,
          fontSize: 15,
          iconSize: 16,
          gap: 6,
        };
      default:
        return {
          paddingVertical: 5,
          paddingHorizontal: 10,
          fontSize: 13,
          iconSize: 14,
          gap: 4,
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
          borderColor,
          borderWidth: selected ? 1.5 : 0,
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          gap: sizeStyles.gap,
        },
        style,
      ]}
    >
      {showIcon && category.icon && (
        <Ionicons
          name={category.icon as keyof typeof Ionicons.glyphMap}
          size={sizeStyles.iconSize}
          color={category.color}
        />
      )}
      <Text
        style={[
          styles.label,
          {
            color: category.color,
            fontSize: sizeStyles.fontSize,
          },
        ]}
        numberOfLines={1}
      >
        {category.name}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
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
});

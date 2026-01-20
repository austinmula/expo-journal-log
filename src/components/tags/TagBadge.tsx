import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Tag } from '@/types';

type TagBadgeSize = 'small' | 'medium' | 'large';

interface TagBadgeProps {
  tag: Tag;
  size?: TagBadgeSize;
  onPress?: () => void;
  onRemove?: () => void;
  selected?: boolean;
  style?: ViewStyle;
}

export function TagBadge({
  tag,
  size = 'medium',
  onPress,
  onRemove,
  selected = false,
  style,
}: TagBadgeProps) {
  const theme = useTheme();

  const backgroundColor = selected
    ? `${tag.color}40`
    : `${tag.color}20`;

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: 2, paddingHorizontal: 6, fontSize: 10 };
      case 'medium':
        return { paddingVertical: 4, paddingHorizontal: 10, fontSize: 12 };
      case 'large':
        return { paddingVertical: 6, paddingHorizontal: 14, fontSize: 14 };
    }
  };

  const sizeStyles = getSizeStyles();

  const content = (
    <>
      <Text
        style={[
          styles.label,
          {
            color: tag.color,
            fontSize: sizeStyles.fontSize,
          },
        ]}
        numberOfLines={1}
      >
        {tag.name}
      </Text>
      {onRemove && (
        <Pressable
          onPress={onRemove}
          hitSlop={8}
          style={styles.removeButton}
        >
          <Text style={[styles.removeText, { color: tag.color }]}>x</Text>
        </Pressable>
      )}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.badge,
          {
            backgroundColor,
            paddingVertical: sizeStyles.paddingVertical,
            paddingHorizontal: sizeStyles.paddingHorizontal,
            borderColor: selected ? tag.color : 'transparent',
            borderWidth: 1,
            opacity: pressed ? 0.7 : 1,
          },
          style,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <Pressable
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
      {content}
    </Pressable>
  );
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
    fontSize: 12,
    fontWeight: '600',
  },
});

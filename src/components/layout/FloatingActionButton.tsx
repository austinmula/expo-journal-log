import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface FloatingActionButtonProps {
  icon: string;
  onPress: () => void;
  style?: ViewStyle;
}

export function FloatingActionButton({
  icon,
  onPress,
  style,
}: FloatingActionButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: theme.colors.primary,
          shadowColor: theme.colors.shadow,
          opacity: pressed ? 0.9 : 1,
          transform: pressed ? [{ scale: 0.95 }] : [{ scale: 1 }],
        },
        style,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.icon, { color: theme.colors.textInverse }]}>
        {icon}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
  icon: {
    fontSize: 28,
    fontWeight: '400',
  },
});

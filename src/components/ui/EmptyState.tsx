import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        { padding: theme.spacing.xl },
        style,
      ]}
    >
      {icon && (
        <Text style={[styles.icon, { marginBottom: theme.spacing.md }]}>
          {icon}
        </Text>
      )}
      <Text
        style={[
          styles.title,
          { color: theme.colors.text, marginBottom: theme.spacing.sm },
        ]}
      >
        {title}
      </Text>
      {description && (
        <Text
          style={[
            styles.description,
            { color: theme.colors.textSecondary, marginBottom: theme.spacing.lg },
          ]}
        >
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 280,
  },
});

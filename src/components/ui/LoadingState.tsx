import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface LoadingStateProps {
  message?: string;
  style?: ViewStyle;
}

export function LoadingState({ message, style }: LoadingStateProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        { padding: theme.spacing.xl },
        style,
      ]}
    >
      <ActivityIndicator size="large" color={theme.colors.primary} />
      {message && (
        <Text
          style={[
            styles.message,
            { color: theme.colors.textSecondary, marginTop: theme.spacing.md },
          ]}
        >
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
  },
});

/**
 * BiometricPrompt Component
 * A button to trigger biometric authentication with appropriate icon
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { BiometricType } from '@/types/security';

interface BiometricPromptProps {
  /** Type of biometric available */
  biometricType: BiometricType;
  /** Human-readable name of the biometric */
  biometricName: string;
  /** Callback when button is pressed */
  onPress: () => void;
  /** Whether authentication is in progress */
  loading?: boolean;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Error message to display */
  error?: string;
  /** Whether to show compact version */
  compact?: boolean;
}

export function BiometricPrompt({
  biometricType,
  biometricName,
  onPress,
  loading = false,
  disabled = false,
  error,
  compact = false,
}: BiometricPromptProps) {
  const theme = useTheme();

  const getIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (biometricType) {
      case 'facial':
        return 'scan-outline';
      case 'fingerprint':
        return 'finger-print-outline';
      case 'iris':
        return 'eye-outline';
      default:
        return 'lock-closed-outline';
    }
  };

  if (compact) {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.compactButton,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            opacity: pressed || disabled ? 0.7 : 1,
          },
        ]}
        onPress={onPress}
        disabled={disabled || loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <Ionicons name={getIcon()} size={24} color={theme.colors.primary} />
        )}
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: pressed
              ? theme.colors.primaryLight
              : theme.colors.surface,
            borderColor: theme.colors.primary,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
        onPress={onPress}
        disabled={disabled || loading}
      >
        {loading ? (
          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
            style={styles.icon}
          />
        ) : (
          <Ionicons
            name={getIcon()}
            size={48}
            color={theme.colors.primary}
            style={styles.icon}
          />
        )}
        <Text style={[styles.label, { color: theme.colors.primary }]}>
          {loading ? 'Authenticating...' : `Use ${biometricName}`}
        </Text>
      </Pressable>

      {error && (
        <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 32,
    borderRadius: 16,
    borderWidth: 2,
    minWidth: 200,
  },
  icon: {
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  compactButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

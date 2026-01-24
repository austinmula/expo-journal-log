/**
 * PinInput Component
 * A numeric keypad for entering PIN codes with visual feedback
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Vibration,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

interface PinInputProps {
  /** Length of the PIN (4-6 digits) */
  length?: 4 | 5 | 6;
  /** Callback when PIN is complete */
  onComplete: (pin: string) => void;
  /** Whether to show error state */
  error?: boolean;
  /** Error message to display */
  errorMessage?: string;
  /** Title text above the dots */
  title?: string;
  /** Subtitle text below the title */
  subtitle?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Reset trigger - increment to clear input */
  resetTrigger?: number;
}

const KEYPAD_NUMBERS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'];

export function PinInput({
  length = 4,
  onComplete,
  error = false,
  errorMessage,
  title = 'Enter PIN',
  subtitle,
  disabled = false,
  resetTrigger = 0,
}: PinInputProps) {
  const theme = useTheme();
  const [pin, setPin] = useState('');

  // Reset PIN when resetTrigger changes
  useEffect(() => {
    setPin('');
  }, [resetTrigger]);

  // Handle PIN completion
  useEffect(() => {
    if (pin.length === length) {
      onComplete(pin);
    }
  }, [pin, length, onComplete]);

  const handleKeyPress = useCallback(
    (key: string) => {
      if (disabled) return;

      if (key === 'delete') {
        setPin((prev) => prev.slice(0, -1));
        if (Platform.OS !== 'web') {
          Vibration.vibrate(10);
        }
      } else if (key !== '' && pin.length < length) {
        setPin((prev) => prev + key);
        if (Platform.OS !== 'web') {
          Vibration.vibrate(10);
        }
      }
    },
    [disabled, pin.length, length]
  );

  const renderDots = () => {
    const dots = [];
    for (let i = 0; i < length; i++) {
      const filled = i < pin.length;
      dots.push(
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor: filled
                ? error
                  ? theme.colors.error
                  : theme.colors.primary
                : 'transparent',
              borderColor: error ? theme.colors.error : theme.colors.border,
            },
          ]}
        />
      );
    }
    return dots;
  };

  const renderKey = (key: string, index: number) => {
    if (key === '') {
      return <View key={index} style={styles.emptyKey} />;
    }

    if (key === 'delete') {
      return (
        <Pressable
          key={index}
          style={({ pressed }) => [
            styles.key,
            styles.deleteKey,
            {
              opacity: pressed ? 0.6 : 1,
            },
          ]}
          onPress={() => handleKeyPress(key)}
          disabled={disabled || pin.length === 0}
        >
          <Ionicons
            name="backspace-outline"
            size={28}
            color={
              disabled || pin.length === 0
                ? theme.colors.textTertiary
                : theme.colors.text
            }
          />
        </Pressable>
      );
    }

    return (
      <Pressable
        key={index}
        style={({ pressed }) => [
          styles.key,
          {
            backgroundColor: pressed
              ? theme.colors.primaryLight
              : 'transparent',
            borderColor: theme.colors.border,
          },
        ]}
        onPress={() => handleKeyPress(key)}
        disabled={disabled}
      >
        <Text
          style={[
            styles.keyText,
            {
              color: disabled ? theme.colors.textTertiary : theme.colors.text,
            },
          ]}
        >
          {key}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>

      <View style={styles.dotsContainer}>{renderDots()}</View>

      {errorMessage && (
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {errorMessage}
        </Text>
      )}

      <View style={styles.keypad}>
        {KEYPAD_NUMBERS.map((key, index) => renderKey(key, index))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 300,
    gap: 16,
    marginTop: 24,
  },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteKey: {
    borderWidth: 0,
  },
  emptyKey: {
    width: 72,
    height: 72,
  },
  keyText: {
    fontSize: 28,
    fontWeight: '500',
  },
});

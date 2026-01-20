import React, { forwardRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface TextAreaProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  minHeight?: number;
}

export const TextArea = forwardRef<TextInput, TextAreaProps>(
  ({ label, error, containerStyle, minHeight = 120, style, ...props }, ref) => {
    const theme = useTheme();

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <Text
            style={[
              styles.label,
              {
                color: theme.colors.text,
                marginBottom: theme.spacing.xs,
              },
            ]}
          >
            {label}
          </Text>
        )}
        <TextInput
          ref={ref}
          multiline
          textAlignVertical="top"
          style={[
            styles.textArea,
            {
              backgroundColor: theme.colors.surface,
              borderColor: error ? theme.colors.error : theme.colors.border,
              color: theme.colors.text,
              padding: theme.spacing.md,
              minHeight,
            },
            style,
          ]}
          placeholderTextColor={theme.colors.textTertiary}
          {...props}
        />
        {error && (
          <Text
            style={[
              styles.error,
              {
                color: theme.colors.error,
                marginTop: theme.spacing.xs,
              },
            ]}
          >
            {error}
          </Text>
        )}
      </View>
    );
  }
);

TextArea.displayName = 'TextArea';

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
    lineHeight: 24,
  },
  error: {
    fontSize: 12,
  },
});

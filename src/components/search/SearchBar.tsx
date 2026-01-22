import React, { forwardRef } from 'react';
import {
  View,
  TextInput,
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  autoFocus?: boolean;
  style?: ViewStyle;
}

export const SearchBar = forwardRef<TextInput, SearchBarProps>(
  (
    {
      value,
      onChangeText,
      placeholder = 'Search entries...',
      onClear,
      onFocus,
      onBlur,
      autoFocus = false,
      style,
    },
    ref
  ) => {
    const theme = useTheme();

    const handleClear = () => {
      onChangeText('');
      onClear?.();
    };

    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
          style,
        ]}
      >
        <Text style={[styles.searchIcon, { color: theme.colors.textTertiary }]}>
          search
        </Text>
        <TextInput
          ref={ref}
          style={[
            styles.input,
            { color: theme.colors.text },
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textTertiary}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus={autoFocus}
          onFocus={onFocus}
          onBlur={onBlur}
          returnKeyType="search"
        />
        {value.length > 0 && (
          <Pressable
            onPress={handleClear}
            hitSlop={8}
            style={({ pressed }) => [
              styles.clearButton,
              {
                backgroundColor: theme.colors.borderLight,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text style={[styles.clearIcon, { color: theme.colors.textSecondary }]}>
              x
            </Text>
          </Pressable>
        )}
      </View>
    );
  }
);

SearchBar.displayName = 'SearchBar';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  clearButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearIcon: {
    fontSize: 12,
    fontWeight: '600',
  },
});

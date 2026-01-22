import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface RecentSearchesProps {
  searches: string[];
  onSearchSelect: (search: string) => void;
  onClear: () => void;
  style?: ViewStyle;
}

export function RecentSearches({
  searches,
  onSearchSelect,
  onClear,
  style,
}: RecentSearchesProps) {
  const theme = useTheme();

  if (searches.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.textSecondary }]}>
          Recent Searches
        </Text>
        <Pressable onPress={onClear} hitSlop={8}>
          <Text style={[styles.clearText, { color: theme.colors.primary }]}>
            Clear
          </Text>
        </Pressable>
      </View>

      <View style={styles.searchList}>
        {searches.map((search, index) => (
          <Pressable
            key={`${search}-${index}`}
            onPress={() => onSearchSelect(search)}
            style={({ pressed }) => [
              styles.searchItem,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.borderLight,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text style={[styles.clockIcon, { color: theme.colors.textTertiary }]}>
              clock
            </Text>
            <Text
              style={[styles.searchText, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {search}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearText: {
    fontSize: 13,
    fontWeight: '500',
  },
  searchList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  clockIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  searchText: {
    fontSize: 14,
    maxWidth: 150,
  },
});

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Keyboard,
  Pressable,
  Text,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useSearch } from '@/hooks/useSearch';
import { useTagStore } from '@/stores';
import { SearchBar, SearchFilters, SearchResults, RecentSearches } from '@/components/search';
import { LoadingState } from '@/components/ui';
import { SearchResult } from '@/services/searchService';

export default function SearchScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const searchInputRef = useRef<TextInput>(null);
  const { loadTags } = useTagStore();

  const {
    query,
    setQuery,
    results,
    isSearching,
    error,
    filters,
    setFilters,
    clearFilters,
    recentSearches,
    clearRecentSearches,
    hasActiveFilters,
  } = useSearch({ debounceMs: 300, limit: 50 });

  const [showFilters, setShowFilters] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Load tags when screen gains focus
  useFocusEffect(
    useCallback(() => {
      loadTags();
    }, [loadTags])
  );

  const handleResultPress = useCallback(
    (result: SearchResult) => {
      Keyboard.dismiss();
      router.push(`/entry/${result.id}`);
    },
    [router]
  );

  const handleRecentSearchSelect = useCallback(
    (search: string) => {
      setQuery(search);
      Keyboard.dismiss();
    },
    [setQuery]
  );

  const handleClearSearch = useCallback(() => {
    setQuery('');
    searchInputRef.current?.focus();
  }, [setQuery]);

  const showRecentSearches = !query.trim() && !hasActiveFilters && recentSearches.length > 0;
  const showEmptyPrompt = !query.trim() && !hasActiveFilters && recentSearches.length === 0;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingTop: insets.top,
        },
      ]}
    >
      {/* Search Header */}
      <View style={styles.header}>
        <SearchBar
          ref={searchInputRef}
          value={query}
          onChangeText={setQuery}
          onClear={handleClearSearch}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          placeholder="Search your journal..."
          autoFocus={false}
          style={styles.searchBar}
        />

        {/* Filter toggle */}
        <Pressable
          onPress={() => setShowFilters(!showFilters)}
          style={({ pressed }) => [
            styles.filterButton,
            {
              backgroundColor: hasActiveFilters
                ? theme.colors.primaryLight
                : theme.colors.surface,
              borderColor: hasActiveFilters ? theme.colors.primary : theme.colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.filterButtonText,
              { color: hasActiveFilters ? theme.colors.primary : theme.colors.textSecondary },
            ]}
          >
            filter
          </Text>
          {hasActiveFilters && (
            <View
              style={[styles.filterIndicator, { backgroundColor: theme.colors.primary }]}
            />
          )}
        </Pressable>
      </View>

      {/* Filters Panel */}
      {showFilters && (
        <View style={[styles.filtersPanel, { borderBottomColor: theme.colors.borderLight }]}>
          <SearchFilters
            filters={filters}
            onFiltersChange={setFilters}
            onClear={clearFilters}
          />
        </View>
      )}

      {/* Loading indicator */}
      {isSearching && (
        <View style={styles.loadingContainer}>
          <LoadingState message="Searching..." />
        </View>
      )}

      {/* Error message */}
      {error && (
        <View style={[styles.errorContainer, { backgroundColor: theme.colors.errorLight }]}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
        </View>
      )}

      {/* Recent Searches (when no query) */}
      {showRecentSearches && (
        <RecentSearches
          searches={recentSearches}
          onSearchSelect={handleRecentSearchSelect}
          onClear={clearRecentSearches}
        />
      )}

      {/* Search Results or Empty State */}
      {!isSearching && (
        <SearchResults
          results={results}
          query={query}
          onResultPress={handleResultPress}
          isLoading={isSearching}
          ListEmptyComponent={
            showEmptyPrompt ? (
              <EmptySearchPrompt theme={theme} />
            ) : undefined
          }
        />
      )}
    </View>
  );
}

interface EmptySearchPromptProps {
  theme: ReturnType<typeof useTheme>;
}

function EmptySearchPrompt({ theme }: EmptySearchPromptProps) {
  return (
    <View style={styles.emptyPrompt}>
      <Text style={styles.emptyIcon}>search</Text>
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        Search Your Journal
      </Text>
      <Text style={[styles.emptyDescription, { color: theme.colors.textSecondary }]}>
        Find entries by keywords in titles or content. Use filters to narrow results by mood or tags.
      </Text>

      <View style={styles.tips}>
        <Text style={[styles.tipsTitle, { color: theme.colors.textSecondary }]}>
          Search Tips:
        </Text>
        <View style={styles.tipItem}>
          <Text style={[styles.tipBullet, { color: theme.colors.primary }]}>-</Text>
          <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
            Search for specific words or phrases
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={[styles.tipBullet, { color: theme.colors.primary }]}>-</Text>
          <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
            Use filters to find entries by mood
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={[styles.tipBullet, { color: theme.colors.primary }]}>-</Text>
          <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
            Filter by tags for categorized searches
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchBar: {
    flex: 1,
  },
  filterButton: {
    width: 44,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterButtonText: {
    fontSize: 14,
  },
  filterIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  filtersPanel: {
    borderBottomWidth: 1,
  },
  loadingContainer: {
    padding: 20,
  },
  errorContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyPrompt: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    paddingTop: 48,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.4,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 15,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 22,
    marginBottom: 24,
  },
  tips: {
    alignSelf: 'stretch',
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tipBullet: {
    fontSize: 14,
    marginRight: 8,
    fontWeight: '600',
  },
  tipText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
});

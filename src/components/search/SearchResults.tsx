import React from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/hooks/useTheme';
import { SearchResult } from '@/services/searchService';
import { Badge } from '@/components/ui';
import { getSmartDate } from '@/utils/dateUtils';
import { getMoodConfig } from '@/constants/moods';
import { config } from '@/constants/config';

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  onResultPress: (result: SearchResult) => void;
  isLoading?: boolean;
  style?: ViewStyle;
  ListHeaderComponent?: React.ReactElement;
  ListEmptyComponent?: React.ReactElement;
}

export function SearchResults({
  results,
  query,
  onResultPress,
  isLoading = false,
  style,
  ListHeaderComponent,
  ListEmptyComponent,
}: SearchResultsProps) {
  const theme = useTheme();

  const renderResult = ({ item }: { item: SearchResult }) => {
    const moodConfig = getMoodConfig(item.mood);

    return (
      <Pressable
        onPress={() => onResultPress(item)}
        style={({ pressed }) => [
          styles.resultCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.borderLight,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <View style={styles.resultHeader}>
          <Text
            style={[styles.resultTitle, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {item.title || 'Untitled'}
          </Text>
          {moodConfig && <Text style={styles.moodEmoji}>{moodConfig.emoji}</Text>}
        </View>

        <Text
          style={[styles.resultSnippet, { color: theme.colors.textSecondary }]}
          numberOfLines={2}
        >
          {highlightQuery(item.snippet, query)}
        </Text>

        <View style={styles.resultFooter}>
          <Text style={[styles.resultDate, { color: theme.colors.textTertiary }]}>
            {getSmartDate(item.createdAt)}
          </Text>
          {item.tags.length > 0 && (
            <View style={styles.tags}>
              {item.tags.slice(0, config.maxTagsOnCard).map((tag) => (
                <Badge key={tag.id} label={tag.name} color={tag.color} size="small" />
              ))}
              {item.tags.length > config.maxTagsOnCard && (
                <Text style={[styles.moreTags, { color: theme.colors.textTertiary }]}>
                  +{item.tags.length - config.maxTagsOnCard}
                </Text>
              )}
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <FlatList
      data={results}
      keyExtractor={(item) => item.id}
      renderItem={renderResult}
      contentContainerStyle={[
        styles.listContent,
        results.length === 0 && styles.emptyListContent,
        style,
      ]}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={
        !isLoading
          ? ListEmptyComponent || (
              <DefaultEmptyState query={query} theme={theme} />
            )
          : null
      }
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    />
  );
}

interface DefaultEmptyStateProps {
  query: string;
  theme: ReturnType<typeof useTheme>;
}

function DefaultEmptyState({ query, theme }: DefaultEmptyStateProps) {
  if (!query.trim()) {
    return (
      <View style={styles.emptyState}>
        <Ionicons
          name="search-outline"
          size={48}
          color={theme.colors.textTertiary}
          style={styles.emptyIcon}
        />
        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
          Search Your Journal
        </Text>
        <Text style={[styles.emptyDescription, { color: theme.colors.textSecondary }]}>
          Find entries by typing keywords, or use filters to narrow down results.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.emptyState}>
      <Ionicons
        name="document-outline"
        size={48}
        color={theme.colors.textTertiary}
        style={styles.emptyIcon}
      />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        No Results Found
      </Text>
      <Text style={[styles.emptyDescription, { color: theme.colors.textSecondary }]}>
        No entries match "{query}". Try different keywords or adjust your filters.
      </Text>
    </View>
  );
}

// Simple text-based highlight (snippets from FTS already use << >> markers)
function highlightQuery(text: string, query: string): string {
  // FTS5 uses << >> for highlights, we display them as-is
  // The actual highlighting would require a custom Text component
  // For simplicity, we just return the text with markers visible
  return text.replace(/<<|>>/g, '');
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  resultCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  moodEmoji: {
    fontSize: 18,
  },
  resultSnippet: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  resultFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultDate: {
    fontSize: 12,
  },
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  moreTags: {
    fontSize: 12,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
});

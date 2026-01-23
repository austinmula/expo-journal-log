import { useEffect, useCallback, useState } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/hooks/useTheme';
import { useEntryStore, useFilteredEntries, useTagStore } from '@/stores';
import { EntryList, FilterBar } from '@/components/entries';
import { FloatingActionButton } from '@/components/layout';
import { LoadingState } from '@/components/ui';

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { loadEntries, isLoading, selectedTagId, selectedMood } = useEntryStore();
  const { loadTags } = useTagStore();
  const entries = useFilteredEntries();
  const [showFilters, setShowFilters] = useState(false);

  // Load entries and tags when screen gains focus
  useFocusEffect(
    useCallback(() => {
      loadEntries();
      loadTags();
    }, [loadEntries, loadTags])
  );

  const handleCreateEntry = () => {
    router.push('/entry/new');
  };

  const handleRefresh = () => {
    loadEntries();
  };

  const hasActiveFilters = selectedTagId || selectedMood;

  if (isLoading && entries.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <LoadingState message="Loading your journal..." />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Filter toggle button */}
      <Pressable
        style={[
          styles.filterToggle,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.borderLight,
          },
        ]}
        onPress={() => setShowFilters(!showFilters)}
      >
        <Text style={[styles.filterToggleText, { color: theme.colors.textSecondary }]}>
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Text>
        {hasActiveFilters && (
          <View style={[styles.filterIndicator, { backgroundColor: theme.colors.primary }]} />
        )}
      </Pressable>

      {/* Filter bar */}
      {showFilters && <FilterBar />}

      {/* Entry list */}
      <EntryList
        entries={entries}
        isLoading={isLoading}
        onRefresh={handleRefresh}
        emptyTitle={hasActiveFilters ? 'No Matching Entries' : 'Start Your Journal'}
        emptyDescription={
          hasActiveFilters
            ? 'No entries match your current filters. Try adjusting your filters or create a new entry.'
            : 'Capture your thoughts, feelings, and experiences. Tap the + button to create your first entry.'
        }
        emptyActionLabel={hasActiveFilters ? undefined : 'Create Entry'}
        onEmptyAction={hasActiveFilters ? undefined : handleCreateEntry}
      />

      <FloatingActionButton
        icon="add"
        onPress={handleCreateEntry}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  filterToggleText: {
    fontSize: 13,
    fontWeight: '500',
  },
  filterIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 6,
  },
});

import { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/hooks/useTheme';
import { useTagStore } from '@/stores';
import { entryRepository } from '@/services/entryRepository';
import { EntryList } from '@/components/entries';
import { LoadingState } from '@/components/ui';
import { JournalEntry } from '@/types';

export default function TagEntriesScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getTagById, loadTags } = useTagStore();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tagName, setTagName] = useState('Tag');

  const loadEntries = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      await loadTags();
      const tag = getTagById(id);
      if (tag) {
        setTagName(tag.name);
      }

      const tagEntries = await entryRepository.getByTag(id);
      setEntries(tagEntries);
    } catch (error) {
      console.error('Failed to load entries:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id, getTagById, loadTags]);

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [loadEntries])
  );

  const tag = getTagById(id || '');

  return (
    <>
      <Stack.Screen
        options={{
          title: tag ? `#${tag.name}` : 'Tag',
        }}
      />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {isLoading ? (
          <LoadingState message="Loading entries..." />
        ) : (
          <EntryList
            entries={entries}
            isLoading={isLoading}
            onRefresh={loadEntries}
            emptyTitle="No Entries"
            emptyDescription={`No entries have been tagged with "${tagName}" yet.`}
            showDateHeaders
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

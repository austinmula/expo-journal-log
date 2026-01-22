import React from 'react';
import { FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { JournalEntry } from '@/types';
import { EntryCard } from './EntryCard';
import { DateSectionHeader } from './DateSectionHeader';
import { EmptyState } from '@/components/ui';
import { groupEntriesByDate } from '@/utils';

interface EntryListProps {
  entries: JournalEntry[];
  isLoading?: boolean;
  onRefresh?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  showDateHeaders?: boolean;
}

interface ListItem {
  type: 'header' | 'entry';
  key: string;
  data: string | JournalEntry;
}

export function EntryList({
  entries,
  isLoading = false,
  onRefresh,
  emptyTitle = 'No entries yet',
  emptyDescription = 'Start journaling by creating your first entry',
  emptyActionLabel,
  onEmptyAction,
  showDateHeaders = true,
}: EntryListProps) {
  const theme = useTheme();
  const router = useRouter();

  const handleEntryPress = (entry: JournalEntry) => {
    router.push(`/entry/${entry.id}`);
  };

  // Group entries by date if headers are enabled
  const listData = React.useMemo(() => {
    if (!showDateHeaders) {
      return entries.map((entry) => ({
        type: 'entry' as const,
        key: entry.id,
        data: entry,
      }));
    }

    const groups = groupEntriesByDate(entries);
    const items: ListItem[] = [];

    // Sort date keys in descending order
    const sortedKeys = Array.from(groups.keys()).sort().reverse();

    for (const dateKey of sortedKeys) {
      items.push({
        type: 'header',
        key: `header-${dateKey}`,
        data: dateKey,
      });

      const groupEntries = groups.get(dateKey) || [];
      for (const entry of groupEntries) {
        items.push({
          type: 'entry',
          key: entry.id,
          data: entry,
        });
      }
    }

    return items;
  }, [entries, showDateHeaders]);

  const renderItem = ({ item, index }: { item: ListItem; index: number }) => {
    if (item.type === 'header') {
      return <DateSectionHeader dateKey={item.data as string} />;
    }

    return (
      <EntryCard
        entry={item.data as JournalEntry}
        onPress={handleEntryPress}
        index={index}
      />
    );
  };

  if (entries.length === 0 && !isLoading) {
    return (
      <EmptyState
        icon="book"
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
        style={styles.emptyState}
      />
    );
  }

  return (
    <FlatList
      data={listData}
      renderItem={renderItem}
      keyExtractor={(item) => item.key}
      contentContainerStyle={[
        styles.listContent,
        { padding: theme.spacing.md },
      ]}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        ) : undefined
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
  },
});

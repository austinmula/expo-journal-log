import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, isSameDay } from 'date-fns';
import { useTheme } from '@/hooks/useTheme';
import { useEntriesByDate } from '@/hooks/useSearch';
import { useEntryStore } from '@/stores';
import { CalendarView } from '@/components/calendar';
import { EntryCard } from '@/components/entries/EntryCard';
import { EmptyState, LoadingState } from '@/components/ui';
import { FloatingActionButton } from '@/components/layout';
import { JournalEntry } from '@/types';

export default function CalendarScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loadEntries } = useEntryStore();

  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const { entries, isLoading, error } = useEntriesByDate(selectedDate);

  // Refresh entries when screen gains focus
  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [loadEntries])
  );

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const handleEntryPress = useCallback(
    (entry: JournalEntry) => {
      router.push(`/entry/${entry.id}`);
    },
    [router]
  );

  const handleCreateEntry = useCallback(() => {
    router.push('/entry/new');
  }, [router]);

  const renderEntry = useCallback(
    ({ item }: { item: JournalEntry }) => (
      <EntryCard entry={item} onPress={handleEntryPress} />
    ),
    [handleEntryPress]
  );

  const getDateLabel = () => {
    if (!selectedDate) return 'Select a date';

    const today = new Date();
    if (isSameDay(selectedDate, today)) {
      return "Today's Entries";
    }

    return format(selectedDate, 'EEEE, MMMM d');
  };

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
      {/* Calendar */}
      <CalendarView
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
        style={styles.calendar}
      />

      {/* Divider */}
      <View
        style={[
          styles.divider,
          { backgroundColor: theme.colors.borderLight },
        ]}
      />

      {/* Selected Date Header */}
      <View style={styles.dateHeader}>
        <Text style={[styles.dateLabel, { color: theme.colors.text }]}>
          {getDateLabel()}
        </Text>
        {selectedDate && (
          <Text style={[styles.entryCount, { color: theme.colors.textSecondary }]}>
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          </Text>
        )}
      </View>

      {/* Entries List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <LoadingState message="Loading entries..." />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={renderEntry}
          contentContainerStyle={[
            styles.listContent,
            entries.length === 0 && styles.emptyListContent,
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon={selectedDate && isSameDay(selectedDate, new Date()) ? 'today' : 'calendar'}
              title="No Entries"
              description={
                selectedDate && isSameDay(selectedDate, new Date())
                  ? "You haven't written anything today. Start capturing your thoughts!"
                  : `No entries for ${format(selectedDate || new Date(), 'MMMM d, yyyy')}.`
              }
              actionLabel={
                selectedDate && isSameDay(selectedDate, new Date())
                  ? 'Create Entry'
                  : undefined
              }
              onAction={
                selectedDate && isSameDay(selectedDate, new Date())
                  ? handleCreateEntry
                  : undefined
              }
            />
          }
        />
      )}

      <FloatingActionButton icon="+" onPress={handleCreateEntry} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  calendar: {
    paddingBottom: 8,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  entryCount: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100, // Space for FAB
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
});

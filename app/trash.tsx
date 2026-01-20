import { useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, Alert, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/hooks/useTheme';
import { useEntryStore } from '@/stores';
import { DeletedEntryCard } from '@/components/entries';
import { EmptyState, Button } from '@/components/ui';
import { JournalEntry } from '@/types';

export default function TrashScreen() {
  const theme = useTheme();
  const {
    deletedEntries,
    loadDeletedEntries,
    restoreEntry,
    permanentlyDeleteEntry,
    purgeOldDeleted,
  } = useEntryStore();

  // Load deleted entries when screen gains focus
  useFocusEffect(
    useCallback(() => {
      loadDeletedEntries();
    }, [loadDeletedEntries])
  );

  const handleRestore = async (entry: JournalEntry) => {
    try {
      await restoreEntry(entry.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to restore entry. Please try again.');
    }
  };

  const handlePermanentDelete = (entry: JournalEntry) => {
    Alert.alert(
      'Delete Forever',
      'This entry will be permanently deleted and cannot be recovered.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            try {
              await permanentlyDeleteEntry(entry.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete entry. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleEmptyTrash = () => {
    if (deletedEntries.length === 0) return;

    Alert.alert(
      'Empty Trash',
      `This will permanently delete ${deletedEntries.length} entries. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Empty Trash',
          style: 'destructive',
          onPress: async () => {
            try {
              for (const entry of deletedEntries) {
                await permanentlyDeleteEntry(entry.id);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to empty trash. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: JournalEntry }) => (
    <DeletedEntryCard
      entry={item}
      onRestore={handleRestore}
      onDelete={handlePermanentDelete}
    />
  );

  if (deletedEntries.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <EmptyState
          icon="trash"
          title="Trash is Empty"
          description="Deleted entries will appear here for 30 days before being permanently removed."
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.borderLight,
          },
        ]}
      >
        <Text style={[styles.headerText, { color: theme.colors.textSecondary }]}>
          {deletedEntries.length} deleted {deletedEntries.length === 1 ? 'entry' : 'entries'}
        </Text>
        <Button
          title="Empty Trash"
          variant="ghost"
          size="small"
          onPress={handleEmptyTrash}
          textStyle={{ color: theme.colors.error }}
        />
      </View>

      <FlatList
        data={deletedEntries}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { padding: theme.spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerText: {
    fontSize: 14,
  },
  listContent: {
    flexGrow: 1,
  },
});

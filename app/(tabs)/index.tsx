import { useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/hooks/useTheme';
import { useEntryStore, useFilteredEntries } from '@/stores';
import { EntryList } from '@/components/entries';
import { FloatingActionButton } from '@/components/layout';
import { LoadingState } from '@/components/ui';

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { loadEntries, isLoading } = useEntryStore();
  const entries = useFilteredEntries();

  // Load entries when screen gains focus
  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [loadEntries])
  );

  const handleCreateEntry = () => {
    router.push('/entry/new');
  };

  const handleRefresh = () => {
    loadEntries();
  };

  if (isLoading && entries.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <LoadingState message="Loading your journal..." />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <EntryList
        entries={entries}
        isLoading={isLoading}
        onRefresh={handleRefresh}
        emptyTitle="Start Your Journal"
        emptyDescription="Capture your thoughts, feelings, and experiences. Tap the + button to create your first entry."
        emptyActionLabel="Create Entry"
        onEmptyAction={handleCreateEntry}
      />
      <FloatingActionButton
        icon="+"
        onPress={handleCreateEntry}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

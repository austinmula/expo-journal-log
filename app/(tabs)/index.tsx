import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { EmptyState } from '@/components/ui';

export default function HomeScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <EmptyState
        icon="book"
        title="No entries yet"
        description="Start journaling by creating your first entry"
        actionLabel="Create Entry"
        onAction={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

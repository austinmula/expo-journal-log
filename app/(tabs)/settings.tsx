import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useThemeContext } from '@/hooks/useTheme';
import { Card } from '@/components/ui';

export default function SettingsScreen() {
  const theme = useTheme();
  const { themeMode, setThemeMode } = useThemeContext();
  const router = useRouter();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
        APPEARANCE
      </Text>
      <Card style={styles.card}>
        {(['light', 'dark', 'system'] as const).map((mode) => (
          <Pressable
            key={mode}
            style={[
              styles.option,
              { borderBottomColor: theme.colors.borderLight },
            ]}
            onPress={() => setThemeMode(mode)}
          >
            <Text style={[styles.optionText, { color: theme.colors.text }]}>
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Text>
            {themeMode === mode && (
              <Text style={[styles.checkmark, { color: theme.colors.primary }]}>
                check
              </Text>
            )}
          </Pressable>
        ))}
      </Card>

      <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
        DATA
      </Text>
      <Card style={styles.card}>
        <Pressable
          style={[styles.option, { borderBottomColor: theme.colors.borderLight }]}
          onPress={() => router.push('/tags')}
        >
          <Text style={[styles.optionText, { color: theme.colors.text }]}>
            Manage Tags
          </Text>
          <Text style={[styles.chevron, { color: theme.colors.textTertiary }]}>
            {'>'}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.option, { borderBottomWidth: 0 }]}
          onPress={() => router.push('/trash')}
        >
          <Text style={[styles.optionText, { color: theme.colors.text }]}>
            Recently Deleted
          </Text>
          <Text style={[styles.chevron, { color: theme.colors.textTertiary }]}>
            {'>'}
          </Text>
        </Pressable>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
    marginLeft: 4,
  },
  card: {
    padding: 0,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: 16,
  },
  checkmark: {
    fontSize: 16,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 18,
  },
});

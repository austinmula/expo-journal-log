import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useThemeContext } from '@/hooks/useTheme';
import { Card } from '@/components/ui';
import { SecuritySettings } from '@/components/security';

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
        SECURITY
      </Text>
      <SecuritySettings />

      <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
        APPEARANCE
      </Text>
      <Card style={styles.card}>
        {(['light', 'dark', 'system'] as const).map((mode, index, arr) => (
          <Pressable
            key={mode}
            style={[
              styles.option,
              {
                borderBottomColor: theme.colors.borderLight,
                borderBottomWidth: index === arr.length - 1 ? 0 : 1,
              },
            ]}
            onPress={() => setThemeMode(mode)}
          >
            <View style={styles.optionLeft}>
              <Ionicons
                name={
                  mode === 'light'
                    ? 'sunny-outline'
                    : mode === 'dark'
                      ? 'moon-outline'
                      : 'phone-portrait-outline'
                }
                size={22}
                color={theme.colors.text}
                style={styles.optionIcon}
              />
              <Text style={[styles.optionText, { color: theme.colors.text }]}>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Text>
            </View>
            {themeMode === mode && (
              <Ionicons
                name="checkmark"
                size={22}
                color={theme.colors.primary}
              />
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
          <View style={styles.optionLeft}>
            <Ionicons
              name="pricetags-outline"
              size={22}
              color={theme.colors.text}
              style={styles.optionIcon}
            />
            <Text style={[styles.optionText, { color: theme.colors.text }]}>
              Manage Tags
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors.textTertiary}
          />
        </Pressable>
        <Pressable
          style={[styles.option, { borderBottomWidth: 0 }]}
          onPress={() => router.push('/trash')}
        >
          <View style={styles.optionLeft}>
            <Ionicons
              name="trash-outline"
              size={22}
              color={theme.colors.text}
              style={styles.optionIcon}
            />
            <Text style={[styles.optionText, { color: theme.colors.text }]}>
              Recently Deleted
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors.textTertiary}
          />
        </Pressable>
      </Card>

      <View style={styles.footer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
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
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
  },
  footer: {
    height: 32,
  },
});

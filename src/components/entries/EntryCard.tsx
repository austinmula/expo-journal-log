import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Badge } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { JournalEntry } from '@/types';
import { getSmartDate, getPreview } from '@/utils';
import { getMoodConfig } from '@/constants/moods';
import { config } from '@/constants/config';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';

interface EntryCardProps {
  entry: JournalEntry;
  onPress: (entry: JournalEntry) => void;
}

// Default accent color when no mood is set
const DEFAULT_ACCENT_COLOR = colors.stone[300];

export function EntryCard({ entry, onPress }: EntryCardProps) {
  const theme = useTheme();
  const moodConfig = getMoodConfig(entry.mood);
  const accentColor = moodConfig?.color || DEFAULT_ACCENT_COLOR;

  return (
    <Pressable
      onPress={() => onPress(entry)}
      style={({ pressed }) => [
        styles.cardOuter,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.borderLight,
          shadowColor: theme.colors.shadow,
          opacity: pressed ? 0.9 : 1,
          transform: pressed ? [{ scale: 0.98 }] : [{ scale: 1 }],
        },
      ]}
    >
      {/* Mood accent bar */}
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

      {/* Card content */}
      <View style={styles.cardContent}>
        <View style={styles.header}>
          <Text
            style={[styles.title, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {entry.title || 'Untitled'}
          </Text>
          {moodConfig && (
            <Text style={styles.mood}>{moodConfig.emoji}</Text>
          )}
        </View>

        <Text
          style={[styles.preview, { color: theme.colors.textSecondary }]}
          numberOfLines={2}
        >
          {getPreview(entry.content, config.previewMaxLength)}
        </Text>

        <View style={styles.footer}>
          <Text style={[styles.date, { color: theme.colors.textTertiary }]}>
            {getSmartDate(entry.createdAt)}
          </Text>
          {entry.tags.length > 0 && (
            <View style={styles.tags}>
              {entry.tags.slice(0, config.maxTagsOnCard).map((tag) => (
                <Badge
                  key={tag.id}
                  label={tag.name}
                  color={tag.color}
                  size="small"
                />
              ))}
              {entry.tags.length > config.maxTagsOnCard && (
                <Text style={[styles.moreTags, { color: theme.colors.textTertiary }]}>
                  +{entry.tags.length - config.maxTagsOnCard}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardOuter: {
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  accentBar: {
    width: 4,
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: fonts.serif.semiBold,
    flex: 1,
    marginRight: 8,
  },
  mood: {
    fontSize: 20,
  },
  preview: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
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
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableCard, Badge } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { JournalEntry } from '@/types';
import { getSmartDate, getPreview } from '@/utils';
import { getMoodConfig } from '@/constants/moods';
import { config } from '@/constants/config';

interface EntryCardProps {
  entry: JournalEntry;
  onPress: (entry: JournalEntry) => void;
}

export function EntryCard({ entry, onPress }: EntryCardProps) {
  const theme = useTheme();
  const moodConfig = getMoodConfig(entry.mood);

  return (
    <PressableCard
      onPress={() => onPress(entry)}
      style={styles.card}
    >
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
    </PressableCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
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

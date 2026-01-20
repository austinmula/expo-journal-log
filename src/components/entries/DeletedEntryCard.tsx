import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Card, Button } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { JournalEntry } from '@/types';
import { getSmartDate, getPreview } from '@/utils';
import { config } from '@/constants/config';

interface DeletedEntryCardProps {
  entry: JournalEntry;
  onRestore: (entry: JournalEntry) => void;
  onDelete: (entry: JournalEntry) => void;
}

export function DeletedEntryCard({
  entry,
  onRestore,
  onDelete,
}: DeletedEntryCardProps) {
  const theme = useTheme();

  const daysUntilPermanentDelete = entry.deletedAt
    ? Math.max(
        0,
        config.trashRetentionDays -
          Math.floor(
            (Date.now() - entry.deletedAt.getTime()) / (1000 * 60 * 60 * 24)
          )
      )
    : config.trashRetentionDays;

  return (
    <Card style={{ ...styles.card, opacity: 0.8 }}>
      <Text
        style={[styles.title, { color: theme.colors.text }]}
        numberOfLines={1}
      >
        {entry.title || 'Untitled'}
      </Text>

      <Text
        style={[styles.preview, { color: theme.colors.textSecondary }]}
        numberOfLines={2}
      >
        {getPreview(entry.content, config.previewMaxLength)}
      </Text>

      <View style={styles.footer}>
        <View>
          <Text style={[styles.date, { color: theme.colors.textTertiary }]}>
            Deleted {entry.deletedAt ? getSmartDate(entry.deletedAt) : 'recently'}
          </Text>
          <Text style={[styles.warning, { color: theme.colors.warning }]}>
            {daysUntilPermanentDelete > 0
              ? `${daysUntilPermanentDelete} days until permanent deletion`
              : 'Will be deleted soon'}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          title="Restore"
          variant="secondary"
          size="small"
          onPress={() => onRestore(entry)}
          style={styles.actionButton}
        />
        <Button
          title="Delete Forever"
          variant="ghost"
          size="small"
          onPress={() => onDelete(entry)}
          textStyle={{ color: theme.colors.error }}
          style={styles.actionButton}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  preview: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  footer: {
    marginBottom: 12,
  },
  date: {
    fontSize: 12,
    marginBottom: 2,
  },
  warning: {
    fontSize: 11,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
});

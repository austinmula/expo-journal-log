import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useTagStore } from '@/stores';
import { SearchFilters as SearchFiltersType } from '@/services/searchService';
import { MoodType, Tag } from '@/types';
import { moods, moodList } from '@/constants/moods';

interface SearchFiltersProps {
  filters: SearchFiltersType;
  onFiltersChange: (filters: SearchFiltersType) => void;
  onClear: () => void;
  style?: ViewStyle;
}

export function SearchFilters({
  filters,
  onFiltersChange,
  onClear,
  style,
}: SearchFiltersProps) {
  const theme = useTheme();
  const { tags } = useTagStore();
  const [showAllTags, setShowAllTags] = useState(false);

  const hasActiveFilters =
    (filters.tagIds && filters.tagIds.length > 0) ||
    !!filters.mood ||
    !!filters.startDate ||
    !!filters.endDate;

  const handleMoodToggle = (mood: MoodType) => {
    if (filters.mood === mood) {
      onFiltersChange({ ...filters, mood: undefined });
    } else {
      onFiltersChange({ ...filters, mood });
    }
  };

  const handleTagToggle = (tagId: string) => {
    const currentTagIds = filters.tagIds || [];
    const newTagIds = currentTagIds.includes(tagId)
      ? currentTagIds.filter((id) => id !== tagId)
      : [...currentTagIds, tagId];

    onFiltersChange({
      ...filters,
      tagIds: newTagIds.length > 0 ? newTagIds : undefined,
    });
  };

  const displayedTags = showAllTags ? tags : tags.slice(0, 6);

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Filters</Text>
        {hasActiveFilters && (
          <Pressable onPress={onClear}>
            <Text style={[styles.clearText, { color: theme.colors.primary }]}>
              Clear all
            </Text>
          </Pressable>
        )}
      </View>

      {/* Mood Filter */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          Mood
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.moodList}
        >
          {moodList.map((moodConfig) => {
            const isSelected = filters.mood === moodConfig.type;
            return (
              <Pressable
                key={moodConfig.type}
                onPress={() => handleMoodToggle(moodConfig.type)}
                style={({ pressed }) => [
                  styles.moodChip,
                  {
                    backgroundColor: isSelected
                      ? `${moodConfig.color}30`
                      : theme.colors.surface,
                    borderColor: isSelected ? moodConfig.color : theme.colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text style={styles.moodEmoji}>{moodConfig.emoji}</Text>
                <Text
                  style={[
                    styles.moodLabel,
                    { color: isSelected ? moodConfig.color : theme.colors.textSecondary },
                  ]}
                >
                  {moodConfig.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Tag Filter */}
      {tags.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            Tags
          </Text>
          <View style={styles.tagList}>
            {displayedTags.map((tag) => {
              const isSelected = filters.tagIds?.includes(tag.id) ?? false;
              return (
                <Pressable
                  key={tag.id}
                  onPress={() => handleTagToggle(tag.id)}
                  style={({ pressed }) => [
                    styles.tagChip,
                    {
                      backgroundColor: isSelected ? `${tag.color}30` : `${tag.color}15`,
                      borderColor: isSelected ? tag.color : 'transparent',
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.tagLabel, { color: tag.color }]}>{tag.name}</Text>
                </Pressable>
              );
            })}
          </View>
          {tags.length > 6 && (
            <Pressable onPress={() => setShowAllTags(!showAllTags)}>
              <Text style={[styles.showMoreText, { color: theme.colors.primary }]}>
                {showAllTags ? 'Show less' : `Show ${tags.length - 6} more`}
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Active filters summary */}
      {hasActiveFilters && (
        <View
          style={[
            styles.activeFilters,
            { backgroundColor: theme.colors.primaryLight, borderRadius: theme.borderRadius.md },
          ]}
        >
          <Text style={[styles.activeFiltersText, { color: theme.colors.primary }]}>
            {getActiveFiltersText(filters, tags)}
          </Text>
        </View>
      )}
    </View>
  );
}

function getActiveFiltersText(filters: SearchFiltersType, tags: Tag[]): string {
  const parts: string[] = [];

  if (filters.mood) {
    const moodConfig = moods[filters.mood];
    parts.push(`Mood: ${moodConfig.emoji} ${moodConfig.label}`);
  }

  if (filters.tagIds && filters.tagIds.length > 0) {
    const selectedTags = tags.filter((t) => filters.tagIds?.includes(t.id));
    if (selectedTags.length === 1) {
      parts.push(`Tag: ${selectedTags[0].name}`);
    } else {
      parts.push(`Tags: ${selectedTags.length} selected`);
    }
  }

  return parts.join(' | ');
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  clearText: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  moodList: {
    paddingHorizontal: 12,
    gap: 8,
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  moodEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  moodLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
  },
  tagChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  tagLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  showMoreText: {
    fontSize: 13,
    fontWeight: '500',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  activeFilters: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
  },
  activeFiltersText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});

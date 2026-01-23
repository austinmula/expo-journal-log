import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useTagStore, useEntryStore, useCategoryStore } from '@/stores';
import { MoodType } from '@/types';
import { moodList } from '@/constants/moods';
import { TagBadge } from '@/components/tags';
import { CategoryBadge } from '@/components/categories';

interface FilterBarProps {
  onClearFilters?: () => void;
}

export function FilterBar({ onClearFilters }: FilterBarProps) {
  const theme = useTheme();
  const { tags, loadTags } = useTagStore();
  const { categories, loadCategories } = useCategoryStore();
  const {
    selectedTagId,
    selectedMood,
    selectedCategoryId,
    setSelectedTag,
    setSelectedMood,
    setSelectedCategory,
    clearFilters,
  } = useEntryStore();

  useEffect(() => {
    loadTags();
    loadCategories();
  }, [loadTags, loadCategories]);

  const hasFilters = selectedTagId || selectedMood || selectedCategoryId;

  const handleClearFilters = () => {
    clearFilters();
    onClearFilters?.();
  };

  return (
    <View style={[styles.container, { borderBottomColor: theme.colors.borderLight }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Mood filters */}
        <View style={styles.filterGroup}>
          <Text style={[styles.filterLabel, { color: theme.colors.textTertiary }]}>
            Mood
          </Text>
          <View style={styles.filterOptions}>
            {moodList.map((mood) => (
              <Pressable
                key={mood.type}
                style={[
                  styles.moodButton,
                  {
                    backgroundColor:
                      selectedMood === mood.type
                        ? `${mood.color}20`
                        : theme.colors.surface,
                    borderColor:
                      selectedMood === mood.type
                        ? mood.color
                        : theme.colors.border,
                  },
                ]}
                onPress={() =>
                  setSelectedMood(
                    selectedMood === mood.type ? null : mood.type
                  )
                }
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Category filters */}
        {categories.length > 0 && (
          <View style={styles.filterGroup}>
            <Text style={[styles.filterLabel, { color: theme.colors.textTertiary }]}>
              Category
            </Text>
            <View style={styles.filterOptions}>
              {categories.slice(0, 4).map((category) => (
                <CategoryBadge
                  key={category.id}
                  category={category}
                  size="small"
                  selected={selectedCategoryId === category.id}
                  onPress={() =>
                    setSelectedCategory(
                      selectedCategoryId === category.id ? null : category.id
                    )
                  }
                />
              ))}
              {categories.length > 4 && (
                <Text style={[styles.moreText, { color: theme.colors.textTertiary }]}>
                  +{categories.length - 4}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Tag filters */}
        {tags.length > 0 && (
          <View style={styles.filterGroup}>
            <Text style={[styles.filterLabel, { color: theme.colors.textTertiary }]}>
              Tags
            </Text>
            <View style={styles.filterOptions}>
              {tags.slice(0, 5).map((tag) => (
                <TagBadge
                  key={tag.id}
                  tag={tag}
                  size="small"
                  selected={selectedTagId === tag.id}
                  onPress={() =>
                    setSelectedTag(
                      selectedTagId === tag.id ? null : tag.id
                    )
                  }
                />
              ))}
              {tags.length > 5 && (
                <Text style={[styles.moreText, { color: theme.colors.textTertiary }]}>
                  +{tags.length - 5}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Clear filters button */}
        {hasFilters && (
          <Pressable
            style={[
              styles.clearButton,
              { backgroundColor: theme.colors.errorLight },
            ]}
            onPress={handleClearFilters}
          >
            <Text style={[styles.clearText, { color: theme.colors.error }]}>
              Clear
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  filterOptions: {
    flexDirection: 'row',
    gap: 6,
  },
  moodButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  moodEmoji: {
    fontSize: 16,
  },
  moreText: {
    fontSize: 12,
    paddingHorizontal: 8,
    alignSelf: 'center',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  clearText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

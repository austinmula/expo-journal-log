import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Text,
  Alert,
  Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useEntryStore, useTagStore, useCategoryStore } from '@/stores';
import { MoodSelector } from '@/components/entries/MoodSelector';
import { TagPicker, TagBadge } from '@/components/tags';
import { CategoryPicker, CategoryPickerInline, CategoryBadge } from '@/components/categories';
import { Button, LoadingState } from '@/components/ui';
import { MoodType, Tag } from '@/types';
import { formatDateTime } from '@/utils';
import { config } from '@/constants/config';
import { getMoodConfig } from '@/constants/moods';
import { fonts } from '@/constants/fonts';

export default function EntryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getEntryById, updateEntry, deleteEntry, loadEntries } = useEntryStore();
  const { tags, loadTags } = useTagStore();
  const { categories, loadCategories, getCategoryById } = useCategoryStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<MoodType | undefined>();
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [createdAt, setCreatedAt] = useState<Date | null>(null);
  const [isTagPickerVisible, setIsTagPickerVisible] = useState(false);
  const [isCategoryPickerVisible, setIsCategoryPickerVisible] = useState(false);

  const contentRef = useRef<TextInput>(null);
  const hasLoadedRef = useRef(false);

  // Load entry data
  useEffect(() => {
    const loadEntry = async () => {
      if (hasLoadedRef.current || !id) return;
      hasLoadedRef.current = true;

      await loadTags();
      await loadCategories();
      await loadEntries();

      const entry = getEntryById(id);
      if (entry) {
        setTitle(entry.title);
        setContent(entry.content);
        setMood(entry.mood);
        setCreatedAt(entry.createdAt);
        setSelectedTagIds(entry.tags.map((t) => t.id));
        setSelectedCategoryId(entry.categoryId || null);
      }
      setIsLoading(false);
    };

    loadEntry();
  }, [id, getEntryById, loadEntries, loadTags, loadCategories]);

  const handleSave = useCallback(async () => {
    if (!id) return;

    try {
      await updateEntry(id, {
        title: title.trim() || 'Untitled',
        content: content.trim(),
        mood,
        categoryId: selectedCategoryId,
        tagIds: selectedTagIds,
      });
    } catch (error) {
      console.error('Failed to save entry:', error);
    }
  }, [id, title, content, mood, selectedCategoryId, selectedTagIds, updateEntry]);

  const { isSaving, hasUnsavedChanges, scheduleAutoSave, saveNow } = useAutoSave({
    delay: config.autoSaveDelay,
    onSave: handleSave,
  });

  const handleContentChange = (text: string) => {
    setContent(text);
    scheduleAutoSave();
  };

  const handleTitleChange = (text: string) => {
    setTitle(text);
    scheduleAutoSave();
  };

  const handleMoodChange = (newMood: MoodType | undefined) => {
    setMood(newMood);
    scheduleAutoSave();
  };

  const handleTagsChange = (tagIds: string[]) => {
    setSelectedTagIds(tagIds);
    scheduleAutoSave();
  };

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    scheduleAutoSave();
  };

  const handleBack = async () => {
    if (hasUnsavedChanges) {
      await saveNow();
    }
    router.back();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Entry',
      'This entry will be moved to the trash. You can restore it within 30 days.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (id) {
              await deleteEntry(id);
              router.back();
            }
          },
        },
      ]
    );
  };

  const toggleEditing = () => {
    if (isEditing) {
      saveNow();
    }
    setIsEditing(!isEditing);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <LoadingState message="Loading entry..." />
      </View>
    );
  }

  const selectedTags = tags.filter((t) => selectedTagIds.includes(t.id));
  const selectedCategory = selectedCategoryId ? getCategoryById(selectedCategoryId) : undefined;
  const moodConfig = getMoodConfig(mood);

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerLeft: () => (
            <Button
              title="Back"
              variant="ghost"
              size="small"
              onPress={handleBack}
            />
          ),
          headerRight: () => (
            <View style={styles.headerRight}>
              <Button
                title={isEditing ? 'Done' : 'Edit'}
                variant="ghost"
                size="small"
                onPress={toggleEditing}
              />
              <Button
                title="Delete"
                variant="ghost"
                size="small"
                onPress={handleDelete}
                textStyle={{ color: theme.colors.error }}
              />
            </View>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {createdAt && (
            <Text style={[styles.dateText, { color: theme.colors.textTertiary }]}>
              {formatDateTime(createdAt)}
            </Text>
          )}

          {isEditing ? (
            <>
              <TextInput
                style={[
                  styles.titleInput,
                  {
                    color: theme.colors.text,
                    borderBottomColor: theme.colors.borderLight,
                  },
                ]}
                placeholder="Title"
                placeholderTextColor={theme.colors.textTertiary}
                value={title}
                onChangeText={handleTitleChange}
                returnKeyType="next"
                onSubmitEditing={() => contentRef.current?.focus()}
              />

              <TextInput
                ref={contentRef}
                style={[
                  styles.contentInput,
                  {
                    color: theme.colors.text,
                  },
                ]}
                placeholder="Write something..."
                placeholderTextColor={theme.colors.textTertiary}
                value={content}
                onChangeText={handleContentChange}
                multiline
                textAlignVertical="top"
              />

              {/* Category section */}
              <View style={[styles.section, { borderTopColor: theme.colors.borderLight }]}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
                    Category
                  </Text>
                </View>
                <CategoryPickerInline
                  selectedCategoryId={selectedCategoryId}
                  onPress={() => setIsCategoryPickerVisible(true)}
                />
              </View>

              {/* Tags section */}
              <View style={[styles.section, { borderTopColor: theme.colors.borderLight }]}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
                    Tags
                  </Text>
                  <Button
                    title={selectedTags.length > 0 ? 'Edit' : 'Add'}
                    variant="ghost"
                    size="small"
                    onPress={() => setIsTagPickerVisible(true)}
                  />
                </View>
                {selectedTags.length > 0 ? (
                  <View style={styles.tagList}>
                    {selectedTags.map((tag) => (
                      <TagBadge key={tag.id} tag={tag} />
                    ))}
                  </View>
                ) : (
                  <Pressable onPress={() => setIsTagPickerVisible(true)}>
                    <Text style={[styles.placeholder, { color: theme.colors.textTertiary }]}>
                      Tap to add tags
                    </Text>
                  </Pressable>
                )}
              </View>

              {/* Mood section */}
              <View style={[styles.section, { borderTopColor: theme.colors.borderLight }]}>
                <MoodSelector
                  selectedMood={mood}
                  onSelectMood={handleMoodChange}
                />
              </View>

              {isSaving && (
                <Text style={[styles.savingIndicator, { color: theme.colors.textTertiary }]}>
                  Saving...
                </Text>
              )}
            </>
          ) : (
            <Pressable onPress={toggleEditing}>
              <Text style={[styles.titleDisplay, { color: theme.colors.text }]}>
                {title || 'Untitled'}
              </Text>

              {(moodConfig || selectedTags.length > 0 || selectedCategory) && (
                <View style={styles.metaRow}>
                  {selectedCategory && (
                    <CategoryBadge category={selectedCategory} size="small" />
                  )}
                  {moodConfig && (
                    <View style={styles.moodDisplay}>
                      <Text style={styles.moodEmoji}>{moodConfig.emoji}</Text>
                      <Text style={[styles.moodLabel, { color: moodConfig.color }]}>
                        {moodConfig.label}
                      </Text>
                    </View>
                  )}
                  {selectedTags.length > 0 && (
                    <View style={styles.tagList}>
                      {selectedTags.map((tag) => (
                        <TagBadge key={tag.id} tag={tag} size="small" />
                      ))}
                    </View>
                  )}
                </View>
              )}

              <Text style={[styles.contentDisplay, { color: theme.colors.text }]}>
                {content || 'No content'}
              </Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <TagPicker
        visible={isTagPickerVisible}
        onClose={() => setIsTagPickerVisible(false)}
        selectedTagIds={selectedTagIds}
        onTagsChange={handleTagsChange}
      />

      <CategoryPicker
        visible={isCategoryPickerVisible}
        onClose={() => setIsCategoryPickerVisible(false)}
        selectedCategoryId={selectedCategoryId}
        onCategoryChange={handleCategoryChange}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  dateText: {
    fontSize: 12,
    marginBottom: 16,
  },
  titleInput: {
    fontSize: 24,
    fontFamily: fonts.serif.semiBold,
    paddingVertical: 16,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  titleDisplay: {
    fontSize: 28,
    fontFamily: fonts.serif.bold,
    marginBottom: 16,
    lineHeight: 36,
  },
  contentInput: {
    fontSize: 18,
    lineHeight: 28,
    minHeight: 200,
    marginBottom: 24,
  },
  contentDisplay: {
    fontSize: 18,
    lineHeight: 28,
  },
  section: {
    paddingTop: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  placeholder: {
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  moodDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  moodEmoji: {
    fontSize: 20,
  },
  moodLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  savingIndicator: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
});

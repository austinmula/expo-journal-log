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
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useEntryStore, useTagStore } from '@/stores';
import { MoodSelector } from '@/components/entries/MoodSelector';
import { TagPicker, TagBadge } from '@/components/tags';
import { Button } from '@/components/ui';
import { MoodType } from '@/types';
import { generateTitleFromContent } from '@/utils';
import { config } from '@/constants/config';
import { fonts } from '@/constants/fonts';

export default function NewEntryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { createEntry, updateEntry } = useEntryStore();
  const { tags, loadTags, setTagsForEntry } = useTagStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<MoodType | undefined>();
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [isTagPickerVisible, setIsTagPickerVisible] = useState(false);

  const contentRef = useRef<TextInput>(null);
  const isCreatingRef = useRef(false);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const handleSave = useCallback(async () => {
    if (isCreatingRef.current || (!content.trim() && !title.trim())) {
      return;
    }

    isCreatingRef.current = true;
    try {
      const entryTitle = title.trim() || generateTitleFromContent(content);

      if (entryId) {
        await updateEntry(entryId, {
          title: entryTitle,
          content: content.trim(),
          mood,
          tagIds: selectedTagIds,
        });
        setIsSaved(true);
      } else {
        const entry = await createEntry({
          title: entryTitle,
          content: content.trim(),
          mood,
          tagIds: selectedTagIds,
        });
        setEntryId(entry.id);
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Failed to save entry:', error);
      Alert.alert('Error', 'Failed to save your entry. Please try again.');
    } finally {
      isCreatingRef.current = false;
    }
  }, [title, content, mood, selectedTagIds, entryId, createEntry, updateEntry]);

  const { isSaving, hasUnsavedChanges, scheduleAutoSave, saveNow } = useAutoSave({
    delay: config.autoSaveDelay,
    onSave: handleSave,
  });

  const handleContentChange = (text: string) => {
    setContent(text);
    if (text.trim()) {
      scheduleAutoSave();
    }
  };

  const handleTitleChange = (text: string) => {
    setTitle(text);
    if (content.trim()) {
      scheduleAutoSave();
    }
  };

  const handleMoodChange = (newMood: MoodType | undefined) => {
    setMood(newMood);
    if (content.trim()) {
      scheduleAutoSave();
    }
  };

  const handleTagsChange = (tagIds: string[]) => {
    setSelectedTagIds(tagIds);
    if (content.trim()) {
      scheduleAutoSave();
    }
  };

  const handleDone = async () => {
    if (content.trim() || title.trim()) {
      await saveNow();
    }
    router.back();
  };

  const handleCancel = () => {
    if (hasUnsavedChanges && (content.trim() || title.trim())) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  const selectedTags = tags.filter((t) => selectedTagIds.includes(t.id));

  return (
    <>
      <Stack.Screen
        options={{
          title: 'New Entry',
          headerLeft: () => (
            <Button
              title="Cancel"
              variant="ghost"
              size="small"
              onPress={handleCancel}
            />
          ),
          headerRight: () => (
            <Button
              title={isSaving ? 'Saving...' : 'Done'}
              variant="ghost"
              size="small"
              onPress={handleDone}
              disabled={isSaving}
            />
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
          <TextInput
            style={[
              styles.titleInput,
              {
                color: theme.colors.text,
                borderBottomColor: theme.colors.borderLight,
              },
            ]}
            placeholder="Title (optional)"
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
            placeholder="What's on your mind?"
            placeholderTextColor={theme.colors.textTertiary}
            value={content}
            onChangeText={handleContentChange}
            multiline
            textAlignVertical="top"
            autoFocus
          />

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

          {isSaved && (
            <Text style={[styles.savedIndicator, { color: theme.colors.success }]}>
              Draft saved
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <TagPicker
        visible={isTagPickerVisible}
        onClose={() => setIsTagPickerVisible(false)}
        selectedTagIds={selectedTagIds}
        onTagsChange={handleTagsChange}
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
  titleInput: {
    fontSize: 24,
    fontFamily: fonts.serif.semiBold,
    paddingVertical: 16,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  contentInput: {
    fontSize: 18,
    lineHeight: 28,
    minHeight: 200,
    marginBottom: 24,
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
  savedIndicator: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
});

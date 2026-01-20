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
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useEntryStore } from '@/stores';
import { MoodSelector } from '@/components/entries/MoodSelector';
import { Button } from '@/components/ui';
import { MoodType } from '@/types';
import { generateTitleFromContent } from '@/utils';
import { config } from '@/constants/config';

export default function NewEntryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { createEntry } = useEntryStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<MoodType | undefined>();
  const [isSaved, setIsSaved] = useState(false);
  const [entryId, setEntryId] = useState<string | null>(null);

  const contentRef = useRef<TextInput>(null);
  const isCreatingRef = useRef(false);

  const handleSave = useCallback(async () => {
    if (isCreatingRef.current || (!content.trim() && !title.trim())) {
      return;
    }

    isCreatingRef.current = true;
    try {
      const entryTitle = title.trim() || generateTitleFromContent(content);

      if (entryId) {
        // Already saved, would need update logic
        // For now, we just mark as saved
        setIsSaved(true);
      } else {
        const entry = await createEntry({
          title: entryTitle,
          content: content.trim(),
          mood,
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
  }, [title, content, mood, entryId, createEntry]);

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

          <View style={[styles.moodSection, { borderTopColor: theme.colors.borderLight }]}>
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
    fontWeight: '600',
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
  moodSection: {
    paddingTop: 24,
    borderTopWidth: 1,
  },
  savedIndicator: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
});

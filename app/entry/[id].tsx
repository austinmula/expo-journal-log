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
import { useEntryStore } from '@/stores';
import { MoodSelector } from '@/components/entries/MoodSelector';
import { Button, LoadingState } from '@/components/ui';
import { MoodType } from '@/types';
import { formatDateTime } from '@/utils';
import { config } from '@/constants/config';

export default function EntryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getEntryById, updateEntry, deleteEntry, loadEntries } = useEntryStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<MoodType | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [createdAt, setCreatedAt] = useState<Date | null>(null);

  const contentRef = useRef<TextInput>(null);
  const hasLoadedRef = useRef(false);

  // Load entry data
  useEffect(() => {
    const loadEntry = async () => {
      if (hasLoadedRef.current || !id) return;
      hasLoadedRef.current = true;

      // Ensure entries are loaded first
      await loadEntries();

      const entry = getEntryById(id);
      if (entry) {
        setTitle(entry.title);
        setContent(entry.content);
        setMood(entry.mood);
        setCreatedAt(entry.createdAt);
      }
      setIsLoading(false);
    };

    loadEntry();
  }, [id, getEntryById, loadEntries]);

  const handleSave = useCallback(async () => {
    if (!id) return;

    try {
      await updateEntry(id, {
        title: title.trim() || 'Untitled',
        content: content.trim(),
        mood,
      });
    } catch (error) {
      console.error('Failed to save entry:', error);
    }
  }, [id, title, content, mood, updateEntry]);

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

              <View style={[styles.moodSection, { borderTopColor: theme.colors.borderLight }]}>
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

              {mood && (
                <View style={styles.moodDisplay}>
                  <Text style={styles.moodEmoji}>
                    {mood === 'great' ? '😊' :
                     mood === 'good' ? '🙂' :
                     mood === 'okay' ? '😐' :
                     mood === 'bad' ? '😔' : '😢'}
                  </Text>
                </View>
              )}

              <Text style={[styles.contentDisplay, { color: theme.colors.text }]}>
                {content || 'No content'}
              </Text>
            </Pressable>
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
    fontWeight: '600',
    paddingVertical: 16,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  titleDisplay: {
    fontSize: 28,
    fontWeight: '700',
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
  moodSection: {
    paddingTop: 24,
    borderTopWidth: 1,
  },
  moodDisplay: {
    marginBottom: 16,
  },
  moodEmoji: {
    fontSize: 32,
  },
  savingIndicator: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useTagStore } from '@/stores';
import { Tag } from '@/types';
import { Modal, Button } from '@/components/ui';
import { TagBadge } from './TagBadge';
import { colors } from '@/constants/colors';

interface TagPickerProps {
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
  visible: boolean;
  onClose: () => void;
}

export function TagPicker({
  selectedTagIds,
  onTagsChange,
  visible,
  onClose,
}: TagPickerProps) {
  const theme = useTheme();
  const { tags, loadTags, createTag } = useTagStore();
  const [newTagName, setNewTagName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (visible) {
      loadTags();
    }
  }, [visible, loadTags]);

  const handleToggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onTagsChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onTagsChange([...selectedTagIds, tagId]);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    setIsCreating(true);
    try {
      // Pick a random color from presets
      const color =
        colors.tagPresets[Math.floor(Math.random() * colors.tagPresets.length)];

      const tag = await createTag({
        name: newTagName.trim(),
        color,
      });

      // Auto-select the new tag
      onTagsChange([...selectedTagIds, tag.id]);
      setNewTagName('');
    } catch (error) {
      console.error('Failed to create tag:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Tags">
      <View style={styles.container}>
        {/* Selected tags */}
        {selectedTagIds.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
              Selected
            </Text>
            <View style={styles.tagList}>
              {selectedTagIds.map((tagId) => {
                const tag = tags.find((t) => t.id === tagId);
                if (!tag) return null;
                return (
                  <TagBadge
                    key={tag.id}
                    tag={tag}
                    selected
                    onPress={() => handleToggleTag(tag.id)}
                  />
                );
              })}
            </View>
          </View>
        )}

        {/* Available tags */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            {selectedTagIds.length > 0 ? 'Available' : 'All Tags'}
          </Text>
          {tags.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.colors.textTertiary }]}>
              No tags yet. Create one below.
            </Text>
          ) : (
            <View style={styles.tagList}>
              {tags
                .filter((tag) => !selectedTagIds.includes(tag.id))
                .map((tag) => (
                  <TagBadge
                    key={tag.id}
                    tag={tag}
                    onPress={() => handleToggleTag(tag.id)}
                  />
                ))}
            </View>
          )}
        </View>

        {/* Create new tag */}
        <View style={[styles.createSection, { borderTopColor: theme.colors.borderLight }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            Create New Tag
          </Text>
          <View style={styles.createRow}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                },
              ]}
              placeholder="Tag name"
              placeholderTextColor={theme.colors.textTertiary}
              value={newTagName}
              onChangeText={setNewTagName}
              onSubmitEditing={handleCreateTag}
              returnKeyType="done"
            />
            <Button
              title="Add"
              size="small"
              onPress={handleCreateTag}
              disabled={!newTagName.trim() || isCreating}
              loading={isCreating}
            />
          </View>
        </View>

        <Button
          title="Done"
          fullWidth
          onPress={onClose}
          style={{ marginTop: theme.spacing.md }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  createSection: {
    paddingTop: 16,
    borderTopWidth: 1,
  },
  createRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Modal, Button } from '@/components/ui';
import { Tag } from '@/types';
import { colors } from '@/constants/colors';

interface TagEditorProps {
  tag?: Tag;
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, color: string) => Promise<void>;
  onDelete?: () => void;
}

export function TagEditor({
  tag,
  visible,
  onClose,
  onSave,
  onDelete,
}: TagEditorProps) {
  const theme = useTheme();
  const [name, setName] = useState(tag?.name || '');
  const [selectedColor, setSelectedColor] = useState(tag?.color || colors.tagPresets[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens with new tag
  React.useEffect(() => {
    if (visible) {
      setName(tag?.name || '');
      setSelectedColor(tag?.color || colors.tagPresets[0]);
      setError(null);
    }
  }, [visible, tag]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Tag name is required');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSave(name.trim(), selectedColor);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save tag');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={tag ? 'Edit Tag' : 'Create Tag'}
    >
      <View style={styles.container}>
        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
            Name
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface,
                borderColor: error ? theme.colors.error : theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            placeholder="Enter tag name"
            placeholderTextColor={theme.colors.textTertiary}
            value={name}
            onChangeText={(text) => {
              setName(text);
              setError(null);
            }}
            autoFocus
          />
          {error && (
            <Text style={[styles.error, { color: theme.colors.error }]}>
              {error}
            </Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
            Color
          </Text>
          <View style={styles.colorGrid}>
            {colors.tagPresets.map((color) => (
              <Pressable
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorSelected,
                ]}
                onPress={() => setSelectedColor(color)}
              >
                {selectedColor === color && (
                  <Text style={styles.checkmark}>check</Text>
                )}
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.preview}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
            Preview
          </Text>
          <View
            style={[
              styles.previewBadge,
              { backgroundColor: `${selectedColor}20` },
            ]}
          >
            <Text style={[styles.previewText, { color: selectedColor }]}>
              {name || 'Tag name'}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title={tag ? 'Save Changes' : 'Create Tag'}
            onPress={handleSave}
            loading={isSaving}
            fullWidth
          />

          {tag && onDelete && (
            <Button
              title="Delete Tag"
              variant="ghost"
              onPress={onDelete}
              fullWidth
              textStyle={{ color: theme.colors.error }}
              style={{ marginTop: 8 }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: 'white',
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  preview: {
    marginBottom: 20,
  },
  previewBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 100,
  },
  previewText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    marginTop: 8,
  },
});

import { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Alert, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/hooks/useTheme';
import { useTagStore } from '@/stores';
import { tagRepository } from '@/services/tagRepository';
import { EmptyState, Button, Card } from '@/components/ui';
import { TagBadge, TagEditor } from '@/components/tags';
import { Tag } from '@/types';

export default function TagsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { tags, loadTags, createTag, updateTag, deleteTag } = useTagStore();

  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [tagEntryCounts, setTagEntryCounts] = useState<Record<string, number>>({});

  useFocusEffect(
    useCallback(() => {
      loadTags();
    }, [loadTags])
  );

  // Load entry counts for all tags
  useEffect(() => {
    const loadCounts = async () => {
      const counts: Record<string, number> = {};
      for (const tag of tags) {
        counts[tag.id] = await tagRepository.getEntryCountForTag(tag.id);
      }
      setTagEntryCounts(counts);
    };
    loadCounts();
  }, [tags]);

  const handleCreateTag = () => {
    setSelectedTag(null);
    setIsEditorVisible(true);
  };

  const handleEditTag = (tag: Tag) => {
    setSelectedTag(tag);
    setIsEditorVisible(true);
  };

  const handleSaveTag = async (name: string, color: string) => {
    if (selectedTag) {
      await updateTag(selectedTag.id, { name, color });
    } else {
      await createTag({ name, color });
    }
  };

  const handleDeleteTag = () => {
    if (!selectedTag) return;

    const entryCount = tagEntryCounts[selectedTag.id] || 0;

    Alert.alert(
      'Delete Tag',
      entryCount > 0
        ? `This tag is used in ${entryCount} ${entryCount === 1 ? 'entry' : 'entries'}. Deleting it will remove it from all entries.`
        : 'Are you sure you want to delete this tag?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTag(selectedTag.id);
            setIsEditorVisible(false);
          },
        },
      ]
    );
  };

  const handleViewTagEntries = (tag: Tag) => {
    router.push(`/tags/${tag.id}`);
  };

  const renderTag = ({ item }: { item: Tag }) => {
    const entryCount = tagEntryCounts[item.id] || 0;

    return (
      <Pressable
        onPress={() => handleViewTagEntries(item)}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        <Card style={styles.tagCard}>
          <View style={styles.tagContent}>
            <TagBadge tag={item} size="large" />
            <Text style={[styles.entryCount, { color: theme.colors.textSecondary }]}>
              {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
            </Text>
          </View>
          <Button
            title="Edit"
            variant="ghost"
            size="small"
            onPress={() => handleEditTag(item)}
          />
        </Card>
      </Pressable>
    );
  };

  if (tags.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <EmptyState
          icon="tag"
          title="No Tags Yet"
          description="Create tags to organize your journal entries by topics, themes, or categories."
          actionLabel="Create Tag"
          onAction={handleCreateTag}
        />
        <TagEditor
          visible={isEditorVisible}
          onClose={() => setIsEditorVisible(false)}
          onSave={handleSaveTag}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={tags}
        renderItem={renderTag}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { padding: theme.spacing.md },
        ]}
        ListHeaderComponent={
          <Button
            title="Create New Tag"
            variant="secondary"
            onPress={handleCreateTag}
            fullWidth
            style={{ marginBottom: theme.spacing.md }}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <TagEditor
        tag={selectedTag || undefined}
        visible={isEditorVisible}
        onClose={() => setIsEditorVisible(false)}
        onSave={handleSaveTag}
        onDelete={selectedTag ? handleDeleteTag : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
  },
  tagCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tagContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  entryCount: {
    fontSize: 14,
  },
});

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useCategoryStore } from '@/stores';
import { Category } from '@/types';
import { Modal, Button } from '@/components/ui';
import { CategoryBadge } from './CategoryBadge';

interface CategoryPickerProps {
  selectedCategoryId: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  visible: boolean;
  onClose: () => void;
}

export function CategoryPicker({
  selectedCategoryId,
  onCategoryChange,
  visible,
  onClose,
}: CategoryPickerProps) {
  const theme = useTheme();
  const { categories, loadCategories, isLoading } = useCategoryStore();

  useEffect(() => {
    if (visible) {
      loadCategories();
    }
  }, [visible, loadCategories]);

  const handleSelectCategory = (categoryId: string | null) => {
    onCategoryChange(categoryId);
    onClose();
  };

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  return (
    <Modal visible={visible} onClose={onClose} title="Select Category">
      <View style={styles.container}>
        {/* No category option */}
        <Pressable
          style={[
            styles.categoryItem,
            {
              backgroundColor: !selectedCategoryId
                ? theme.colors.primaryLight
                : theme.colors.surface,
              borderColor: !selectedCategoryId
                ? theme.colors.primary
                : theme.colors.border,
            },
          ]}
          onPress={() => handleSelectCategory(null)}
        >
          <View style={styles.categoryContent}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.colors.textTertiary + '20' },
              ]}
            >
              <Ionicons
                name="remove-circle-outline"
                size={20}
                color={theme.colors.textTertiary}
              />
            </View>
            <Text style={[styles.categoryName, { color: theme.colors.text }]}>
              No Category
            </Text>
          </View>
          {!selectedCategoryId && (
            <Ionicons
              name="checkmark-circle"
              size={22}
              color={theme.colors.primary}
            />
          )}
        </Pressable>

        {/* Category list */}
        <ScrollView style={styles.categoryList} showsVerticalScrollIndicator={false}>
          {categories.map((category) => (
            <Pressable
              key={category.id}
              style={[
                styles.categoryItem,
                {
                  backgroundColor:
                    selectedCategoryId === category.id
                      ? `${category.color}15`
                      : theme.colors.surface,
                  borderColor:
                    selectedCategoryId === category.id
                      ? category.color
                      : theme.colors.border,
                },
              ]}
              onPress={() => handleSelectCategory(category.id)}
            >
              <View style={styles.categoryContent}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: `${category.color}20` },
                  ]}
                >
                  {category.icon ? (
                    <Ionicons
                      name={category.icon as keyof typeof Ionicons.glyphMap}
                      size={20}
                      color={category.color}
                    />
                  ) : (
                    <View
                      style={[
                        styles.colorDot,
                        { backgroundColor: category.color },
                      ]}
                    />
                  )}
                </View>
                <Text style={[styles.categoryName, { color: theme.colors.text }]}>
                  {category.name}
                </Text>
              </View>
              {selectedCategoryId === category.id && (
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color={category.color}
                />
              )}
            </Pressable>
          ))}
        </ScrollView>

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

// Compact inline picker for use in entry form
interface CategoryPickerInlineProps {
  selectedCategoryId: string | null;
  onPress: () => void;
}

export function CategoryPickerInline({
  selectedCategoryId,
  onPress,
}: CategoryPickerInlineProps) {
  const theme = useTheme();
  const { categories } = useCategoryStore();

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  return (
    <Pressable
      style={[
        styles.inlinePicker,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
      onPress={onPress}
    >
      {selectedCategory ? (
        <CategoryBadge category={selectedCategory} size="medium" />
      ) : (
        <View style={styles.placeholderContent}>
          <Ionicons
            name="folder-outline"
            size={18}
            color={theme.colors.textTertiary}
          />
          <Text style={[styles.placeholderText, { color: theme.colors.textTertiary }]}>
            Select category
          </Text>
        </View>
      )}
      <Ionicons
        name="chevron-down"
        size={18}
        color={theme.colors.textTertiary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
  },
  categoryList: {
    maxHeight: 300,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '500',
  },
  inlinePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  placeholderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  placeholderText: {
    fontSize: 14,
  },
});

import { create } from 'zustand';
import { categoryRepository } from '@/services/categoryRepository';
import { Category, CreateCategoryInput, UpdateCategoryInput } from '@/types';

interface CategoryState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadCategories: () => Promise<void>;
  createCategory: (input: CreateCategoryInput) => Promise<Category>;
  updateCategory: (id: string, input: UpdateCategoryInput) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
  getCategoryById: (id: string) => Category | undefined;
  reorderCategories: (categoryIds: string[]) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,

  loadCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const categories = await categoryRepository.getAll();
      set({ categories, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load categories',
        isLoading: false,
      });
    }
  },

  createCategory: async (input) => {
    set({ error: null });
    try {
      const category = await categoryRepository.create(input);
      set((state) => ({
        categories: [...state.categories, category].sort(
          (a, b) => a.sortOrder - b.sortOrder
        ),
      }));
      return category;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create category';
      set({ error: message });
      throw error;
    }
  },

  updateCategory: async (id, input) => {
    set({ error: null });
    try {
      const category = await categoryRepository.update(id, input);
      set((state) => ({
        categories: state.categories
          .map((c) => (c.id === id ? category : c))
          .sort((a, b) => a.sortOrder - b.sortOrder),
      }));
      return category;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update category';
      set({ error: message });
      throw error;
    }
  },

  deleteCategory: async (id) => {
    set({ error: null });
    try {
      await categoryRepository.delete(id);
      set((state) => ({
        categories: state.categories.filter((c) => c.id !== id),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete category';
      set({ error: message });
      throw error;
    }
  },

  getCategoryById: (id) => {
    return get().categories.find((c) => c.id === id);
  },

  reorderCategories: async (categoryIds) => {
    set({ error: null });
    try {
      await categoryRepository.reorder(categoryIds);
      // Update local state with new order
      const reorderedCategories = categoryIds
        .map((id, index) => {
          const category = get().categories.find((c) => c.id === id);
          if (category) {
            return { ...category, sortOrder: index };
          }
          return null;
        })
        .filter((c): c is Category => c !== null);
      set({ categories: reorderedCategories });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reorder categories';
      set({ error: message });
      throw error;
    }
  },
}));
